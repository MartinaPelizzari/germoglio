// Dieta equilibrata per chi non ha il piano di una nutrizionista.
// Costruisce, pasto per pasto, un testo di piano nello stesso formato di quello della nutrizionista (lo legge parseSlotPlan),
// così tutto il resto dell'app (dosi per persona, bilanciamento della giornata, tetti settimanali) lavora senza distinzioni.
// Frequenze e porzioni: CREA 2018, Tabella 9.1 a 1500/2000/2500 kcal, interpolate (docs/porzioni.md).
// La quantità dei carboidrati si regola per far tornare l'energia stimata con quella calcolata in needs.js.
import { recipeAllergens } from './allergens.js';
import { lookup } from './nutrition.js';
import { parseSlotPlan } from './dietPlan.js';
import { SLOTS } from './meals.js';

const lerp = (e, a, b, c) => (e <= 2000 ? a + ((b - a) * (Math.max(e, 1200) - 1500)) / 500 : b + ((c - b) * (Math.min(e, 2500) - 2000)) / 500);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const r5 = (x) => Math.max(5, Math.round(x / 5) * 5);
const r10 = (x) => Math.max(10, Math.round(x / 10) * 10);

// Opzioni: { t: nome, g: grammi, u: 'g'|'ml', carb?: quantità regolabile, w?: volte a settimana (tetto), d: diete ammesse }
const ALL = ['omnivore', 'pescetarian', 'vegetarian', 'vegan'];
const NOVEG = ['omnivore', 'pescetarian', 'vegetarian'];
// alt: alternative usate solo da chi è vegano o ha l'intolleranza indicata
const YOGURT = { t: 'yogurt', g: 125, flex: 1, d: NOVEG };
const SOY_YOGURT = { t: 'yogurt di soia', g: 125, d: ALL, alt: ['vegan', 'lattosio'] };
const dairy = [
  YOGURT, { t: 'latte parzialmente scremato', g: 200, u: 'ml', d: NOVEG },
  SOY_YOGURT, { t: 'latte di soia', g: 200, u: 'ml', d: ALL, alt: ['vegan', 'lattosio'] },
];
const breakfastCarb = [
  { t: 'pane', g: 40, carb: 1, step: 10, d: ALL }, { t: 'fette biscottate', g: 30, carb: 1, d: ALL },
  { t: 'cereali integrali per la colazione', g: 30, carb: 1, d: ALL }, { t: 'fiocchi d\'avena', g: 40, carb: 1, d: ALL },
  { t: 'pane senza glutine', g: 40, carb: 1, step: 10, d: ALL, alt: ['glutine'] }, { t: 'fette biscottate senza glutine', g: 30, carb: 1, d: ALL, alt: ['glutine'] },
];
const lunchCarb = [
  { t: 'pasta', g: 80, carb: 1, d: ALL }, { t: 'riso', g: 80, carb: 1, d: ALL }, { t: 'farro', g: 80, carb: 1, d: ALL },
  { t: 'orzo', g: 80, carb: 1, d: ALL }, { t: 'patate', g: 200, carb: 1, w: 2, d: ALL },
];
const lunchBread = [{ t: 'pane', g: 50, carb: 1, step: 10, d: ALL }, { t: 'pane integrale', g: 50, carb: 1, step: 10, d: ALL }, { t: 'pane senza glutine', g: 50, carb: 1, step: 10, d: ALL, alt: ['glutine'] }];
const dinnerBread = [{ t: 'pane', g: 40, carb: 1, step: 10, d: ALL }, { t: 'patate', g: 150, carb: 1, w: 2, d: ALL }, { t: 'pane integrale', g: 40, carb: 1, step: 10, d: ALL }, { t: 'pane senza glutine', g: 40, carb: 1, step: 10, d: ALL, alt: ['glutine'] }];
const protein = (e, diet, extra = 0) => [
  { t: 'legumi cotti', g: 150, w: diet === 'omnivore' || diet === 'pescetarian' ? 3 + extra : extra ? 4 + extra : 0, d: ALL },
  { t: 'uova', g: 100, w: Math.round(lerp(e, 2, 3, 4)), d: NOVEG },
  { t: 'pesce', g: 150, w: Math.round(lerp(e, 2, 2, 3)) + (diet === 'pescetarian' ? 1 : 0), d: ['omnivore', 'pescetarian'] },
  { t: 'petto di pollo', g: 100, w: Math.round(lerp(e, 1, 2, 3)), d: ['omnivore'] },
  { t: 'carne rossa', g: 100, w: 1, d: ['omnivore'] },
  { t: 'formaggio fresco', g: 100, w: 3, d: NOVEG },
  { t: 'tofu', g: 100, w: diet === 'vegan' ? 0 : 2, d: ALL },
];
const FRUIT = { t: 'frutta fresca', g: 150, flex: 1, d: ALL };
const NUTS = { t: 'frutta secca', g: 30, w: 2, flex: 1, d: ALL };
const VEG = { t: 'verdura', g: 200, d: ALL };

