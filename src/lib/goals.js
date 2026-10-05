// Frequenze settimanali indicate dalla nutrizionista (es. legumi 3 volte a settimana).
// Il conteggio è in pasti: un pasto con ceci e un altro con lenticchie sono 2 pasti con legumi.
import { eatersOf } from './scale.js';

export const FOOD_TYPES = [
  { id: 'legumi', label: 'Legumi', words: ['ceci', 'lenticchie', 'fagioli', 'piselli', 'fave', 'edamame', 'lupini', 'hummus', 'farina di ceci', 'soia gialla', 'cicerchie', 'borlotti', 'cannellini', 'tofu', 'tempeh'] },
  { id: 'pesce', label: 'Pesce', words: ['tonno', 'salmone', 'merluzzo', 'gamberi', 'gamberetti', 'acciughe', 'alici', 'orata', 'branzino', 'pesce', 'calamari', 'polpo', 'cozze', 'vongole', 'sgombro', 'sardine', 'baccalà', 'trota', 'seppie'] },
  { id: 'carne-bianca', label: 'Carne bianca', words: ['pollo', 'tacchino', 'coniglio'] },
  { id: 'carne-rossa', label: 'Carne rossa', words: ['manzo', 'maiale', 'vitello', 'agnello', 'salsiccia', 'bistecca', 'macinato', 'hamburger', 'polpette di carne', 'ragù di carne'] },
  { id: 'salumi', label: 'Salumi', words: ['prosciutto', 'pancetta', 'speck', 'bresaola', 'salame', 'mortadella', 'guanciale', 'wurstel'] },
  { id: 'uova', label: 'Uova', words: ['uova', 'uovo', 'frittata', 'omelette'] },
  { id: 'formaggi', label: 'Formaggi', words: ['formaggio', 'parmigiano', 'ricotta', 'feta', 'mozzarella', 'pecorino', 'grana', 'caprino', 'stracchino', 'mascarpone', 'scamorza', 'halloumi'] },
  { id: 'frutta-secca', label: 'Frutta secca e semi', words: ['noci', 'mandorl', 'nocciol', 'pistacch', 'anacard', 'pinoli', 'semi di', 'arachid', 'tahin'] },
  { id: 'cereali-integrali', label: 'Cereali integrali', words: ['integral', 'farro', 'orzo', 'avena', 'quinoa', 'grano saraceno', 'miglio', 'riso nero', 'bulgur'] },
  { id: 'verdure-foglia', label: 'Verdure a foglia', words: ['spinaci', 'bietol', 'rucola', 'lattuga', 'insalata', 'cavolo nero', 'radicchio', 'valeriana', 'cicoria', 'cime di rapa', 'broccol'] },
];

export const GOAL_MODES = [
  { id: 'min', label: 'almeno' },
  { id: 'exact', label: 'esattamente' },
  { id: 'max', label: 'al massimo' },
];

export const foodLabel = (id) => FOOD_TYPES.find((f) => f.id === id)?.label || id;

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
        const recipe = recipeMap.get(item.recipeId);
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
