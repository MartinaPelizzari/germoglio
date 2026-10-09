// Dieta equilibrata per chi non ha il piano di una nutrizionista.
// Costruisce, pasto per pasto, un testo di piano nello stesso formato di quello della nutrizionista (lo legge parseSlotPlan),
// così tutto il resto dell'app (dosi per persona, bilanciamento della giornata, tetti settimanali) lavora senza distinzioni.
// Frequenze e porzioni: CREA 2018, Tabella 9.1 a 1500/2000/2500 kcal, interpolate (docs/porzioni.md).
// La quantità dei carboidrati si regola per far tornare l'energia stimata con quella calcolata in needs.js.
import { recipeAllergens } from './allergens.js';
import { lookup } from './nutrition.js';
import { parseSlotPlan } from './dietPlan.js';
import { SLOTS } from './meals.js';
import { maxPortion, targetFactor } from './portionLimits.js';

const lerp = (e, a, b, c) => (e <= 2000 ? a + ((b - a) * (Math.max(e, 1200) - 1500)) / 500 : b + ((c - b) * (Math.min(e, 2500) - 2000)) / 500);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const r5 = (x) => Math.max(5, Math.round(x / 5) * 5);
const r10 = (x) => Math.max(10, Math.round(x / 10) * 10);

// Opzioni: { t: nome, g: grammi, u: 'g'|'ml', carb?: quantità regolabile, w?: volte a settimana (tetto), d: diete ammesse }
const ALL = ['omnivore', 'pescetarian', 'vegetarian', 'vegan'];
const NOVEG = ['omnivore', 'pescetarian', 'vegetarian'];
// alt: alternative usate solo da chi è vegano o ha l'intolleranza indicata
const YOGURT = { t: 'yogurt', kn: 'yogurt bianco intero', g: 125, flex: 1, d: NOVEG };
const SOY_YOGURT = { t: 'yogurt di soia', g: 125, d: ALL, alt: ['vegan', 'lattosio'] };
const dairy = [
  YOGURT, { t: 'latte parzialmente scremato', g: 200, u: 'ml', d: NOVEG },
  SOY_YOGURT, { t: 'latte di soia', g: 200, u: 'ml', d: ALL, alt: ['vegan', 'lattosio'] },
];
const breakfastCarb = [
  { t: 'pane', g: 40, carb: 1, step: 10, d: ALL }, { t: 'fette biscottate', g: 30, carb: 1, d: ALL },
  { t: 'cereali integrali per la colazione', kn: 'muesli', g: 30, carb: 1, d: ALL }, { t: 'fiocchi d\'avena', g: 40, carb: 1, d: ALL },
  { t: 'pane senza glutine', kn: 'pane', g: 40, carb: 1, step: 10, d: ALL, alt: ['glutine'] }, { t: 'fette biscottate senza glutine', g: 30, carb: 1, d: ALL, alt: ['glutine'] },
];
const lunchCarb = [
  { t: 'pasta', g: 80, carb: 1, d: ALL }, { t: 'riso', g: 80, carb: 1, d: ALL }, { t: 'farro', g: 80, carb: 1, d: ALL },
  { t: 'orzo', kn: 'farro', g: 80, carb: 1, d: ALL }, { t: 'patate', g: 200, carb: 1, w: 2, d: ALL },
];
const lunchBread = [{ t: 'pane', g: 50, carb: 1, step: 10, d: ALL }, { t: 'pane integrale', g: 50, carb: 1, step: 10, d: ALL }, { t: 'pane senza glutine', kn: 'pane', g: 50, carb: 1, step: 10, d: ALL, alt: ['glutine'] }];
const dinnerBread = [{ t: 'pane', g: 40, carb: 1, step: 10, d: ALL }, { t: 'patate', g: 150, carb: 1, w: 2, d: ALL }, { t: 'pane integrale', g: 40, carb: 1, step: 10, d: ALL }, { t: 'pane senza glutine', g: 40, carb: 1, step: 10, d: ALL, alt: ['glutine'] }];
const protein = (e, diet, extra = 0) => [
  { t: 'legumi cotti', kn: 'ceci cotti', g: 150, w: diet === 'omnivore' || diet === 'pescetarian' ? 3 + extra : extra ? 4 + extra : 0, d: ALL },
  { t: 'uova', g: 100, w: Math.round(lerp(e, 2, 3, 4)), d: NOVEG },
  { t: 'pesce', kn: 'filetto di merluzzo', g: 150, w: Math.round(lerp(e, 2, 2, 3)) + (diet === 'pescetarian' ? 1 : 0), d: ['omnivore', 'pescetarian'] },
  { t: 'carne bianca', kn: 'petto di pollo', g: 100, w: Math.round(lerp(e, 1, 2, 3)), d: ['omnivore'] },
  { t: 'carne rossa', kn: 'fettine di manzo', g: 100, w: 1, d: ['omnivore'] },
  { t: 'formaggio fresco', g: 100, w: 3, d: NOVEG },
  { t: 'tofu', g: 100, w: diet === 'vegan' ? 0 : 2, d: ALL },
];
const FRUIT = { t: 'frutta fresca', kn: 'mele', g: 150, flex: 1, d: ALL };
const NUTS = { t: 'frutta secca', g: 30, w: 2, flex: 1, d: ALL };
const VEG = { t: 'verdura', kn: 'zucchine', g: 200, d: ALL };

