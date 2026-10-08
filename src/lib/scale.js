import { pieceGrams } from './nutrition.js';
// Calcolo delle dosi per persona e per pasto.
//
// Le ricette sono scritte per UNA porzione di riferimento. Per ogni persona e pasto si può indicare:
//  - mult: moltiplicatore generale della porzione (es. 0,5 per un bambino);
//  - plan: il piano alimentare scritto dalla nutrizionista (vedi dietPlan.js). Gli ingredienti della ricetta che
//    corrispondono a un alimento del piano prendono la quantità indicata; gli altri seguono il moltiplicatore.
import { applyPlanDoses } from './dietPlan.js';
import { halveGroup } from './day.js';
import { SLOTS } from './meals.js';

export { SLOTS };

export const mealOf = (member, slot) => {
  const m = member?.meals?.[slot] || {};
  // gli ospiti hanno una sola porzione (member.mult) valida per ogni pasto
  const mult = Number(m.mult) > 0 ? Number(m.mult) : Number(member?.mult) > 0 ? Number(member.mult) : 1;
  // "Pasti che voglio vedere" del profilo: quelli non scelti non vengono pianificati né mostrati per quella persona
  const wanted = !member?.visibleSlots || member.visibleSlots.includes(slot);
  return { eats: m.eats !== false && wanted, mult, plan: m.plan || [], planText: m.planText || '', note: m.note || '' };
};

// Il pasto di una persona per un piatto: in modalità "giornata" il piatto può consumare gruppi di altri pasti (item.uses)
export const mealOfItem = (member, slot, item) => {
  const meal = mealOf(member, slot);
  const keys = item?.uses?.[member?.id];
  if (!keys) return meal;
  const plan = keys.map((k) => { const [base, part] = k.split('~'); const [s, gi] = base.split('|'); const g = mealOf(member, s).plan[Number(gi)]; return g && part ? halveGroup(g) : g; }).filter(Boolean);
  return { ...meal, plan };
};

