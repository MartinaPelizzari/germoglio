// Tipo di pasto di una ricetta. Non è più una classificazione scelta dall'utente: quando una persona ha un piano
// alimentare scritto, le ricette si scelgono dal piano. Questo tipo resta come indizio automatico per evitare, ad
// esempio, un porridge dolce a cena quando nessuno ha un piano. Per le ricette precaricate arriva dal ricettario
// (campo interno "category"), per le altre si deduce dagli ingredienti.
import { guessGroup } from './groups.js';

export const SLOTS = ['Colazione', 'Spuntino 1', 'Pranzo', 'Spuntino 2', 'Cena'];
export const slotKind = (slot) => ({ Colazione: 'colazione', 'Spuntino 1': 'spuntino', 'Spuntino 2': 'spuntino', Pranzo: 'principale', Cena: 'principale' })[slot] || 'principale';

const KIND_FROM_CATEGORY = { Colazione: 'colazione', Spuntino: 'spuntino', Pranzo: 'principale', Cena: 'principale', Contorno: 'contorno' };
const SAVORY = ['pasta', 'riso', 'ceci', 'lenticchie', 'fagioli', 'tofu', 'seitan', 'tempeh', 'pollo', 'manzo', 'pesce', 'salmone', 'tonno', 'patate', 'cipolla', 'aglio', 'pomodor', 'zucchin', 'carote', 'melanzan', 'farro', 'orzo', 'quinoa', 'couscous'];
const BREAKFAST = ['latte', 'yogurt', 'fiocchi', 'avena', 'marmellata', 'cacao', 'miele', 'banana', 'cereali', 'granola', 'fette biscottate'];

const cache = new WeakMap();
export const recipeKind = (recipe) => {
  if (cache.has(recipe)) return cache.get(recipe);
  let kind = KIND_FROM_CATEGORY[recipe.category];
  if (!kind) {
    const names = (recipe.ingredients || []).map((i) => (i.name || '').toLowerCase());
    const has = (words) => names.some((n) => words.some((w) => n.includes(w)));
    const fruitOnly = names.length > 0 && names.every((n) => ['fruit', 'fat', 'other'].includes(guessGroup(n)));
    kind = has(SAVORY) ? 'principale' : fruitOnly ? 'spuntino' : has(BREAKFAST) ? 'colazione' : 'principale';
  }
  cache.set(recipe, kind);
  return kind;
};

// Un piatto è adatto a un pasto se ne ha il tipo; i contorni accompagnano i pasti principali
export const kindFits = (recipe, slot) => {
  const k = recipeKind(recipe);
  const s = slotKind(slot);
  if (s === 'principale') return k === 'principale' || k === 'contorno';
  if (s === 'colazione') return k === 'colazione' || k === 'spuntino';
  return k === 'spuntino' || k === 'colazione';
};
