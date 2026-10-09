// Frequenze settimanali indicate dalla nutrizionista (es. legumi 3 volte a settimana).
// Il conteggio è in pasti: un pasto con ceci e un altro con lenticchie sono 2 pasti con legumi.
// Per legumi, pesce, carne, uova e formaggi conta solo la fonte proteica principale del pasto (protein.js), non ogni ingrediente.
import { eatersOf, householdOnDay } from './scale.js';
import { FOOD_TYPES, foodLabel } from './foodTypes.js';
import { resolveItem } from './items.js';
import { PROTEIN_TYPES, proteinSourceOf } from './protein.js';

export { FOOD_TYPES, foodLabel };

export const GOAL_MODES = [
  { id: 'min', label: 'almeno' },
  { id: 'exact', label: 'esattamente' },
  { id: 'max', label: 'al massimo' },
];

const cache = new WeakMap();
export const recipeFoods = (recipe) => {
  if (cache.has(recipe)) return cache.get(recipe);
  const set = new Set();
  const names = [recipe.title, ...(recipe.ingredients || []).map((i) => i.name)].map((s) => (s || '').toLowerCase());
  for (const f of FOOD_TYPES) {
    // "latte di soia" e simili non contano come soia/legumi: le parole sono volutamente specifiche
    if (names.some((n) => f.words.some((w) => n.includes(w)))) set.add(f.id);
  }
  // legumi, pesce, carne, uova, formaggi contano per la sola fonte proteica principale del pasto (un solo gruppo per pasto)
  for (const t of PROTEIN_TYPES) set.delete(t);
  const main = proteinSourceOf(recipe);
  if (main) set.add(main);
  cache.set(recipe, set);
  return set;
};

// Alimenti di un piatto per un certo pasto: i gruppi proteici (legumi, pesce, carne, uova, formaggi) contano solo a pranzo e a cena;
// un uovo a colazione o l'hummus di uno spuntino non fanno 'un pasto con uova' o 'con legumi'
export const foodsAtSlot = (recipe, slot) => {
  const all = recipeFoods(recipe);
  return ['Pranzo', 'Cena'].includes(slot) ? all : new Set([...all].filter((f) => !PROTEIN_TYPES.includes(f)));
};

// Numero di pasti della settimana in cui ognuno mangia ciascun tipo di alimento: { memberId: { foodId: n } }
export const weekSets = (plan, household, recipeMap) => {
  const seen = {};
  for (const [day, slots] of Object.entries(plan?.days || {})) {
    const hh = householdOnDay(household, Number(day), slots);
    for (const [slot, data] of Object.entries(slots || {})) {
      for (const item of data?.items || []) {
        const recipe = resolveItem(item, recipeMap);
        if (!recipe) continue;
        const foods = foodsAtSlot(recipe, slot);
        for (const m of eatersOf(item, hh, slot, data)) {
          if (m.id.startsWith('g-')) continue; // gli ospiti non hanno obiettivi
          for (const f of foods) ((seen[m.id] ||= {})[f] ||= new Set()).add(`${day}|${slot}`);
        }
      }
    }
  }
  return seen;
};

export const weekCounts = (plan, household, recipeMap) =>
  Object.fromEntries(Object.entries(weekSets(plan, household, recipeMap)).map(([m, foods]) => [m, Object.fromEntries(Object.entries(foods).map(([f, s]) => [f, s.size]))]));

// 'ok' obiettivo rispettato, 'short' mancano pasti, 'over' superato
export const goalStatus = (goal, count = 0) => {
  if (goal.mode === 'max') return count <= goal.times ? 'ok' : 'over';
  if (goal.mode === 'exact') return count === goal.times ? 'ok' : count < goal.times ? 'short' : 'over';
  return count >= goal.times ? 'ok' : 'short';
};
