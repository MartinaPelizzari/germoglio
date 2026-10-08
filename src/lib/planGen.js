import { SLOTS, canonicalName, eatersOf, mealOf, mealOfItem, slotPeople } from './scale.js';
import { breakfastClass, isSavory, kindFits, recipeKind, slotKind } from './meals.js';
import { fits, isSharedSlot, mealConstraints, menuClusters, memberLevel, recipeLevel, ruleCap, rulesFor } from './diet.js';
import { foodsAtSlot, recipeFoods } from './goals.js';
import { recencyPenalty } from './usage.js';
import { describeOption, foodDiet, planMatches, planViolations } from './dietPlan.js';
import { consumedKeys, dayInstancesFor, halveGroup, instanceKey, isBigFruit, isDayBalanced, movable } from './day.js';
import { recipeAllergens } from './allergens.js';
import { containsAvoided } from './diet.js';
import { resolveItem } from './items.js';
import { auditScore, auditWeek } from './audit.js';
import { themeOf } from './themes.js';
import { colorMass, consistencyOf } from './variety.js';
import { packFor } from './packs.js';
import { outOfSeason } from './seasons.js';
import { proteinSourceOf, proteinTypeOfName } from './protein.js';
import { allocateProteins } from './quota.js';
import { deriveRecipe, droppableProteins, variantSpecs } from './variants.js';
import { PROTEIN_TYPES } from './protein.js';

// ---- componenti (modo senza piano scritto): carboidrati, proteine, verdure
export const coveredGroups = (recipes) => {
  const set = new Set();
  for (const r of recipes) for (const i of r.ingredients || []) if (i.qty > 0 || i.unit === 'q.b.') set.add(i.group);
  return set;
};
export const missingGroups = (required, recipes) => {
  const have = coveredGroups(recipes);
  return required.filter((g) => !have.has(g));
};
export const coarseRequired = (slot) => (slotKind(slot) === 'principale' ? ['carb', 'protein', 'veg'] : []);

// ---- piano della nutrizionista: ogni gruppo di alternative di ogni persona va coperto
// Gruppi del piano che valgono per una persona a un pasto.
//  - per pasto: i gruppi di quel pasto;
//  - per giornata: i gruppi di quel pasto non ancora consumati, più quelli rimasti indietro dai pasti precedenti
//    (obbligatori) e, come possibilità, quelli dei pasti successivi ("mischiotti": frutto a colazione, ecc.).
// Quali gruppi possono essere anticipati a un pasto precedente: frutta, carboidrati, frutta secca. Proteine e latticini restano nel loro pasto.
const SPOSTABILI = ['fruit', 'carb', 'fat'];
// Dove si può mangiare un gruppo preso da un altro pasto: i carboidrati (pane, pasta...) solo a colazione e nei pasti principali, non negli spuntini
export const canBorrow = (category, slot) => SPOSTABILI.includes(category) && (category !== 'carb' || slotKind(slot) !== 'spuntino');
export const categoryOf = (group) => group.options.find((o) => o.qty > 0)?.group;

// Un gruppo preso da un altro pasto conta solo se la ricetta ne contiene davvero una parte sostanziosa (non un pizzico di lime)
const approxGrams = (ing) => {
  if (['g', 'ml'].includes(ing.unit)) return ing.qty;
  if (ing.unit === 'pz') return ing.qty * (ing.group === 'fruit' ? 120 : ing.group === 'protein' ? 55 : 50); // un frutto ~120 g, un uovo ~55 g
  if (ing.unit === 'cucchiai') return ing.qty * 10;
  if (ing.unit === 'cucchiaini') return ing.qty * 4;
  return 0;
};
export const strongMatch = (recipe, m) => {
  if (!m || !(m.option.qty > 0)) return Boolean(m);
  const total = m.idx.reduce((a, k) => a + approxGrams(recipe.ingredients[k]), 0);
  return total >= m.option.qty * 0.3;
};

export const planFor = (e, slot, state) => {
  const own = mealOf(e, slot).plan;
  if (!isDayBalanced(e) || !state?.day) return { groups: own, keys: own.map((_, gi) => instanceKey(slot, gi)), must: own.length, ownCount: own.length };
  const consumed = state.day.consumed.get(e.id) || new Set();
  const si = SLOTS.indexOf(slot);
  const mustI = [];
  const later = [];
  for (const inst of dayInstancesFor(e, consumed)) {
    if (consumed.has(inst.key)) continue;
    const ii = SLOTS.indexOf(inst.slot);
    // la frutta e gli altri gruppi degli spuntini si mangiano a colazione o negli spuntini, mai a pranzo o a cena
    if (inst.slot !== slot && slotKind(inst.slot) === 'spuntino' && slotKind(slot) === 'principale') continue;
    // a pranzo e a cena non si anticipano i gruppi dei pasti successivi (niente carboidrati della cena a pranzo): si anticipa solo a colazione e negli spuntini
    if (inst.slot !== slot && ii > si && slotKind(slot) === 'principale') continue;
    if (inst.slot === slot) mustI.push(inst);
    else if (ii < si && movable(inst.group) && canBorrow(categoryOf(inst.group), slot)) mustI.push(inst); // rimasto indietro: va mangiato qui
    else if (ii > si && movable(inst.group) && canBorrow(categoryOf(inst.group), slot)) later.push(isBigFruit(inst.group) && !inst.part ? { ...inst, key: `${inst.key}~h1`, group: halveGroup(inst.group), part: 'h1' } : inst);
  }
  const ownI = mustI.filter((i) => i.slot === slot);
  const all = [...ownI, ...mustI.filter((i) => i.slot !== slot), ...later];
  return { groups: all.map((i) => i.group), keys: all.map((i) => i.key), must: mustI.length, ownCount: ownI.length };
};

export const planPairs = (eaters, slot, state) =>
  eaters.flatMap((e) => {
    const pf = planFor(e, slot, state);
    return pf.groups.slice(0, pf.must).map((group, gi) => ({ eater: e, gi, group, key: pf.keys[gi] }));
  });