export const scaleRecipe = (recipe, meal) => {
  const base = (recipe.ingredients || []).map((i) => ({ ...i, qty: i.unit === 'q.b.' ? 0 : i.qty * meal.mult }));
  if (!meal.plan?.length) return base;
  // il piano indica quantità assolute: si applicano alle quantità della ricetta per una porzione, non a quelle moltiplicate
  const planned = applyPlanDoses((recipe.ingredients || []).map((i) => ({ ...i })), meal.plan);
  return base.map((b, k) => (planned[k].qty !== (recipe.ingredients[k].qty) ? { ...b, qty: planned[k].qty } : b));
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
  // chi nel profilo non mangia più questo pasto non lo mangia nemmeno nei menu già fatti (le impostazioni valgono subito, senza rigenerare)
  const guests = data?.guests || [];
  return all.filter((m) => ids.includes(m.id) && (guests.includes(m) || mealOf(m, slot).eats));
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


// Nome "canonico" per riconoscere lo stesso ingrediente scritto in modi diversi: maiuscole, accenti, singolare e plurale,
// descrizioni che non cambiano cosa si compra ("fresco", "maturo"), parole in ordine diverso.
const DESCRIPTORS = new Set(['fresco', 'fresca', 'freschi', 'fresche', 'intero', 'intera', 'interi', 'intere', 'maturo', 'matura', 'maturi', 'mature', 'bio', 'biologico', 'biologica', 'di', 'del', 'della', 'dei', 'delle', 'd', 'a', 'al', 'alla', 'e', 'il', 'la', 'le', 'lo', 'un', 'una', 'qb', 'in', 'grattugiato', 'grattugiata', 'polvere', 'congelato', 'congelata', 'congelati', 'congelate', 'lessato', 'lessata', 'lessati', 'lessate']);
// Varianti che al supermercato sono lo stesso prodotto
const ALIAS = [[/pepe (nero|macinato|bianco)/g, 'pepe'], [/parmigiano reggiano|grana padano/g, 'parmigiano'], [/latte (parzialmente scremato|scremato|intero)/g, 'latte']];
export const canonicalName = (name = '') => {
  const lower = ALIAS.reduce((t, [re, to]) => t.replace(re, to), name.toLowerCase());
  const words = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter((w) => w && !DESCRIPTORS.has(w))
    .map((w) => (w.length > 3 && /[aeio]$/.test(w) ? w.slice(0, -1) : w));
  return words.sort().join(' ');
};

export const ingredientKey = (i) => `${canonicalName(i.name)}|${i.unit}`;

const SPOON = { cucchiai: 12, cucchiaini: 4 }; // ml (o g) per cucchiaio e cucchiaino
const UNIT_RANK = ['g', 'ml', 'pz'];

// Somma ingredienti uguali. Lo stesso ingrediente scritto con nomi quasi uguali ("Pomodori", "pomodoro fresco") o con
// unità diverse (g, ml, cucchiai, pezzi) finisce in una sola riga, quando le unità si possono convertire con ragionevolezza:
// g e ml si trattano alla pari (1 ml = 1 g), un cucchiaio vale 12, un cucchiaino 4, un pezzo il suo peso medio se noto.
export const sumIngredients = (lists) => {
  const byName = new Map();
  for (const i of lists.flat()) {
    const n = normalizeIngredient(i);
    if (!n.name) continue;
    const cn = canonicalName(n.name);
    if (!byName.has(cn)) byName.set(cn, { names: new Map(), units: new Map(), group: n.group, cn });
    const e = byName.get(cn);
    e.names.set(n.name, (e.names.get(n.name) || 0) + 1);
    const u = e.units.get(n.unit) || { qty: 0, qb: false };
    u.qty += n.qty;
    u.qb = u.qb || n.unit === 'q.b.';
    e.units.set(n.unit, u);
    if (e.group === 'other' && n.group !== 'other') e.group = n.group;
  }
  const out = [];
  for (const e of byName.values()) {
    const name = [...e.names].sort((a, b) => b[1] - a[1])[0][0];
    const units = new Map([...e.units].map(([u, v]) => [u, v.qty]));
    const mass = units.has('g') || units.has('ml');
    // cucchiaini in cucchiai; con una quantità in g o ml i cucchiai diventano g o ml
    if (units.has('cucchiaini') && !mass && units.has('cucchiai')) { units.set('cucchiai', units.get('cucchiai') + units.get('cucchiaini') / 3); units.delete('cucchiaini'); }
    if (mass) for (const sp of Object.keys(SPOON)) if (units.has(sp)) { units.set('g', (units.get('g') || 0) + units.get(sp) * SPOON[sp]); units.delete(sp); }
    // i pezzi diventano grammi se si conosce il peso medio e c'è già una quantità in g o ml
    if (units.has('pz') && (units.has('g') || units.has('ml'))) {
      const w = pieceGrams(name) ?? 100; // peso medio di un pezzo: se non lo conosciamo, 100 g
      { units.set('g', (units.get('g') || 0) + units.get('pz') * w); units.delete('pz'); }
    }
    // g e ml insieme: una riga sola, nell'unità con più quantità
    if (units.has('g') && units.has('ml')) {
      const keep = units.get('ml') > units.get('g') ? 'ml' : 'g';
      const other = keep === 'g' ? 'ml' : 'g';
      units.set(keep, units.get(keep) + units.get(other));
      units.delete(other);
    }
    // "q.b." insieme a una quantità vera: resta la quantità
    if (units.size > 1 && units.has('q.b.')) units.delete('q.b.');
    const ordered = [...units].sort((a, b) => (UNIT_RANK.indexOf(a[0]) + 1 || 9) - (UNIT_RANK.indexOf(b[0]) + 1 || 9));
    for (const [unit, qty] of ordered) out.push({ name, qty, unit, group: e.group, key: `${e.cn}|${unit}` });
  }
  return out;
};

export const formatQty = (qty, unit) => {
  if (unit === 'q.b.' || !qty) return 'q.b.';
  if (unit === 'g') return qty >= 1000 ? `${(qty / 1000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')} kg` : `${roundMass(qty)} g`;
  if (unit === 'ml') return qty >= 1000 ? `${(qty / 1000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')} l` : `${roundMass(qty)} ml`;
  const half = Math.round(qty * 2) / 2 || 0.5;
  return `${String(half).replace('.', ',')} ${unit}`;
};

const roundMass = (q) => (q < 20 ? Math.round(q) || 1 : Math.round(q / 5) * 5);
