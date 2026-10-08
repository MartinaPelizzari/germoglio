import { canonicalName, normalizeIngredient } from './scale.js';
import { pieceGrams } from './nutrition.js';

export const STAPLES = ['Sale', 'Pepe', 'Olio extravergine d\'oliva', 'Zucchero', 'Aceto', 'Farina', 'Spezie', 'Lievito alimentare'];

const norm = (s) => ` ${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()} `;

// Quanto ne hai nella stessa unità della lista; pezzi e grammi si convertono col peso medio del pezzo, se noto (es. 2 uova = 100 g)
const haveOf = (stock, i) => {
  const base = canonicalName(i.name);
  const direct = stock.get(`${base}|${i.unit}`) || 0;
  if (direct) return direct;
  const pg = pieceGrams(i.name);
  if (!pg) return 0;
  if (i.unit === 'pz') return Math.round(((stock.get(`${base}|g`) || 0) / pg) * 10) / 10;
  if (i.unit === 'g') return Math.round((stock.get(`${base}|pz`) || 0) * pg);
  return 0;
};

// Scorte che corrispondono a una voce (stesso ingrediente e stessa unità), per aggiornarle invece di duplicarle
export const stockEntries = (pantry, name, unit) => {
  const n = normalizeIngredient({ name, qty: 1, unit });
  return pantry.filter((p) => !p.always && canonicalName(p.name) === canonicalName(n.name) && normalizeIngredient({ name: p.name, qty: 1, unit: p.unit }).unit === n.unit);
};

// "Ne ho 500 g": imposta la quantità posseduta di un ingrediente (non la somma). Restituisce cosa scrivere nella dispensa:
// { save: voce da salvare (con id se esiste già) | null, remove: id delle voci duplicate o azzerate }
export const setStock = (pantry, { name, unit }, qty) => {
  const n = normalizeIngredient({ name, qty, unit });
  const same = stockEntries(pantry, name, unit);
  const amount = n.unit === 'q.b.' ? 0 : n.qty;
  if (!(amount > 0)) return { save: null, remove: same.map((p) => p.id) };
  const [first, ...rest] = same;
  return { save: { ...(first ? { id: first.id } : {}), name: first?.name || name, always: false, qty: amount, unit: n.unit }, remove: rest.map((p) => p.id) };
};

// Confronta la lista della spesa con la dispensa.
// - "Ho sempre" (sale, olio...): copre qualunque quantità di quell'ingrediente, anche se il nome ha parole in più.
// - Con quantità: sottrae quanto hai già, se nome e unità coincidono.
export const applyPantry = (list, pantry) => {
  const stock = new Map();
  const always = [];
  for (const p of pantry) {
    if (p.always) always.push(norm(p.name));
    else {
      const n = normalizeIngredient({ name: p.name, qty: p.qty, unit: p.unit });
      const k = `${canonicalName(n.name)}|${n.unit}`;
      stock.set(k, (stock.get(k) || 0) + n.qty);
    }
  }
  const needed = [];
  const covered = [];
  for (const i of list) {
    const n = norm(i.name);
    if (always.some((a) => n.includes(a))) { covered.push({ ...i, why: 'Ce l\'hai sempre' }); continue; }
    const have = haveOf(stock, i);
    if (i.unit === 'q.b.' ? have > 0 : have >= i.qty && have > 0) covered.push({ ...i, why: 'In dispensa' });
    else needed.push(have > 0 ? { ...i, qty: i.qty - have, have } : i);
  }
  return { needed, covered };
};
