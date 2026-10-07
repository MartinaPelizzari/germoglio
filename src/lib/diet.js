import { eatersOf, mealOf, mealOfItem, slotPeople } from './scale.js';
import { allergenLabel, recipeAllergens } from './allergens.js';
import { planViolations } from './dietPlan.js';

// Livelli dal più restrittivo al più ampio: una ricetta va bene per chi ha un livello pari o superiore.
export const DIETS = [
  { id: 'vegan', label: 'Vegana', level: 0 },
  { id: 'vegetarian', label: 'Vegetariana', level: 1 },
  { id: 'pescetarian', label: 'Pescetariana', level: 2 },
  { id: 'omnivore', label: 'Onnivora', level: 3 },
];
const LEVEL = Object.fromEntries(DIETS.map((d) => [d.id, d.level]));
export const dietLabel = (id) => DIETS.find((d) => d.id === id)?.label || 'Onnivora';

// Una ricetta senza dieta indicata si considera onnivora: è l'ipotesi prudente
export const recipeLevel = (r) => LEVEL[r.diet] ?? 3;
export const memberLevel = (m) => LEVEL[m?.diet] ?? 3;

// Regole condivise del nucleo più quelle personali di chi mangia (ognuno può avere le sue: "sempre la stessa colazione")
export const rulesFor = (household, day, slot, eaters = []) =>
  [...(household.rules || []), ...eaters.flatMap((m) => m.rules || [])].filter((r) => r.slots?.includes(slot) && r.days?.includes(day));

export const ruleCap = (rules) => rules.reduce((min, r) => (r.dietCap ? Math.min(min, LEVEL[r.dietCap]) : min), 3);

const splitList = (s = '') => s.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);

// Vincoli di un pasto: dieta più restrittiva tra chi mangia (limitata dalle regole condivise), asporto,
// ingredienti da evitare e intolleranze.
export const mealConstraints = (household, day, slot, eaters) => {
  const rules = rulesFor(household, day, slot, eaters);
  const cap = ruleCap(rules);
  const maxLevel = eaters.length ? Math.min(...eaters.map((m) => Math.min(memberLevel(m), cap))) : cap;
  return {
    maxLevel,
    takeaway: rules.some((r) => r.takeaway),
    avoid: [...new Set(eaters.flatMap((m) => splitList(m.avoid)))],
    intolerances: [...new Set(eaters.flatMap((m) => m.intolerances || []))],
    rules,
    eaters,
  };
};

// Pasti condivisi dalla famiglia (un solo pranzo/una sola cena per tutti, con menu separati solo per dieta diversa);
// gli altri sono individuali: ognuno ha il suo menu e può aggiungervi dei familiari.
export const DEFAULT_SHARED = ['Pranzo', 'Cena'];
export const sharedSlotsOf = (household) => household.sharedSlots ?? DEFAULT_SHARED;
// data.mode ('shared' | 'individual') è la scelta fatta sul singolo pasto; senza, vale l'impostazione di base della famiglia
export const isSharedSlot = (household, slot, data) => (data?.mode ? data.mode === 'shared' : sharedSlotsOf(household).includes(slot));

// data = pasto già pianificato: { joined: { idDiChiOspita: [idDeiFamiliariAggiunti] } }
export const menuClusters = (household, day, slot, people, data) => {
  if (!isSharedSlot(household, slot, data)) {
    const joined = data?.joined || {};
    const hostOf = (p) => people.find((h) => h.id !== p.id && (joined[h.id] || []).includes(p.id));
    const hosts = people.filter((p) => !hostOf(p));
    const clusters = hosts.map((h) => ({ level: memberLevel(h), host: h, eaters: [h, ...people.filter((p) => (joined[h.id] || []).includes(p.id))] }));
    return clusters.map((c) => ({ ...c, split: clusters.length > 1 }));
  }
  const main = slot === 'Pranzo' || slot === 'Cena';
  const cap = ruleCap(rulesFor(household, day, slot));
  const by = new Map();
  for (const p of people) {
    const level = main ? Math.min(memberLevel(p), cap, ruleCap(rulesFor(household, day, slot, [p]))) : 0;
    if (!by.has(level)) by.set(level, []);
    by.get(level).push(p);
  }
  if (!main) return [{ level: 0, eaters: people, split: false }];
  const clusters = [...by.entries()].sort((a, b) => a[0] - b[0]).map(([level, eaters]) => ({ level, eaters }));
  return clusters.map((c) => ({ ...c, split: clusters.length > 1 }));
};

export const containsAvoided = (recipe, avoid) =>
  avoid.some((w) => recipe.title.toLowerCase().includes(w) || (recipe.ingredients || []).some((i) => i.name.toLowerCase().includes(w)));

export const hasIntolerance = (recipe, list = []) => list.some((a) => recipeAllergens(recipe).has(a));

export const fits = (recipe, c, { ignoreTakeaway = false } = {}) =>
  recipeLevel(recipe) <= c.maxLevel && !containsAvoided(recipe, c.avoid) && !hasIntolerance(recipe, c.intolerances) &&
  (ignoreTakeaway || !c.takeaway || recipe.takeaway);

// Motivi per cui un piatto già nel piano non va bene a qualcuno (per mostrare un avviso)
export const problemsFor = (recipe, household, day, slot, eaters, item) => {
  const rules = rulesFor(household, day, slot, eaters);
  const cap = ruleCap(rules);
  const out = [];
  for (const m of eaters) {
    if (recipeLevel(recipe) > Math.min(memberLevel(m), cap)) out.push(`${m.name}: dieta ${dietLabel(m.diet).toLowerCase()}${cap < memberLevel(m) ? ' (regola condivisa)' : ''}`);
    else if (containsAvoided(recipe, splitList(m.avoid))) out.push(`${m.name}: ingrediente da evitare`);
    else {
      const bad = (m.intolerances || []).filter((a) => recipeAllergens(recipe).has(a));
      if (bad.length) out.push(`${m.name}: contiene ${bad.map((a) => allergenLabel(a).toLowerCase()).join(', ')}`);
      const off = planViolations(recipe, mealOfItem(m, slot, item).plan);
      if (off.length) out.push(`${m.name}: fuori dal piano (${[...new Set(off)].slice(0, 3).join(', ').toLowerCase()})`);
    }
  }
  if (rules.some((r) => r.takeaway) && !recipe.takeaway && !recipe.isFood) out.push('non adatta all\'asporto');
  return out;
};

export { eatersOf, mealOf, slotPeople };
