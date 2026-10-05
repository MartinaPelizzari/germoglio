// Frequenze settimanali indicate dalla nutrizionista (es. legumi 3 volte a settimana).
// Il conteggio è in pasti: un pasto con ceci e un altro con lenticchie sono 2 pasti con legumi.
import { eatersOf } from './scale.js';
import { FOOD_TYPES, foodLabel } from './foodTypes.js';
import { resolveItem } from './items.js';

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
  cache.set(recipe, set);
  return set;
};

// Numero di pasti della settimana in cui ognuno mangia ciascun tipo di alimento: { memberId: { foodId: n } }
export const weekSets = (plan, household, recipeMap) => {
  const seen = {};
  for (const [day, slots] of Object.entries(plan?.days || {})) {
    for (const [slot, data] of Object.entries(slots || {})) {
      for (const item of data?.items || []) {
        const recipe = resolveItem(item, recipeMap);
        if (!recipe) continue;
        const foods = recipeFoods(recipe);
        for (const m of eatersOf(item, household, slot, data)) {
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
