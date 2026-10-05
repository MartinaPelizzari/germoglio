import { SLOT_CATEGORY, eatersOf, mealOf, slotPeople } from './scale.js';
import { allergenLabel, recipeAllergens } from './allergens.js';

// Livelli dal più restrittivo al più ampio: una ricetta va bene per chi ha un livello pari o superiore.
export const DIETS = [
  { id: 'vegan', label: 'Vegana', short: 'Vegana', level: 0 },
  { id: 'vegetarian', label: 'Vegetariana', short: 'Vegetariana', level: 1 },
  { id: 'pescetarian', label: 'Pescetariana', short: 'Pescetariana', level: 2 },
  { id: 'omnivore', label: 'Onnivora', short: 'Onnivora', level: 3 },
];
const LEVEL = Object.fromEntries(DIETS.map((d) => [d.id, d.level]));
export const dietLabel = (id) => DIETS.find((d) => d.id === id)?.label || 'Onnivora';

// Una ricetta senza dieta indicata si considera onnivora: è l'ipotesi prudente
export const recipeLevel = (r) => LEVEL[r.diet] ?? 3;
export const memberLevel = (m) => LEVEL[m?.diet] ?? 3;

export const rulesFor = (household, day, slot) =>
  (household.rules || []).filter((r) => r.slots?.includes(slot) && r.days?.includes(day));

const ruleCap = (rules) => rules.reduce((min, r) => (r.dietCap ? Math.min(min, LEVEL[r.dietCap]) : min), 3);

// Vincoli di un pasto: dieta più restrittiva tra chi mangia (limitata dalle regole condivise), asporto,
// ingredienti da evitare e componenti che il pasto deve coprire (dalle dosi indicate dalla nutrizionista).
export const mealConstraints = (household, day, slot, eaters) => {
  const rules = rulesFor(household, day, slot);
  const cap = ruleCap(rules);
  const maxLevel = eaters.length ? Math.min(...eaters.map((m) => Math.min(memberLevel(m), cap))) : Math.min(3, cap);
  const avoid = [...new Set(eaters.flatMap((m) => (m.avoid || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)))];
  const targeted = new Set(eaters.flatMap((m) => Object.keys(mealOf(m, slot).targets).filter((g) => Number(mealOf(m, slot).targets[g]) > 0)));
  const intolerances = [...new Set(eaters.flatMap((m) => m.intolerances || []))];
  const main = slot === 'Pranzo' || slot === 'Cena';
  const required = targeted.size ? [...targeted].filter((g) => ['carb', 'protein', 'veg'].includes(g)) : main ? ['carb', 'protein', 'veg'] : [];
  return { maxLevel, takeaway: rules.some((r) => r.takeaway), avoid, intolerances, required, rules, eaters };
};

export const containsAvoided = (recipe, avoid) =>
  avoid.some((w) => recipe.title.toLowerCase().includes(w) || (recipe.ingredients || []).some((i) => i.name.toLowerCase().includes(w)));

export const hasIntolerance = (recipe, list = []) => list.some((a) => recipeAllergens(recipe).has(a));

export const fits = (recipe, c, { ignoreTakeaway = false } = {}) =>
  recipeLevel(recipe) <= c.maxLevel && !containsAvoided(recipe, c.avoid) && !hasIntolerance(recipe, c.intolerances) && (ignoreTakeaway || !c.takeaway || recipe.takeaway);

// Motivi per cui un piatto già nel piano non va bene a qualcuno (per mostrare un avviso)
export const problemsFor = (recipe, household, day, slot, eaters) => {
  const rules = rulesFor(household, day, slot);
  const cap = ruleCap(rules);
  const out = [];
  for (const m of eaters) {
    if (recipeLevel(recipe) > Math.min(memberLevel(m), cap)) out.push(`${m.name}: dieta ${dietLabel(m.diet).toLowerCase()}${cap < memberLevel(m) ? ' (regola condivisa)' : ''}`);
    else if (containsAvoided(recipe, (m.avoid || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))) out.push(`${m.name}: ingrediente da evitare`);
    else {
      const bad = (m.intolerances || []).filter((a) => recipeAllergens(recipe).has(a));
      if (bad.length) out.push(`${m.name}: contiene ${bad.map((a) => allergenLabel(a).toLowerCase()).join(', ')}`);
    }
  }
  if (rules.some((r) => r.takeaway) && !recipe.takeaway) out.push('non adatta all\'asporto');
  return out;
};

export { SLOT_CATEGORY, eatersOf };
