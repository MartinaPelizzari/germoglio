import { SLOTS, SLOT_CATEGORY, slotPeople } from './scale.js';
import { fits, mealConstraints, rulesFor } from './diet.js';
import { recipeFoods } from './goals.js';
import { recencyPenalty } from './usage.js';

// Componenti presenti in un insieme di ricette (con almeno un ingrediente di quel gruppo)
export const coveredGroups = (recipes) => {
  const set = new Set();
  for (const r of recipes) for (const i of r.ingredients || []) if (i.qty > 0 || i.unit === 'q.b.') set.add(i.group);
  return set;
};
export const missingGroups = (required, recipes) => {
  const have = coveredGroups(recipes);
  return required.filter((g) => !have.has(g));
};

const entry = (recipe) => ({ instanceId: crypto.randomUUID(), recipeId: recipe.id });

// Stato della generazione: piatti già usati, storico, preferiti e pasti già coperti per ogni obiettivo settimanale
export const newState = ({ favorites, recency, counts } = {}) => ({
  used: new Map(),
  favorites: favorites || new Set(),
  recency: recency || new Map(),
  counts: counts || {}, // memberId -> foodId -> Set di "giorno|pasto"
});

const goalBonus = (recipe, eaters, state) => {
  const foods = recipeFoods(recipe);
  let bonus = 0;
  for (const m of eaters) {
    for (const g of m.goals || []) {
      if (!foods.has(g.food)) continue;
      const n = state.counts[m.id]?.[g.food]?.size || 0;
      if ((g.mode === 'max' || g.mode === 'exact') && n >= g.times) bonus -= 10;
      else if (g.mode !== 'max' && n < g.times) bonus += 4;
    }
  }
  return bonus;
};

const score = (recipe, required, eaters, state) => {
  const cover = required.filter((g) => coveredGroups([recipe]).has(g)).length;
  return cover * 10
    - (state.used.get(recipe.id) || 0) * 6
    - recencyPenalty(state.recency.get(recipe.id))
    + (state.favorites.has(recipe.id) ? 5 : 0)
    + goalBonus(recipe, eaters, state)
    + Math.random() * 5;
};
const best = (pool, required, eaters, state) => (pool.length ? pool.map((r) => [r, score(r, required, eaters, state)]).sort((a, b) => b[1] - a[1])[0][0] : null);

// Propone un pasto equilibrato: un piatto principale adatto a chi mangia (dieta, intolleranze, asporto, componenti
// richieste, storico, preferiti, frequenze settimanali) e, se mancano carboidrati, proteine o verdure, uno o due piatti per completarlo.
export const proposeMeal = (recipes, constraints, slot, state) => {
  const category = SLOT_CATEGORY[slot];
  const eaters = constraints.eaters || [];
  let pool = recipes.filter((r) => r.category === category && fits(r, constraints));
  let relaxed = false;
  if (!pool.length && constraints.takeaway) { pool = recipes.filter((r) => r.category === category && fits(r, constraints, { ignoreTakeaway: true })); relaxed = true; }
  const main = best(pool, constraints.required, eaters, state);
  if (!main) return { items: [], relaxed };
  const chosen = [main];
  for (let n = 0; n < 2; n++) {
    const missing = missingGroups(constraints.required, chosen);
    if (!missing.length) break;
    const side = best(
      recipes.filter((r) => ['Contorno', category].includes(r.category) && !chosen.includes(r) && fits(r, constraints, { ignoreTakeaway: !constraints.takeaway ? true : relaxed }) && missing.some((g) => coveredGroups([r]).has(g))),
      missing, eaters, state
    );
    if (!side) break;
    chosen.push(side);
  }
  return { items: chosen.map(entry), relaxed };
};

// Registra un pasto nello stato (piatti usati e pasti per obiettivo)
export const registerMeal = (state, items, eaters, day, slot, recipeMap) => {
  for (const it of items) {
    if (!it.leftoverOf) state.used.set(it.recipeId, (state.used.get(it.recipeId) || 0) + 1);
    const recipe = recipeMap.get(it.recipeId);
    if (!recipe) continue;
    for (const f of recipeFoods(recipe)) for (const m of eaters) ((state.counts[m.id] ||= {})[f] ||= new Set()).add(`${day}|${slot}`);
  }
};

// Settimana intera. Con una regola "cucina una volta ogni N giorni" lo stesso piatto torna come avanzo nei giorni successivi.
export const generateWeek = (recipes, household, ctx = {}) => {
  const state = newState(ctx);
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const carry = {};
  const days = {};
  for (let d = 0; d < 7; d++) {
    days[d] = {};
    for (const slot of SLOTS) {
      // assenti e ospiti già indicati nel piano esistente restano al loro posto
      const prevData = ctx.existing?.[d]?.[slot];
      const eaters = slotPeople(household, slot, prevData);
      if (!eaters.length) continue;
      const c = mealConstraints(household, d, slot, eaters);
      const batch = Math.max(1, ...rulesFor(household, d, slot).map((r) => r.batch || 1));
      let items;
      const prev = carry[slot];
      if (batch > 1 && prev?.left > 0 && prev.items.every((it) => recipeMap.get(it.recipeId) && fits(recipeMap.get(it.recipeId), c))) {
        items = prev.items.map((it) => ({ instanceId: crypto.randomUUID(), recipeId: it.recipeId, leftoverOf: it.instanceId, leftoverDay: prev.day }));
        prev.left--;
      } else {
        items = proposeMeal(recipes, c, slot, state).items;
        if (batch > 1 && items.length) carry[slot] = { left: batch - 1, items, day: d };
        else delete carry[slot];
      }
      registerMeal(state, items, eaters, d, slot, recipeMap);
      if (items.length) days[d][slot] = { items, ...(prevData?.absent?.length ? { absent: prevData.absent } : {}), ...(prevData?.guests?.length ? { guests: prevData.guests } : {}) };
    }
  }
  return days;
};

// Sostituisce un singolo piatto con un altro della stessa categoria che vada bene per chi mangia,
// preferendo quelli non fatti di recente e i preferiti
export const swapRecipe = (recipes, current, constraints, ctx = {}) => {
  const state = newState(ctx);
  const pool = recipes.filter((r) => r.category === current.category && r.id !== current.id && fits(r, constraints));
  const pick = best(pool, [], constraints.eaters || [], state);
  return pick ? entry(pick) : null;
};
