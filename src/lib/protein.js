// Fonte proteica principale di un piatto o di un alimento del piano.
// Le frequenze settimanali ("legumi almeno 2 volte", "pesce esattamente 2") contano i PASTI per la loro sola fonte proteica principale,
// non ogni ingrediente: un contorno con due ceci o una zuppa con un po' di pancetta non sono "un pasto con legumi" o "con carne".
import { FOOD_TYPES } from './foodTypes.js';

export const PROTEIN_TYPES = ['legumi', 'pesce', 'carne-bianca', 'carne-rossa', 'salumi', 'uova', 'formaggi'];
const WORDS = Object.fromEntries(FOOD_TYPES.filter((f) => PROTEIN_TYPES.includes(f.id)).map((f) => [f.id, f.words]));

// tipo di fonte proteica di un nome ("filetto di salmone" → pesce); i latti vegetali e simili non sono proteine
export const proteinTypeOfName = (name = '') => {
  const n = name.toLowerCase();
  if (/latte|bevanda|yogurt|olio|burro di|crema di (nocciole|mandorle|arachidi)/.test(n)) return null;
  // nomi generici del piano ("carne bianca", "carne rossa", "legumi")
  if (/carne bianca/.test(n)) return 'carne-bianca';
  if (/carne rossa|carne di (manzo|maiale|vitello)|cavallo|maiale/.test(n)) return 'carne-rossa';
  if (/\blegum/.test(n)) return 'legumi';
  // ordine di priorità: la parola più specifica per prima (pesce, carne, uova prima di legumi come "hummus")
  for (const id of ['pesce', 'carne-bianca', 'carne-rossa', 'salumi', 'uova', 'formaggi', 'legumi']) if (WORDS[id].some((w) => n.includes(w))) return id;
  return null;
};

const grams = (i) => (['g', 'ml'].includes(i.unit) ? i.qty : i.unit === 'pz' ? i.qty * 55 : i.unit === 'cucchiai' ? i.qty * 10 : 0);
const MIN_MAIN = 40; // sotto questa quantità è un ingrediente di contorno, non la fonte proteica del pasto

const cache = new WeakMap();
// { type, grams } della fonte principale oppure null (piatto di soli carboidrati e verdure)
export const mainProtein = (recipe) => {
  if (cache.has(recipe)) return cache.get(recipe);
  let best = null;
  for (const ing of recipe.ingredients || []) {
    const type = ing.group === 'protein' || ing.group === 'other' || !ing.group ? proteinTypeOfName(ing.name) : null;
    const g = grams(ing);
    if (type && g >= MIN_MAIN && (!best || g > best.grams)) best = { type, grams: g };
  }
  // un piatto senza ingredienti proteici evidenti ma con la fonte nel titolo ("Frittata", "Polpette di carne")
  if (!best && !recipe.isFood) { const t = proteinTypeOfName(recipe.title || ''); if (t && (recipe.ingredients || []).some((i) => i.group === 'protein')) best = { type: t, grams: MIN_MAIN }; }
  cache.set(recipe, best);
  return best;
};
export const proteinSourceOf = (recipe) => mainProtein(recipe)?.type || null;