// Toglie le opzioni non adatte (dieta, intolleranze) usando le stesse regole delle ricette
const usable = (opts, diet, intol) => opts.filter((o) => o.d.includes(diet)
  && (!o.alt || o.alt.includes(diet) || o.alt.some((a) => intol.includes(a)))
  && !intol.some((a) => recipeAllergens({ ingredients: [{ name: o.t }] }).has(a)));

// Con più energia da coprire crescono i carboidrati e, meno, proteine, frutta, yogurt e frutta secca;
// oltre una certa soglia si aggiungono anche olio nei pasti principali, frutta secca negli spuntini e frutta a colazione
const flexOf = (s) => 1 + (s - 1) * 0.6;
// capMul: tetto delle porzioni rispetto allo standard in base all'energia (limitFactor/targetFactor in portionLimits.js).
// Senza tetto tutta l'energia in più finiva nei carboidrati (155 g di pasta, 80 g di pane); ora l'eccesso va in più gruppi e, se non basta, il piano resta sotto il fabbisogno e lo dice.
const qtyOf = (o, s, pf, capMul = 1.25) => (o.carb ? o.g * clamp(s, 0.5, capMul) : o.prot ? o.g * Math.min(pf * Math.max(0.75, 1 + (s - 1) * 0.25), capMul + 0.25) : o.oil ? clamp(10 + (s - 1) * 25, 10, 20) : o.flex ? o.g * Math.min(flexOf(s), Math.max(1.5, capMul)) : o.g);
const line = (o, s, pf = 1, capMul, e) => {
  const unit = o.u || 'g';
  let q = o.carb && o.step === 10 ? r10(qtyOf(o, s, pf, capMul)) : o.prot ? r10(qtyOf(o, s, pf, capMul)) : r5(qtyOf(o, s, pf, capMul));
  // rete di sicurezza: una quantità oltre il limite di porzione non esce mai dal piano
  const lim = maxPortion(o.kn || o.t, e);
  if (lim && q > lim.max) q = lim.max;
  const note = o.w ? ` [${o.w} volte a settimana]` : '';
  return `${q} ${unit} ${o.t}${note}`;
};
const kcalOf = (o, s, pf, capMul) => {
  const v = lookup(o.kn || o.t);
  return v ? (v.kcal * qtyOf(o, s, pf, capMul)) / 100 : 0;
};

const OIL = { t: 'olio extravergine d\'oliva', g: 10, oil: 1, d: ALL };
const NUTS_DAILY = { t: 'frutta secca', g: 20, w: 5, flex: 1, d: ALL };