// Limiti settimanali del piano ("due volte a settimana", "fino a 3 volte a settimana" per un elenco)
const norm = (s) => s.toLowerCase().replace(/[^a-zà-ù0-9]+/g, ' ').trim();
const useKeys = (eaterId, slot, opt) => [opt.maxPerWeek ? [`o:${eaterId}:${norm(opt.name)}`, opt.maxPerWeek] : null, opt.pool ? [`p:${eaterId}:${slot}:${opt.pool.key}`, opt.pool.max] : null].filter(Boolean);
const optionAvailable = (state, eaterId, slot, opt) => !state || useKeys(eaterId, slot, opt).every(([k, max]) => (state.optUse.get(k) || 0) < max);

const covers = (recipe, pair, slot, state) => {
  const pf = planFor(pair.eater, slot, state);
  const m = planMatches(recipe, pf.groups)[pair.gi];
  return Boolean(m) && (pair.gi < pf.ownCount || strongMatch(recipe, m)) && optionAvailable(state, pair.eater.id, slot, m.option);
};

// Gruppi dei pasti successivi che la ricetta consuma già adesso (modalità giornata)
const optionalGain = (recipe, eaters, slot, state) =>
  Math.min(1, eaters.reduce((n, e) => {
    const pf = planFor(e, slot, state);
    if (pf.groups.length <= pf.must) return n;
    return n + planMatches(recipe, pf.groups).slice(pf.must).filter((m) => strongMatch(recipe, m)).length;
  }, 0));

export const uncoveredPairs = (recipes, eaters, slot, state) =>
  planPairs(eaters, slot, state).filter((p) => !recipes.some((r) => covers(r, p, slot, state)));

export const pairLabel = (pair) => pair.group.options.slice(0, 2).map(describeOption).join(' o ');

