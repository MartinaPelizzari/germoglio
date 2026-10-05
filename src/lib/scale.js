// Calcolo delle dosi per persona e per pasto.
//
// Le ricette sono scritte per UNA porzione di riferimento. Per ogni persona e pasto si può indicare:
//  - mult: moltiplicatore generale della porzione (es. 0,5 per un bambino);
//  - targets: dose in grammi per componente (carb, protein, veg, fat, fruit, dairy).
// Se per una componente c'è una dose e la ricetta ne contiene (in g/ml), tutti gli ingredienti di quella
// componente vengono scalati per arrivarci; altrimenti si applica il moltiplicatore.

export const SLOTS = ['Colazione', 'Spuntino 1', 'Pranzo', 'Spuntino 2', 'Cena'];
export const SLOT_CATEGORY = { Colazione: 'Colazione', 'Spuntino 1': 'Spuntino', Pranzo: 'Pranzo', 'Spuntino 2': 'Spuntino', Cena: 'Cena' };

const isMass = (u) => u === 'g' || u === 'ml';

export const groupBase = (ingredients) => {
  const base = {};
  for (const i of ingredients) {
    if (isMass(i.unit) && i.qty > 0) base[i.group] = (base[i.group] || 0) + i.qty;
  }
  return base;
};

export const mealOf = (member, slot) => {
  const m = member?.meals?.[slot] || {};
  // gli ospiti hanno una sola porzione (member.mult) valida per ogni pasto
  const mult = Number(m.mult) > 0 ? Number(m.mult) : Number(member?.mult) > 0 ? Number(member.mult) : 1;
  return { eats: m.eats !== false, mult, targets: m.targets || {}, note: m.note || '' };
};

export const scaleRecipe = (recipe, meal) => {
  const base = groupBase(recipe.ingredients || []);
  return (recipe.ingredients || []).map((i) => {
    const target = Number(meal.targets?.[i.group]);
    // La dose per componente scala solo gli ingredienti pesati (g/ml): spezie, spicchi e cucchiai seguono la porzione generale
    const factor = target > 0 && base[i.group] > 0 && isMass(i.unit) ? target / base[i.group] : meal.mult;
    return { ...i, qty: i.unit === 'q.b.' ? 0 : i.qty * factor };
  });
};

// Chi c'è a un pasto: chi di solito lo mangia, meno gli assenti di quel giorno, più gli ospiti.
// data = { items, absent: [id], guests: [persona] } del pasto pianificato (facoltativo).
export const slotPeople = (household, slot, data) => {
  const absent = data?.absent || [];
  return [...(household?.members || []).filter((m) => mealOf(m, slot).eats && !absent.includes(m.id)), ...(data?.guests || [])];
};

// Chi mangia questo piatto: la scelta fatta sul piatto, oppure tutti quelli presenti al pasto.
export const eatersOf = (item, household, slot, data) => {
  const all = [...(household?.members || []), ...(data?.guests || [])];
  const ids = Array.isArray(item?.eaters) ? item.eaters : slotPeople(household, slot, data).map((m) => m.id);
  return all.filter((m) => ids.includes(m.id));
};

const UNIT_ALIAS = { gr: 'g', g: 'g', kg: 'kg', l: 'l', ml: 'ml', pz: 'pz', 'q.b.': 'q.b.', qb: 'q.b.', fetta: 'pz', fette: 'pz' };

export const normalizeIngredient = (i) => {
  let unit = UNIT_ALIAS[(i.unit || '').toLowerCase().trim()] ?? (i.unit || 'pz').toLowerCase().trim();
  let qty = Number(i.qty) || 0;
  if (unit === 'kg') { unit = 'g'; qty *= 1000; }
  if (unit === 'l') { unit = 'ml'; qty *= 1000; }
  if (unit === 'q.b.') qty = 0;
  const name = (i.name || '').trim();
  return { name, qty, unit, group: i.group || 'other' };
};

export const ingredientKey = (i) => `${i.name.toLowerCase().replace(/\s+/g, ' ')}|${i.unit}`;

// Somma ingredienti uguali (stesso nome e unità)
export const sumIngredients = (lists) => {
  const acc = new Map();
  for (const i of lists.flat()) {
    const n = normalizeIngredient(i);
    if (!n.name) continue;
    const k = ingredientKey(n);
    if (!acc.has(k)) acc.set(k, { ...n, key: k });
    else acc.get(k).qty += n.qty;
  }
  return [...acc.values()];
};

export const formatQty = (qty, unit) => {
  if (unit === 'q.b.' || !qty) return 'q.b.';
  if (unit === 'g') return qty >= 1000 ? `${(qty / 1000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')} kg` : `${roundMass(qty)} g`;
  if (unit === 'ml') return qty >= 1000 ? `${(qty / 1000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')} l` : `${roundMass(qty)} ml`;
  const half = Math.round(qty * 2) / 2 || 0.5;
  return `${String(half).replace('.', ',')} ${unit}`;
};

const roundMass = (q) => (q < 20 ? Math.round(q) || 1 : Math.round(q / 5) * 5);
