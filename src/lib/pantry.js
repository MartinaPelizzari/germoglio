import { canonicalName, normalizeIngredient } from './scale.js';

export const STAPLES = ['Sale', 'Pepe', 'Olio extravergine d\'oliva', 'Zucchero', 'Aceto', 'Farina', 'Spezie', 'Lievito alimentare'];

const norm = (s) => ` ${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()} `;

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
    const have = stock.get(`${canonicalName(i.name)}|${i.unit}`) || 0;
    if (i.unit === 'q.b.' ? have > 0 : have >= i.qty && have > 0) covered.push({ ...i, why: 'In dispensa' });
    else needed.push(have > 0 ? { ...i, qty: i.qty - have, have } : i);
  }
  return { needed, covered };
};
