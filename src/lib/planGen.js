import { SLOTS, mealOf, slotPeople } from './scale.js';
import { kindFits, recipeKind, slotKind } from './meals.js';
import { fits, mealConstraints, menuClusters, memberLevel, recipeLevel, rulesFor } from './diet.js';
import { recipeFoods } from './goals.js';
import { recencyPenalty } from './usage.js';
import { coveredGroupIndexes, describeOption, foodDiet } from './dietPlan.js';
import { recipeAllergens } from './allergens.js';
import { containsAvoided } from './diet.js';
import { resolveItem } from './items.js';

// ---- componenti (modo senza piano scritto): carboidrati, proteine, verdure
export const coveredGroups = (recipes) => {
  const set = new Set();
  for (const r of recipes) for (const i of r.ingredients || []) if (i.qty > 0 || i.unit === 'q.b.') set.add(i.group);
  return set;
};
export const missingGroups = (required, recipes) => {
  const have = coveredGroups(recipes);
  return required.filter((g) => !have.has(g));
};
export const coarseRequired = (slot) => (slotKind(slot) === 'principale' ? ['carb', 'protein', 'veg'] : []);

// ---- piano della nutrizionista: ogni gruppo di alternative di ogni persona va coperto
export const planPairs = (eaters, slot) =>
  eaters.flatMap((e) => mealOf(e, slot).plan.map((group, gi) => ({ eater: e, gi, group })));

const covers = (recipe, pair, slot) => coveredGroupIndexes(recipe, mealOf(pair.eater, slot).plan).includes(pair.gi);

export const uncoveredPairs = (recipes, eaters, slot) =>
  planPairs(eaters, slot).filter((p) => !recipes.some((r) => covers(r, p, slot)));

export const pairLabel = (pair) => pair.group.options.slice(0, 2).map(describeOption).join(' o ');