// Gruppi di un pasto: ogni gruppo è una lista di alternative (da mangiare insieme ai gruppi vicini)
const slotGroups = (slot, ctx, sc) => {
  const { diet, intol, e, fruitSlots } = ctx;
  const U = (o) => usable(o, diet, intol);
  const prot = U(protein(e, diet, ctx.legumes).map((o) => ({ ...o, prot: 1 })));
  const high = ctx.high ?? e >= 2300; // fabbisogni alti: più condimento, spuntini più ricchi, frutta anche a colazione
  const withFruit = fruitSlots.has(slot) ? [U([FRUIT])] : [];
  const oil = high ? [U([OIL])] : [];
  switch (slot) {
    case 'Colazione': return [U(dairy), U(breakfastCarb), ...(withFruit.length || !high ? withFruit : [U([FRUIT])])];
    case 'Spuntino 1': return [U([FRUIT]), ...(high ? [U([NUTS_DAILY])] : [])];
    case 'Spuntino 2': return high ? [U([FRUIT, YOGURT, SOY_YOGURT]), U([NUTS_DAILY])] : [U([FRUIT, YOGURT, SOY_YOGURT, NUTS])];
    case 'Pranzo': return [U(lunchCarb), prot, U([VEG]), ...oil, ...withFruit];
    case 'Cena': return [prot, U([VEG]), U(dinnerBread), ...oil, ...withFruit];
    default: return [];
  }
};

// eaten: pasti che la persona consuma; restituisce { texts, estKcal, scale }
export const buildAutoPlan = ({ diet = 'omnivore', intolerances = [], kcal, protein: pg = 65, eaten = SLOTS, tweaks = {} }) => {
  const e = clamp(kcal * (1 + (tweaks.kcalPct || 0) / 100), 1200, 4500);
  const nFruit = Math.round(lerp(e, 2, 3, 3));
  const order = ['Spuntino 1', 'Spuntino 2', 'Colazione', 'Cena', 'Pranzo'].filter((s) => eaten.includes(s));
  const fruitSlots = new Set(order.slice(0, nFruit));
  const pf = clamp(pg / 65, 0.8, 1.6);
  const capMul = targetFactor(e); // tetto delle porzioni rispetto allo standard: 1,25 sotto 2400 kcal, 1,5 sotto 3000, 2 sopra
  const baseKcal = 240; // olio dei condimenti (3 porzioni da 10 ml al giorno), che sta nelle ricette
  // Con i tetti le porzioni dei carboidrati non crescono oltre: se l'energia non torna, si prova con i gruppi in più (olio nei pasti principali,
  // frutta secca, frutta a colazione). Se anche così il piano resta sotto il fabbisogno, resta sotto: lo dice NeedsSummary.
  let best = null;
  for (const high of e >= 2300 ? [true] : [false, true]) {
    const ctx = { diet, intol: intolerances, e, fruitSlots, legumes: tweaks.legumes || 0, high };
    const groupsAt = (sc) => Object.fromEntries(eaten.map((sl) => [sl, slotGroups(sl, ctx, sc).filter((g) => g.length)]));
    // energia stimata di una giornata: per ogni gruppo la media delle alternative
    const estimate = (sc, gs = groupsAt(sc)) => baseKcal + eaten.reduce((tot, slot) => tot + gs[slot].reduce((a, g) => a + g.reduce((x, o) => x + kcalOf(o, sc, pf, capMul), 0) / g.length, 0), 0);
    // la scala che porta più vicino al fabbisogno (le soglie dei gruppi in più rendono la curva a gradini: si cerca a passi piccoli)
    let scale = 1, bestGap = Infinity;
    for (let sc = 0.3; sc <= 3.4; sc += 0.02) { const gap = Math.abs(estimate(sc) - e); if (gap < bestGap - 1) { bestGap = gap; scale = sc; } }
    const gs = groupsAt(scale);
    const texts = {};
    for (const slot of eaten) {
      if (gs[slot].length) texts[slot] = gs[slot].map((g) => g.map((o) => line(o, scale, pf, capMul, e)).join('\n')).join('\n\n');
    }
    const cand = { texts, estKcal: Math.round(estimate(scale, gs)), scale: Math.round(scale * 100) / 100, gap: bestGap };
    if (!best || cand.gap < best.gap - 1) best = cand;
    if (cand.gap <= e * 0.06) break; // già vicino al fabbisogno senza gruppi in più
  }
  const { gap, ...result } = best;
  return result;
};

// Pasti pronti da salvare nel profilo
export const autoMeals = (opts) => {
  const { texts, estKcal } = buildAutoPlan(opts);
  const meals = {};
  for (const [slot, t] of Object.entries(texts)) meals[slot] = { planText: t, plan: parseSlotPlan(t) };
  return { meals, estKcal, texts };
};