// ---- alimenti semplici per i gruppi del piano che nessuna ricetta copre
const optionFitsPerson = (opt, person) => {
  const pseudo = { title: opt.name, ingredients: [{ name: opt.name }] };
  const allergic = (person.intolerances || []).some((a) => recipeAllergens(pseudo).has(a));
  const avoided = containsAvoided(pseudo, (person.avoid || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
  const level = { vegan: 0, vegetarian: 1, pescetarian: 2, omnivore: 3 }[foodDiet(opt.name)];
  return level <= memberLevel(person) && !allergic && !avoided;
};

// Alimenti del piano che hanno senso in quel pasto: a colazione latte, yogurt, cereali, pane, frutta (non riso, pasta o patate),
// a pranzo e cena il carboidrato è un cereale o una pasta prima che patate o gnocchi da soli
const BREAKFAST_FOODS = /fiocch|avena|muesli|granola|corn|cereali|pane|fett|biscott|croissant|yogurt|skyr|kefir|latte|bevanda|ricotta|uov|hummus|frutt|soffiat|salmone|affett|frumento|marmellat|miele|cacao|cioccolat|mirtill|kiwi/;
// Abbinamenti a colazione: hummus, ricotta, uova, salmone e affettati vanno con pane o fette, mai con cereali, granola o muesli;
// latte e yogurt vanno con cereali o pane. `taken` sono gli alimenti già scelti per la stessa persona in quel pasto.
const SPREAD = /hummus|ricotta|salmone|affett|prosciutto|speck|bresaola|uov/;
const CEREAL = /fiocch|avena|muesli|granola|corn|cereali|soffiat|riso|frumento|croissant|biscott(?!.*integral)/;
const pairOk = (a, b) => !((SPREAD.test(a) && CEREAL.test(b)) || (SPREAD.test(b) && CEREAL.test(a)));
const sensible = (opts, slot, taken = [], savory = false) => {
  const kind = slotKind(slot);
  const names = (o) => norm(o.name);
  let keep = kind === 'colazione' ? opts.filter((o) => BREAKFAST_FOODS.test(names(o))) : kind === 'principale' ? opts.filter((o) => !/patat|gnocchi/.test(names(o))) : opts;
  if (!keep.length) keep = opts;
  if (kind === 'colazione') {
    const paired = keep.filter((o) => taken.every((t) => pairOk(t, names(o))) && !(savory && CEREAL.test(names(o))));
    if (paired.length) keep = paired;
  }
  return keep;
};

const pickOption = (pair, slot, state, taken = [], savory = false, reqType = null) => {
  const opts = pair.group.options.filter((o) => optionFitsPerson(o, pair.eater) && optionAvailable(state, pair.eater.id, slot, o));
  let base = opts.length ? opts : pair.group.options;
  // quota proteica della settimana: il gruppo proteico di questo pasto è deciso in anticipo
  if (reqType) { const only = base.filter((o) => proteinTypeOfName(o.name) === reqType); if (only.length) base = only; }
  const pool = sensible(base, slot, taken, savory);
  return [...pool].sort((a, b) => (state.used.get(`food:${a.name}`) || 0) - (state.used.get(`food:${b.name}`) || 0) || Math.random() - 0.5)[0];
};

const entry = (recipe, eaters) => ({ instanceId: crypto.randomUUID(), recipeId: recipe.derivedFrom || recipe.id, ...(recipe.variantSpec ? { variant: recipe.variantSpec } : {}), ...(eaters ? { eaters } : {}) });

// Gruppi del giorno che un piatto consuma per le persone che regolano sulla giornata: { idPersona: [chiavi] }
// (claimed: gruppi già presi da altri piatti dello stesso pasto, per non contarli due volte)
export const usesFor = (recipe, eaters, slot, state, claimed = new Map()) => {
  const uses = {};
  for (const e of eaters) {
    if (!mealOf(e, slot).plan.length && !isDayBalanced(e)) continue;
    const pf = planFor(e, slot, state);
    const taken = claimed.get(e.id) || new Set();
    const keys = planMatches(recipe, pf.groups).map((m, i) => (m && (i < pf.ownCount || strongMatch(recipe, m)) && !taken.has(pf.keys[i]) ? pf.keys[i] : null)).filter(Boolean);
    keys.forEach((k) => taken.add(k));
    claimed.set(e.id, taken);
    // anche senza gruppi nuovi: così le quantità del piano non si applicano due volte (due ricette con frutta = 250 g in tutto, non 500)
    uses[e.id] = keys;
  }
  return Object.keys(uses).length ? uses : undefined;
};

// ---- stato e punteggio
export const newState = ({ favorites, recency, counts, day, month } = {}) => ({
  month, // mese (1-12) della settimana: serve alla stagionalità
  used: new Map(),
  optUse: new Map(), // limiti settimanali del piano: chiave -> pasti già usati
  day: day || { consumed: new Map() }, // gruppi del piano già consumati oggi (modalità giornata): persona -> Set di chiavi
  favorites: favorites || new Set(),
  recency: recency || new Map(),
  counts: counts || {}, // memberId -> foodId -> Set di "giorno|pasto"
});

// Frequenze settimanali di ogni persona ("legumi almeno 3 volte", "pesce 2 volte"): il peso cresce man mano che restano meno pasti
// per rispettarle, fino a diventare decisivo; un massimo già raggiunto scoraggia fortemente il cibo in più
const goalBonus = (recipe, eaters, state) => {
  const foods = foodsAtSlot(recipe, state.curSlot);
  const left = Math.max(1, state.mealsLeft ?? 14);
  let bonus = 0;
  for (const m of eaters) {
    for (const g of m.goals || []) {
      if (!foods.has(g.food)) continue;
      const n = state.counts[m.id]?.[g.food]?.size || 0;
      if ((g.mode === 'max' || g.mode === 'exact') && n >= g.times) bonus -= 60;
      else if (g.mode !== 'max' && n < g.times) bonus += 4 + 40 * Math.min(1, (g.times - n) / left);
    }
  }
  return bonus;
};

// Una ricetta va bene per chi ha un piano solo se non contiene ingredienti sostanziosi che quel pasto non prevede
// "evitando fichi, cachi, uva e mango", "evitiamo la soia": le ricette con quegli ingredienti non vanno bene in quel pasto
const planAvoids = (recipe, eaters, slot, state) => {
  const words = [...new Set(eaters.flatMap((e) => planFor(e, slot, state).groups.flatMap((g) => g.options.flatMap((o) => o.avoid || []))))];
  return words.some((w) => (recipe.ingredients || []).some((i) => i.name.toLowerCase().includes(w)));
};
export const planAllows = (recipe, eaters, slot, state) => !planAvoids(recipe, eaters, slot, state) && withinPlan(recipe, eaters, slot, state) && borrowOk(recipe, eaters, slot, state);

// Al massimo un gruppo anticipato da un pasto successivo per persona (un frutto a colazione, non mezza giornata in un colpo)
const borrowOk = (recipe, eaters, slot, state) => eaters.every((e) => {
  const pf = planFor(e, slot, state);
  if (pf.groups.length <= pf.must) return true;
  return planMatches(recipe, pf.groups).slice(pf.must).filter((m) => strongMatch(recipe, m)).length <= 1;
});

const planViolationCount = (recipe, eaters, slot, state) => eaters.reduce((n, e) => n + planViolations(recipe, planFor(e, slot, state).groups).length, 0);
export const withinPlan = (recipe, eaters, slot, state) => eaters.every((e) => planViolations(recipe, planFor(e, slot, state).groups).length === 0);

// Ingredienti principali di un piatto (i primi due dell'elenco): servono a non mettere nello stesso pasto due piatti con la stessa base
const MAIN_STOP = new Set(['di', 'al', 'alla', 'con', 'e', 'olio', 'sale', 'acqua', 'pepe', 'intero', 'fresco', 'fresca', 'naturale', 'integrale', 'bianco']);
const mainIngredients = (recipe) => new Set((recipe.ingredients || []).slice(0, 2).flatMap((i) => norm(i.name || '').split(' ').filter((w) => w.length > 3 && !MAIN_STOP.has(w))));
const sameBase = (recipe, chosen) => chosen.some((c) => { const a = mainIngredients(c); return [...mainIngredients(recipe)].some((w) => a.has(w)); });

// Grammi di ogni componente (proteine, carboidrati...) che un piatto porta, dai gruppi degli ingredienti
const massCache = new WeakMap();
const massOf = (recipe) => {
  if (massCache.has(recipe)) return massCache.get(recipe);
  const m = { protein: 0, carb: 0, veg: 0, fruit: 0, dairy: 0, fat: 0 };
  for (const ing of recipe.ingredients || []) if (ing.group in m) m[ing.group] += approxGrams(ing) || (ing.unit === 'g' || ing.unit === 'ml' ? ing.qty : 0);
  massCache.set(recipe, m);
  return m;
};
// Soglie sotto cui un ingrediente è solo un contorno (un cucchiaio di formaggio non è "la proteina del pasto")
const SUBSTANTIAL = { protein: 40, carb: 70, dairy: 100 };
const supplies = (recipe, cat) => (massOf(recipe)[cat] || 0) >= (SUBSTANTIAL[cat] || Infinity);
// Un pasto principale ha una sola fonte di proteine e una sola di carboidrati: niente "uova e anche pollo", "pasta e anche patate"
const compatible = (recipe, chosen, main) => !main || !['protein', 'carb'].some((c) => supplies(recipe, c) && chosen.some((x) => supplies(x, c)));

// A colazione, anche se il piano lo permette, un piatto da spuntino deve sembrare una colazione (non crudité o insalate)
const BREAKFAST_LIKE = /hummus|yogurt|ricotta|uov|pane|toast|fett|porridge|overnight|muesli|granola|latte|pancake|chia|bircher|skyr|kefir|avena|frutt/i;
const NOT_BREAKFAST = /verdur|crudit|insalat|cetriol|carot|sedano|olive|pomodor/i;

// Somiglianza fra due piatti (ingredienti principali in comune, stessa base di carboidrati): serve a far mangiare piatti simili
// a chi in un pasto condiviso ha menu diversi per la dieta
const ingSetCache = new WeakMap();
const mainIngredientsOf = (r) => {
  if (ingSetCache.has(r)) return ingSetCache.get(r);
  const ings = (r.ingredients || []).filter((i) => i.unit !== 'q.b.' && ['carb', 'protein', 'veg', 'dairy', 'fruit'].includes(i.group));
  const carb = ings.filter((i) => i.group === 'carb').sort((a, b) => b.qty - a.qty)[0];
  const v = { set: new Set(ings.map((i) => canonicalName(i.name))), carb: carb ? canonicalName(carb.name) : null };
  ingSetCache.set(r, v);
  return v;
};
const simCache = new Map();
export const mainCarbOf = (recipe) => mainIngredientsOf(recipe).carb;

const similarity = (a, b) => {
  if (String(b.id).startsWith('ref:')) return similarityRaw(a, b); // i riferimenti cambiano ogni volta: niente cache
  const key = `${a.id}|${b.id}`;
  if (simCache.has(key)) return simCache.get(key);
  const v = similarityRaw(a, b);
  simCache.set(key, v);
  return v;
};
// Tema del piatto (themes.js): due piatti dello stesso tema (frittata e frittata col prosciutto, bowl con tofu e bowl con pollo) si assomigliano
const familyOf = (r) => themeOf(r);
const similarityRaw = (a, b) => {
  const x = mainIngredientsOf(a), y = mainIngredientsOf(b);
  const inter = [...x.set].filter((w) => y.set.has(w)).length;
  const union = new Set([...x.set, ...y.set]).size || 1;
  const fa = familyOf(a), fb = b.title ? familyOf(b) : null;
  // lo stesso tema dichiarato da due ricette (le varianti vegana, vegetariana e onnivora di uno stesso piatto) pesa di più
  const explicit = a.theme && b.theme && a.theme === b.theme;
  return inter / union + (x.carb && x.carb === y.carb ? 0.25 : 0) + (explicit ? 0.7 : fa && fb && fa === fb ? 0.4 : 0);
};
// simili sì, uguali meno: chi mangia carne o pesce deve avere anche lui il suo piatto (con tetto alla somiglianza e piccola penalità se è proprio lo stesso)
const similarityBonus = (recipe, reference) => (reference?.length ? 30 * Math.min(0.9, Math.max(...reference.map((r) => similarity(recipe, r)))) - (reference.some((r) => r.id === recipe.id) ? 22 : 0) : 0);

// Meal prep e zero spreco: stessa base del giorno prima (si cuoce doppio) e ingredienti di una confezione già aperta (si finisce prima che vada a male)
const reuseBonus = (recipe, state) => {
  let bonus = 0;
  const prev = state.prevCarb?.get(state.curSlot);
  const carb = mainIngredientsOf(recipe).carb;
  if (prev && carb && prev.has(carb) && ['pranzo', 'cena'].includes(String(state.curSlot).toLowerCase())) bonus += 5;
  if (state.openPacks?.size && slotKind(state.curSlot) === 'principale') {
    for (const ing of recipe.ingredients || []) {
      const p = packFor(ing.name);
      const open = p && state.openPacks.get(p.label);
      if (open && state.curDay - open.day <= p.shelf && state.curDay > open.day) { bonus += 6; break; }
    }
  }
  return bonus;
};

const baseScore = (recipe, eaters, state, preferLevel, slot) =>
  - (state.used.get(recipe.id) || 0) * 12
  - recencyPenalty(state.recency.get(recipe.id))
  + (state.favorites.has(recipe.id) ? 5 : 0)
  + goalBonus(recipe, eaters, state)
  + (preferLevel !== undefined && recipeLevel(recipe) === preferLevel ? 8 : 0)
  + similarityBonus(recipe, state.reference)
  + (colorMass(recipe) >= 80 ? 3 : 0)
  + reuseBonus(recipe, state)
  + (state.wantDerivable && droppableProteins(recipe) !== null ? 9 : 0) // la ricetta base di un pasto con più menu deve poter generare le varianti per gli altri
  - (state.month ? Math.min(2, outOfSeason(recipe, state.month).length) * 14 : 0)
  + Math.random() * 5;

const best = (pool, scoreFn, min = -Infinity) => {
  const top = pool.map((r) => [r, scoreFn(r)]).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > min ? top[0] : null;
};

// ---- un menu per un gruppo di persone con vincoli comuni
// Con il piano scritto: sceglie ricette che coprono i gruppi del piano di ognuno, poi aggiunge alimenti semplici.
// Senza piano: pasto equilibrato (carboidrati, proteine, verdure) per i pasti principali.
export const proposeMenu = (recipes, constraints, slot, state, { split = false, level, derive } = {}) => {
  const eaters = constraints.eaters || [];
  const ids = split ? eaters.map((e) => e.id) : undefined;
  const main = slotKind(slot) === 'principale';
  let relaxed = false;
  // Il piano scritto di chi mangia ha l'ultima parola: una ricetta che ne copre un gruppo (per esempio l'hummus a colazione)
  // va bene anche se di solito non si mangia a quel pasto. Vale per colazione e spuntini, non per i piatti da pranzo e cena.
  const light = slotKind(slot) !== 'principale';
  const coversPlanGroup = (r) => light && ['colazione', 'spuntino'].includes(recipeKind(r)) && breakfastClass(r) !== 'no' && (slotKind(slot) !== 'colazione' || (BREAKFAST_LIKE.test(r.title) && !NOT_BREAKFAST.test(r.title))) && eaters.some((e) => {
    const pf = planFor(e, slot, state);
    return planMatches(r, pf.groups).some((m, gi) => m && gi < pf.ownCount && strongMatch(r, m));
  });
  const slotOk = (r) => kindFits(r, slot) || coversPlanGroup(r);
  let pool = recipes.filter((r) => slotOk(r) && fits(r, constraints));
  if (!pool.length && constraints.takeaway) { pool = recipes.filter((r) => slotOk(r) && fits(r, constraints, { ignoreTakeaway: true })); relaxed = true; }
  const pref = split ? level : undefined;
  const chosen = [];
  const items = [];
  pool = pool.filter((r) => planAllows(r, eaters, slot, state));
  // gruppo proteico previsto per questo pasto (quote settimanali): sì le ricette con quella fonte principale o senza fonte proteica
  // (a cui si aggiunge l'alimento del piano), no quelle con un'altra fonte
  const reqProtein = (() => { for (const e of eaters) { const t = state.quota?.get(`${e.id}|${state.curDay}|${slot}`); if (t) return t; } return null; })();
  // senza fonte principale va bene solo un piatto davvero senza proteine (un po' di ricotta salata lo farebbe passare per "coperto" senza esserlo)
  const proteinOk = (r) => !reqProtein || (() => {
    const src = proteinSourceOf(r);
    if (src) return src === reqProtein;
    return !(r.ingredients || []).some((i) => i.group === 'protein' && approxGrams(i) >= 15);
  })();
  if (reqProtein) pool = pool.filter(proteinOk);
  // la colazione è dolce, a meno che il piano di qualcuno non preveda proteine o piatti salati a colazione
  if (slot === 'Colazione') {
    const sweet = pool.filter((r) => !isSavory(r) || coversPlanGroup(r));
    if (sweet.length) pool = sweet;
  }

  // variante derivata dalla ricetta base scelta per il gruppo più restrittivo: stessa base, altra fonte proteica
  const derivedPick = (() => {
    if (!derive?.length || !main || relaxed) return null;
    const cands = [];
    for (const type of PROTEIN_TYPES) {
      // solo fonti che il gruppo della ricetta base non può mangiare (pesce, carne): le altre sono già alternative della stessa dieta
      if (type === 'salumi' || ['legumi', 'uova', 'formaggi'].includes(type)) continue;
      for (const spec of variantSpecs(derive[0], type)) {
        const r = deriveRecipe(derive[0], spec);
        if (!kindFits(r, slot) || !fits(r, constraints) || !planAllows(r, eaters, slot, state) || !proteinOk(r)) continue;
        cands.push(r);
      }
    }
    return best(cands, (r) => goalBonus(r, eaters, state) + (reqProtein ? 20 : 0) + Math.random() * 6 - (state.used.get(r.derivedFrom) || 0) * 4);
  })();
  const pairs = planPairs(eaters, slot, state);
  const hasPlan = eaters.some((e) => mealOf(e, slot).plan.length);
  if (hasPlan) {
    const pickLoop = (candidates, extra = () => 0) => {
      for (let n = 0; n < 3; n++) {
        const rem = uncoveredPairs(chosen, eaters, slot, state);
        if (!rem.length) break;
        // un contorno copre solo le verdure del piano: non sostituisce mai il carboidrato o la proteina (niente patate al forno da sole)
        const gain = (r) => rem.filter((p) => covers(r, p, slot, state) && (recipeKind(r) !== 'contorno' || categoryOf(p.group) === 'veg')).length;
        const pick = best(candidates.filter((r) => !chosen.includes(r) && gain(r) > 0 && compatible(r, chosen, main)), (r) => gain(r) * 10 + optionalGain(r, eaters, slot, state) * 6 - (chosen.length && sameBase(r, chosen) ? 25 : 0) - (main && consistencyOf(r) === 'liquido' && chosen.some((c) => consistencyOf(c) === 'liquido') ? 40 : 0) - (slot === 'Colazione' && isSavory(r) ? 30 : 0) + extra(r) + baseScore(r, eaters, state, pref, slot), 0);
        if (!pick) break;
        chosen.push(pick);
      }
    };
    if (derivedPick) chosen.push(derivedPick);
    pickLoop(pool);
    // Un pasto per più persone (regole condivise, menu unico) non può ridursi a tanti alimenti diversi per ognuno:
    // se nessun piatto rispetta alla lettera tutti i piani, si sceglie quello che ne copre di più (sarà segnalato come fuori piano)
    if (main && eaters.length > 1 && uncoveredPairs(chosen, eaters, slot, state).length) {
      const relaxed = recipes.filter((r) => kindFits(r, slot) && fits(r, constraints) && !planAvoids(r, eaters, slot, state) && proteinOk(r));
      pickLoop(relaxed.length ? relaxed : [], (r) => -planViolationCount(r, eaters, slot, state) * 2);
    }
    // gruppi che ogni piatto consuma (modalità giornata): servono a mettere le dosi giuste e a tenere il conto del giorno
    const claimed = new Map();
    const usesOf = (recipe) => usesFor(recipe, eaters, slot, state, claimed);
    chosen.forEach((r) => { const it = entry(r, ids); const u = usesOf(r); if (u) it.uses = u; items.push(it); });
    // gruppi non coperti da nessuna ricetta: alimenti semplici dal piano
    const foods = new Map();
    const looseP = uncoveredPairs(chosen, eaters, slot, state)
      // se i piatti scelti portano già una fonte sostanziosa di quel componente (proteine, carboidrati), non se ne aggiunge una seconda
      .filter((p) => !(main && ['protein', 'carb'].includes(categoryOf(p.group)) && chosen.some((r) => supplies(r, categoryOf(p.group)))));
    // Nei pasti per più persone lo stesso componente è lo stesso alimento per tutti (tutti riso, non uno pasta e l'altro riso),
    // quando i piani di ognuno lo permettono
    const common = new Map();
    const byKind = new Map();
    const seenCat = new Map();
    for (const p of looseP) {
      const cat = categoryOf(p.group);
      const k = `${p.eater.id}|${cat}`;
      const nth = seenCat.get(k) || 0;
      seenCat.set(k, nth + 1);
      const key = `${cat}#${nth}`;
      if (!byKind.has(key)) byKind.set(key, []);
      byKind.get(key).push(p);
    }
    for (const [key, ps] of byKind) {
      if (ps.length < 2) continue;
      const lists = ps.map((p) => sensible(p.group.options.filter((o) => optionFitsPerson(o, p.eater) && optionAvailable(state, p.eater.id, slot, o)), slot).map((o) => norm(o.name)));
      const shared = lists[0].filter((n) => lists.every((l) => l.includes(n)));
      if (shared.length) common.set(key, shared.sort((a, b) => (state.used.get(`food:${a}`) || 0) - (state.used.get(`food:${b}`) || 0) || Math.random() - 0.5)[0]);
    }
    const seenNth = new Map();
    const pickedBy = new Map();
    const savoryChosen = chosen.some((r) => isSavory(r));
    for (const p of [...looseP].sort((a, b) => a.gi - b.gi)) {
      const cat = categoryOf(p.group);
      const k = `${p.eater.id}|${cat}`;
      const nth = seenNth.get(k) || 0;
      seenNth.set(k, nth + 1);
      const wanted = common.get(`${cat}#${nth}`);
      const taken = pickedBy.get(p.eater.id) || [];
      const reqT = categoryOf(p.group) === 'protein' ? state.quota?.get(`${p.eater.id}|${state.curDay}|${slot}`) : null;
      let opt = (!reqT && wanted && p.group.options.find((o) => norm(o.name) === wanted)) || pickOption(p, slot, state, taken, savoryChosen, reqT);
      pickedBy.set(p.eater.id, [...taken, norm(opt.name)]);
      // "frutta secca" nel piano vuol dire un solo tipo (noci, mandorle...), nella quantità indicata
      if (/^frutta secca$/i.test(opt.name.trim())) {
        const nuts = ['noci', 'mandorle', 'nocciole'].filter((n) => optionFitsPerson({ ...opt, name: n }, p.eater));
        if (nuts.length) opt = { ...opt, name: nuts[Math.floor(Math.random() * nuts.length)] };
      }
      const key = opt.name.toLowerCase();
      if (!foods.has(key)) foods.set(key, { food: { name: opt.name, qty: opt.qty, unit: opt.unit, group: opt.group }, eaters: new Set(), uses: {} });
      foods.get(key).eaters.add(p.eater.id);
      if (isDayBalanced(p.eater)) (foods.get(key).uses[p.eater.id] ||= []).push(p.key);
    }
    for (const f of foods.values()) items.push({ instanceId: crypto.randomUUID(), food: f.food, eaters: [...f.eaters], ...(Object.keys(f.uses).length ? { uses: f.uses } : {}) });
    return { items, relaxed };
  }

  const required = coarseRequired(slot);
  const mainPool = pool.filter((r) => (main ? recipeKind(r) === 'principale' : true));
  const first = derivedPick || best(mainPool.length ? mainPool : pool, (r) => required.filter((g) => coveredGroups([r]).has(g)).length * 10 + baseScore(r, eaters, state, pref, slot));
  if (!first) return { items: [], relaxed };
  chosen.push(first);
  for (let n = 0; n < 2; n++) {
    const missing = missingGroups(required, chosen);
    if (!missing.length) break;
    const side = best(
      recipes.filter((r) => ['contorno', 'principale'].includes(recipeKind(r)) && main && !chosen.includes(r) && fits(r, constraints, { ignoreTakeaway: !constraints.takeaway ? true : relaxed }) && missing.some((g) => coveredGroups([r]).has(g))),
      (r) => missing.filter((g) => coveredGroups([r]).has(g)).length * 10 + baseScore(r, eaters, state, pref)
    );
    if (!side) break;
    chosen.push(side);
  }
  return { items: chosen.map((r) => entry(r, ids)), relaxed };
};

// Registra un pasto nello stato (piatti usati e pasti per obiettivo)
export const registerMeal = (state, items, clusterEaters, day, slot, recipeMap, everyone) => {
  for (const it of items) {
    if (!it.leftoverOf) state.used.set(it.food ? `food:${it.food.name}` : it.recipeId, (state.used.get(it.food ? `food:${it.food.name}` : it.recipeId) || 0) + 1);
    const recipe = resolveItem(it, recipeMap);
    if (!recipe) continue;
    const eaters = Array.isArray(it.eaters) ? (everyone || clusterEaters).filter((e) => it.eaters.includes(e.id)) : clusterEaters;
    // confezioni aperte: se il piatto usa meno di una confezione, il resto resta da usare nei giorni dopo
    if (!it.leftoverOf) for (const ing of recipe.ingredients || []) {
      const p = packFor(ing.name);
      if (p && ing.qty > 0 && ing.unit !== 'q.b.' && p.size > ing.qty * Math.max(1, eaters.length)) (state.openPacks ||= new Map()).set(p.label, { day });
    }
    // base di carboidrati del giorno (per il meal prep del giorno dopo)
    if (!it.leftoverOf && ['Pranzo', 'Cena'].includes(slot)) { const c = mainIngredientsOf(recipe).carb; if (c) ((state.todayCarb ||= new Map()).get(slot) || state.todayCarb.set(slot, new Set()).get(slot)).add(c); }
    for (const [pid, keys] of Object.entries(it.uses || {})) { const set = state.day.consumed.get(pid) || new Set(); keys.forEach((k) => set.add(k)); state.day.consumed.set(pid, set); }
    for (const f of foodsAtSlot(recipe, slot)) for (const m of eaters) ((state.counts[m.id] ||= {})[f] ||= new Set()).add(`${day}|${slot}`);
    // limiti settimanali del piano: ogni pasto che usa un'alternativa limitata la consuma
    for (const m of eaters) {
      const seen = new Set();
      planMatches(recipe, mealOfItem(m, slot, it).plan).forEach((mt) => {
        if (!mt) return;
        for (const [k] of useKeys(m.id, slot, mt.option)) if (!seen.has(k)) { seen.add(k); state.optUse.set(k, (state.optUse.get(k) || 0) + 1); }
      });
    }
  }
};

// Settimana intera. Con una regola "cucina una volta ogni N giorni" lo stesso piatto torna come avanzo nei giorni successivi.
export const generateWeek = (recipes, household, ctx = {}) => {
  const state = newState(ctx);
  const quota = ctx.quota || allocateProteins(household);
  state.quota = quota.map; // quote proteiche settimanali di chi ha frequenze sui gruppi proteici
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const carry = {};
  const days = {};
  for (let d = 0; d < 7; d++) {
    days[d] = {};
    state.day = { consumed: new Map() }; // ogni giorno ricomincia con il suo budget
    state.prevCarb = state.todayCarb || new Map(); // basi di carboidrati di ieri
    state.todayCarb = new Map();
    for (const slot of SLOTS) {
      state.mealsLeft = 14 - (d * 2 + (slot === 'Cena' || slot === 'Spuntino 2' ? 1 : 0)); // pasti principali ancora da fare questa settimana
      state.curSlot = slot;
      state.curDay = d;
      // assenti e ospiti già indicati nel piano esistente restano al loro posto
      const prevData = ctx.existing?.[d]?.[slot];
      const people = slotPeople(household, slot, prevData);
      if (!people.length) continue;
      const items = [];
      let deriveBase = null; // ricetta base del primo gruppo (il più restrittivo): le varianti degli altri gruppi ne derivano
      const refs = []; // piatti già scelti per gli altri gruppi dello stesso pasto: i menu diversi per dieta devono assomigliarsi
      // si parte da chi ha più vincoli (piano scritto, dieta più restrittiva): gli altri si adattano a un menu simile
      const clusters = menuClusters(household, d, slot, people, prevData).sort((x, y) => {
        const px = x.eaters.some((e) => mealOf(e, slot).plan.length) ? 0 : 1, py = y.eaters.some((e) => mealOf(e, slot).plan.length) ? 0 : 1;
        return (x.level ?? 9) - (y.level ?? 9) || px - py;
      });
      for (const cluster of clusters) {
        const batch = Math.max(1, ...rulesFor(household, d, slot, cluster.eaters).map((r) => r.batch || 1));
        const c = mealConstraints(household, d, slot, cluster.eaters);
        // se domani a pranzo si mangiano gli avanzi di questa cena, la cena deve andare bene anche per il pranzo di domani (asporto, dieta)
        if (slot === 'Cena' && d < 6) {
          const nx = rulesFor(household, d + 1, 'Pranzo', cluster.eaters);
          if (nx.some((r) => r.leftoverDinner)) { c.takeaway = c.takeaway || nx.some((r) => r.takeaway); c.maxLevel = Math.min(c.maxLevel, ruleCap(nx)); }
        }
        const key = `${slot}:${cluster.eaters.map((e) => e.id).sort().join(',')}`;
        const prev = carry[key];
        let menu;
        // regola "pranzo con gli avanzi della cena di ieri"
        const wantsLeftover = slot === 'Pranzo' && d > 0 && rulesFor(household, d, slot, cluster.eaters).some((r) => r.leftoverDinner);
        const ids = new Set(cluster.eaters.map((e) => e.id));
        const yesterday = wantsLeftover ? (days[d - 1]?.Cena?.items || []).filter((it) => !it.eaters || it.eaters.some((id) => ids.has(id))) : [];
        const leftoverMenu = yesterday.length && yesterday.every((it) => { const r = resolveItem(it, recipeMap); return r && !r.isFood && fits(r, c); })
          ? yesterday.map((it) => ({ ...it, instanceId: crypto.randomUUID(), leftoverOf: it.leftoverOf || it.instanceId, leftoverDay: d - 1, ...(it.eaters ? { eaters: it.eaters.filter((id) => ids.has(id)) } : cluster.split ? { eaters: [...ids] } : {}) }))
          : null;
        if (leftoverMenu) {
          menu = leftoverMenu;
        } else if (batch > 1 && prev?.left > 0 && prev.items.every((it) => { const r = resolveItem(it, recipeMap); return r && fits(r, c, { ignoreTakeaway: true }); })) {
          menu = prev.items.map((it) => ({ ...it, instanceId: crypto.randomUUID(), leftoverOf: it.leftoverOf || it.instanceId, leftoverDay: prev.day }));
          prev.left--;
        } else {
          state.reference = refs;
          state.wantDerivable = !deriveBase && clusters.length > 1 && ['Pranzo', 'Cena'].includes(slot);
          menu = proposeMenu(recipes, c, slot, state, { ...cluster, derive: deriveBase }).items;
          state.wantDerivable = false;
          state.reference = null;
          if (batch > 1 && menu.length) carry[key] = { left: batch - 1, items: menu, day: d };
          else delete carry[key];
        }
        registerMeal(state, menu, cluster.eaters, d, slot, recipeMap, people);
        // il menu di questo gruppo (piatti e alimenti semplici) diventa il riferimento per i gruppi successivi dello stesso pasto,
        // sia nei pasti condivisi con menu per dieta sia in quelli individuali: chi mangia nello stesso momento mangia cose simili
        const parts = menu.map((it) => resolveItem(it, recipeMap)).filter(Boolean);
        if (!deriveBase && !leftoverMenu) { const mains = menu.map((it) => resolveItem(it, recipeMap)).filter((r) => r && !r.isFood && !r.derivedFrom && recipeKind(r) === 'principale'); if (mains.length) deriveBase = mains; }
        if (parts.length) refs.push({ id: `ref:${slot}:${refs.length}`, ingredients: parts.flatMap((r) => r.ingredients || []) });
        items.push(...menu);
      }
      // lo stesso piatto scelto per due gruppi di persone diventa un piatto solo, mangiato da tutti e due
      for (let a = 0; isSharedSlot(household, slot, prevData) && a < items.length; a++) {
        for (let b = items.length - 1; b > a; b--) {
          const x = items[a], y = items[b];
          if (!x.recipeId || x.recipeId !== y.recipeId || x.variant?.key !== y.variant?.key || x.leftoverOf || y.leftoverOf || !Array.isArray(x.eaters) || !Array.isArray(y.eaters)) continue;
          x.eaters = [...new Set([...x.eaters, ...y.eaters])];
          if (y.uses) x.uses = { ...(x.uses || {}), ...y.uses };
          items.splice(b, 1);
        }
        if (Array.isArray(items[a].eaters) && items[a].eaters.length === people.length) delete items[a].eaters;
      }
      const planned = people.some((p) => mealOf(p, slot).plan.length);
      if (items.length || planned) days[d][slot] = { items, ...(!items.length ? { covered: true } : {}), ...(prevData?.absent?.length ? { absent: prevData.absent } : {}), ...(prevData?.guests?.length ? { guests: prevData.guests } : {}), ...(prevData?.joined && Object.keys(prevData.joined).length ? { joined: prevData.joined } : {}), ...(prevData?.mode ? { mode: prevData.mode } : {}) };
    }
  }
  return days;
};

// Sostituisce un piatto con un altro dello stesso tipo adatto a chi mangia, preferendo quelli che coprono
// gli stessi gruppi del piano, non fatti di recente, e i preferiti
export const swapRecipe = (recipes, current, constraints, ctx = {}, slot) => {
  if (!current || current.isFood) return null;
  const state = newState(ctx);
  const eaters = constraints.eaters || [];
  const kind = recipeKind(current);
  const had = planPairs(eaters, slot, state).filter((p) => covers(current, p, slot, state));
  const pool = recipes.filter((r) => r.id !== current.id && recipeKind(r) === kind && fits(r, constraints) && planAllows(r, eaters, slot, state));
  const pick = best(pool, (r) => had.filter((p) => covers(r, p, slot, state)).length * 10 + baseScore(r, eaters, state, undefined, slot));
  return pick ? entry(pick) : null;
};

// Gruppi già consumati oggi dalle persone che regolano sulla giornata, in base ai piatti già pianificati
// (escludendo, se serve, il pasto che si sta per rifare)
export const dayStateFor = (household, daySlots, recipeMap, excludeSlot) => {
  const consumed = new Map();
  const slots = Object.fromEntries(Object.entries(daySlots || {}).filter(([k]) => k !== excludeSlot));
  const eatersOfItem = (item, slot, data) => eatersOf(item, household, slot, data);
  for (const m of household.members) {
    if (!isDayBalanced(m)) continue;
    consumed.set(m.id, consumedKeys(m, slots, (it) => resolveItem(it, recipeMap), eatersOfItem));
  }
  return { consumed };
};


// Genera la settimana più volte, la controlla (audit.js) e tiene la migliore: i difetti che il generatore non sa evitare al primo colpo
// (un piatto strano, una frequenza mancata) quasi sempre spariscono in un altro tentativo. Si ferma al primo senza problemi.
export const generateWeekChecked = (recipes, household, ctx = {}, { tries = 8 } = {}) => {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  let best = null;
  for (let i = 0; i < tries; i++) {
    const quota = allocateProteins(household);
    const days = generateWeek(recipes, household, { ...ctx, quota });
    const issues = auditWeek(days, household, recipeMap, { month: ctx.month });
    for (const q of quota.problems) issues.push({ kind: 'vincoli', day: -1, slot: '', msg: q.msg, weight: 40 });
    const score = auditScore(issues);
    if (!best || score < best.score) best = { days, issues, score };
    if (score === 0) break;
  }
  // difetti che nessun tentativo ha risolto: si dicono invece di proporre in silenzio un menu che non rispetta il piano
  best.problems = best.issues.filter((i) => i.weight >= 25).slice(0, 12).map(({ day, slot, msg, kind }) => ({ day, slot, msg, kind }));
  return best;
};

// Menu di un pasto per più gruppi di persone, come in generateWeek: si parte dal gruppo più restrittivo, gli altri ne derivano una variante
// o scelgono piatti simili. Serve al Planner quando si rifà un singolo pasto o si cambia fra condiviso e individuale.
export const menusForSlot = (recipes, household, day, slot, clusters, state, recipeMap, everyone, constraintsFor) => {
  const sorted = [...clusters].sort((x, y) => (x.level ?? 9) - (y.level ?? 9));
  const items = [];
  const refs = [];
  let deriveBase = null;
  let relaxed = false;
  state.curSlot = slot;
  state.curDay = day;
  for (const cluster of sorted) {
    state.reference = refs;
    state.wantDerivable = !deriveBase && sorted.length > 1 && ['Pranzo', 'Cena'].includes(slot);
    const r = proposeMenu(recipes, constraintsFor(slot, cluster.eaters), slot, state, { ...cluster, derive: deriveBase });
    state.reference = null;
    state.wantDerivable = false;
    relaxed = relaxed || r.relaxed;
    registerMeal(state, r.items, cluster.eaters, day, slot, recipeMap, everyone);
    const parts = r.items.map((it) => resolveItem(it, recipeMap)).filter(Boolean);
    if (!deriveBase) { const mains = parts.filter((p) => !p.isFood && !p.derivedFrom && recipeKind(p) === 'principale'); if (mains.length) deriveBase = mains; }
    if (parts.length) refs.push({ id: `ref:${slot}:${refs.length}`, ingredients: parts.flatMap((p) => p.ingredients || []) });
    items.push(...r.items);
  }
  return { items, relaxed };
};