// ---- alimenti semplici per i gruppi del piano che nessuna ricetta copre
const optionFitsPerson = (opt, person) => {
  const pseudo = { title: opt.name, ingredients: [{ name: opt.name }] };
  const allergic = (person.intolerances || []).some((a) => recipeAllergens(pseudo).has(a));
  const avoided = containsAvoided(pseudo, (person.avoid || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
  const level = { vegan: 0, vegetarian: 1, pescetarian: 2, omnivore: 3 }[foodDiet(opt.name)];
  return level <= memberLevel(person) && !allergic && !avoided;
};

const pickOption = (pair, state) => {
  const opts = pair.group.options.filter((o) => optionFitsPerson(o, pair.eater));
  const pool = opts.length ? opts : pair.group.options;
  return [...pool].sort((a, b) => (state.used.get(`food:${a.name}`) || 0) - (state.used.get(`food:${b.name}`) || 0) || Math.random() - 0.5)[0];
};

const entry = (recipe, eaters) => ({ instanceId: crypto.randomUUID(), recipeId: recipe.id, ...(eaters ? { eaters } : {}) });

// ---- stato e punteggio
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

const baseScore = (recipe, eaters, state, preferLevel) =>
  - (state.used.get(recipe.id) || 0) * 6
  - recencyPenalty(state.recency.get(recipe.id))
  + (state.favorites.has(recipe.id) ? 5 : 0)
  + goalBonus(recipe, eaters, state)
  + (preferLevel !== undefined && recipeLevel(recipe) === preferLevel ? 8 : 0)
  + Math.random() * 5;

const best = (pool, scoreFn) => (pool.length ? pool.map((r) => [r, scoreFn(r)]).sort((a, b) => b[1] - a[1])[0][0] : null);

// ---- un menu per un gruppo di persone con vincoli comuni
// Con il piano scritto: sceglie ricette che coprono i gruppi del piano di ognuno, poi aggiunge alimenti semplici.
// Senza piano: pasto equilibrato (carboidrati, proteine, verdure) per i pasti principali.
export const proposeMenu = (recipes, constraints, slot, state, { split = false, level } = {}) => {
  const eaters = constraints.eaters || [];
  const ids = split ? eaters.map((e) => e.id) : undefined;
  const main = slotKind(slot) === 'principale';
  let relaxed = false;
  let pool = recipes.filter((r) => kindFits(r, slot) && fits(r, constraints));
  if (!pool.length && constraints.takeaway) { pool = recipes.filter((r) => kindFits(r, slot) && fits(r, constraints, { ignoreTakeaway: true })); relaxed = true; }
  const pref = split ? level : undefined;
  const chosen = [];
  const items = [];

  const pairs = planPairs(eaters, slot);
  if (pairs.length) {
    for (let n = 0; n < 3; n++) {
      const rem = uncoveredPairs(chosen, eaters, slot);
      if (!rem.length) break;
      const gain = (r) => rem.filter((p) => covers(r, p, slot)).length;
      const pick = best(pool.filter((r) => !chosen.includes(r) && gain(r) > 0), (r) => gain(r) * 10 + baseScore(r, eaters, state, pref));
      if (!pick) break;
      chosen.push(pick);
    }
    chosen.forEach((r) => items.push(entry(r, ids)));
    // gruppi non coperti da nessuna ricetta: alimenti semplici dal piano
    const foods = new Map();
    for (const p of uncoveredPairs(chosen, eaters, slot)) {
      const opt = pickOption(p, state);
      const key = opt.name.toLowerCase();
      if (!foods.has(key)) foods.set(key, { food: { name: opt.name, qty: opt.qty, unit: opt.unit, group: opt.group }, eaters: new Set() });
      foods.get(key).eaters.add(p.eater.id);
    }
    for (const f of foods.values()) items.push({ instanceId: crypto.randomUUID(), food: f.food, eaters: [...f.eaters] });
    return { items, relaxed };
  }

  const required = coarseRequired(slot);
  const mainPool = pool.filter((r) => (main ? recipeKind(r) === 'principale' : true));
  const first = best(mainPool.length ? mainPool : pool, (r) => required.filter((g) => coveredGroups([r]).has(g)).length * 10 + baseScore(r, eaters, state, pref));
  if (!first) return { items: [], relaxed };
  chosen.push(first);
  for (let n = 0; n < 2; n++) {
    const missing = missingGroups(required, chosen);
    if (!missing.length) break;
    const side = best(
      recipes.filter((r) => ['contorno', 'principale'].includes(recipeKind(r)) && main && !chosen.includes(r) && fits(r, constraints, { ignoreTakeaway: !constraints.takeaway ? true : relaxed }) && missing.some((g) => coveredGroups([r]).has(g))),
      (r) => missing.filter((g) => coveredGroups([r]).has(g)).length * 10 + baseScore(r, eaters, state, pref)
    );
    if (!side) break;
    chosen.push(side);
  }
  return { items: chosen.map((r) => entry(r, ids)), relaxed };
};

// Registra un pasto nello stato (piatti usati e pasti per obiettivo)
export const registerMeal = (state, items, clusterEaters, day, slot, recipeMap, everyone) => {
  for (const it of items) {
    if (!it.leftoverOf) state.used.set(it.food ? `food:${it.food.name}` : it.recipeId, (state.used.get(it.food ? `food:${it.food.name}` : it.recipeId) || 0) + 1);
    const recipe = resolveItem(it, recipeMap);
    if (!recipe) continue;
    const eaters = Array.isArray(it.eaters) ? (everyone || clusterEaters).filter((e) => it.eaters.includes(e.id)) : clusterEaters;
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
      const people = slotPeople(household, slot, prevData);
      if (!people.length) continue;
      const batch = Math.max(1, ...rulesFor(household, d, slot).map((r) => r.batch || 1));
      const items = [];
      for (const cluster of menuClusters(household, d, slot, people)) {
        const c = mealConstraints(household, d, slot, cluster.eaters);
        const key = `${slot}:${cluster.eaters.map((e) => e.id).sort().join(',')}`;
        const prev = carry[key];
        let menu;
        if (batch > 1 && prev?.left > 0 && prev.items.every((it) => { const r = resolveItem(it, recipeMap); return r && fits(r, c, { ignoreTakeaway: true }); })) {
          menu = prev.items.map((it) => ({ ...it, instanceId: crypto.randomUUID(), leftoverOf: it.leftoverOf || it.instanceId, leftoverDay: prev.day }));
          prev.left--;
        } else {
          menu = proposeMenu(recipes, c, slot, state, cluster).items;
          if (batch > 1 && menu.length) carry[key] = { left: batch - 1, items: menu, day: d };
          else delete carry[key];
        }
        registerMeal(state, menu, cluster.eaters, d, slot, recipeMap, people);
        items.push(...menu);
      }
      if (items.length) days[d][slot] = { items, ...(prevData?.absent?.length ? { absent: prevData.absent } : {}), ...(prevData?.guests?.length ? { guests: prevData.guests } : {}) };
    }
  }
  return days;
};

// Sostituisce un piatto con un altro dello stesso tipo adatto a chi mangia, preferendo quelli che coprono
// gli stessi gruppi del piano, non fatti di recente, e i preferiti
export const swapRecipe = (recipes, current, constraints, ctx = {}, slot) => {
  if (!current || current.isFood) return null;
  const state = newState(ctx);
  const eaters = constraints.eaters || [];
  const kind = recipeKind(current);
  const had = planPairs(eaters, slot).filter((p) => covers(current, p, slot));
  const pool = recipes.filter((r) => r.id !== current.id && recipeKind(r) === kind && fits(r, constraints));
  const pick = best(pool, (r) => had.filter((p) => covers(r, p, slot)).length * 10 + baseScore(r, eaters, state));
  return pick ? entry(pick) : null;
};