// Toglie le opzioni non adatte (dieta, intolleranze) usando le stesse regole delle ricette
const usable = (opts, diet, intol) => opts.filter((o) => o.d.includes(diet)
  && (!o.alt || o.alt.includes(diet) || o.alt.some((a) => intol.includes(a)))
  && !intol.some((a) => recipeAllergens({ ingredients: [{ name: o.t }] }).has(a)));

// Con più energia da coprire crescono i carboidrati e, meno, frutta, yogurt e frutta secca
const flexOf = (s) => 1 + (s - 1) * 0.6;
const qtyOf = (o, s, pf) => (o.carb ? o.g * s : o.prot ? o.g * pf : o.flex ? o.g * flexOf(s) : o.g);
const line = (o, s, pf = 1) => {
  const unit = o.u || 'g';
  const q = o.carb && o.step === 10 ? r10(qtyOf(o, s, pf)) : o.prot ? r10(qtyOf(o, s, pf)) : r5(qtyOf(o, s, pf));
  const note = o.w ? ` [${o.w} volte a settimana]` : '';
  return `${q} ${unit} ${o.t}${note}`;
};
const kcalOf = (o, s, pf) => {
  const v = lookup(o.t);
  return v ? (v.kcal * qtyOf(o, s, pf)) / 100 : 0;
};

// Gruppi di un pasto: ogni gruppo è una lista di alternative (da mangiare insieme ai gruppi vicini)
const slotGroups = (slot, ctx) => {
  const { diet, intol, e, fruitSlots } = ctx;
  const U = (o) => usable(o, diet, intol);
  const prot = U(protein(e, diet, ctx.legumes).map((o) => ({ ...o, prot: 1 })));
  const withFruit = fruitSlots.has(slot) ? [U([FRUIT])] : [];
  switch (slot) {
    case 'Colazione': return [U(dairy), U(breakfastCarb), ...withFruit];
    case 'Spuntino 1': return [U([FRUIT])];
    case 'Spuntino 2': return [U([FRUIT, YOGURT, SOY_YOGURT, NUTS])];
    case 'Pranzo': return [U(lunchCarb), prot, U([VEG]), ...withFruit];
    case 'Cena': return [prot, U([VEG]), U(dinnerBread), ...withFruit];
    default: return [];
  }
};

// eaten: pasti che la persona consuma; restituisce { texts, estKcal, scale }
export const buildAutoPlan = ({ diet = 'omnivore', intolerances = [], kcal, protein: pg = 65, eaten = SLOTS, tweaks = {} }) => {
  const e = clamp(kcal * (1 + (tweaks.kcalPct || 0) / 100), 1200, 3200);
  const nFruit = Math.round(lerp(e, 2, 3, 3));
  const order = ['Spuntino 1', 'Spuntino 2', 'Colazione', 'Cena', 'Pranzo'].filter((s) => eaten.includes(s));
  const fruitSlots = new Set(order.slice(0, nFruit));
  const ctx = { diet, intol: intolerances, e, fruitSlots, legumes: tweaks.legumes || 0 };
  const pf = clamp(pg / 65, 0.8, 1.6);
  const oilKcal = 240 + 100; // olio dei condimenti (3 porzioni da 10 ml al giorno) e verdure, che stanno nelle ricette
  const groupsBySlot = Object.fromEntries(eaten.map((s) => [s, slotGroups(s, ctx).filter((g) => g.length)]));
  // energia stimata di una giornata: per ogni gruppo la media delle alternative
  const estimate = (sc) => oilKcal + eaten.reduce((tot, slot) => tot + groupsBySlot[slot].reduce((a, g) => a + g.reduce((x, o) => x + kcalOf(o, sc, pf), 0) / g.length, 0), 0);
  let lo = 0.6, hi = 2.6;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (estimate(mid) < e) lo = mid; else hi = mid; }
  const scale = clamp((lo + hi) / 2, 0.6, 2.6);
  const texts = {};
  for (const slot of eaten) {
    const gs = groupsBySlot[slot];
    if (gs.length) texts[slot] = gs.map((g) => g.map((o) => line(o, scale, pf)).join('\n')).join('\n\n');
  }
  const estKcal = Math.round(estimate(scale));
  return { texts, estKcal, scale: Math.round(scale * 100) / 100 };
};

// Pasti pronti da salvare nel profilo
export const autoMeals = (opts) => {
  const { texts, estKcal } = buildAutoPlan(opts);
  const meals = {};
  for (const [slot, t] of Object.entries(texts)) meals[slot] = { planText: t, plan: parseSlotPlan(t) };
  return { meals, estKcal, texts };
};
