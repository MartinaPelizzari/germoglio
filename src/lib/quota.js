// Quote proteiche settimanali: se una persona ha frequenze sui gruppi proteici (legumi almeno 2, pesce esattamente 2...) e il piano
// prevede una fonte proteica a pranzo e a cena, ogni pasto riceve PRIMA il suo gruppo proteico, in modo che le frequenze tornino per forza
// e la somma dei gruppi sia uguale al numero dei pasti proteici attivi (14 con pranzo e cena tutti i giorni, meno se la persona salta dei pasti).
import { PROTEIN_TYPES, proteinTypeOfName } from './protein.js';
import { memberLevel, ruleCap, rulesFor } from './diet.js';
import { mealOf, memberOnDay } from './scale.js';

const LEVEL_TYPES = [['legumi'], ['legumi', 'uova', 'formaggi'], ['legumi', 'uova', 'formaggi', 'pesce'], PROTEIN_TYPES];
export const MAIN_SLOTS = ['Pranzo', 'Cena'];

// tipi di fonte proteica che il piano di quel pasto ammette (dai nomi delle alternative del gruppo proteico)
export const planProteinTypes = (member, slot) => {
  const types = new Set();
  for (const g of mealOf(member, slot).plan) {
    const hits = g.options.map((o) => proteinTypeOfName(o.name)).filter(Boolean);
    if (hits.length) hits.forEach((t) => types.add(t));
  }
  return types;
};
export const proteinGoals = (member) => (member.goals || []).filter((g) => PROTEIN_TYPES.includes(g.food));
export const needsQuota = (member) => proteinGoals(member).length > 0 && MAIN_SLOTS.some((s) => mealOf(member, s).eats && planProteinTypes(member, s).size > 0);

const shuffle = (a, rnd) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

// Assegna un gruppo proteico a ogni pasto principale di ogni persona con frequenze: { map: Map("persona|giorno|pasto" → tipo), problems: [{ person, msg }] }
// existing: i pasti già pianificati (le presenze corrette a mano restano valide)
export const allocateProteins = (household, rnd = Math.random, existing) => {
  const map = new Map();
  const problems = [];
  for (const m of household.members.filter(needsQuota)) {
    const goals = proteinGoals(m);
    const lo = {}, hi = {};
    for (const g of goals) { lo[g.food] = g.mode === 'max' ? 0 : g.times; hi[g.food] = g.mode === 'min' ? Infinity : g.times; }
    const types = goals.map((g) => g.food);
    const slots = [];
    for (let d = 0; d < 7; d++) for (const slot of MAIN_SLOTS) {
      // pasto attivo per quella persona quel giorno (lo schema di presenza può escluderlo): il totale dei pasti proteici è quello dei pasti attivi
      if (!mealOf(memberOnDay(m, d, existing?.[d]), slot).eats) continue;
      const allowedByPlan = planProteinTypes(m, slot);
      if (!allowedByPlan.size) continue;
      const level = Math.min(memberLevel(m), ruleCap(rulesFor(household, d, slot, [m])));
      const domain = types.filter((t) => LEVEL_TYPES[level]?.includes(t) && allowedByPlan.has(t));
      slots.push({ d, slot, domain });
    }
    const n = slots.length;
    const need = types.reduce((a, t) => a + lo[t], 0);
    const cap = (t) => slots.filter((s) => s.domain.includes(t)).length;
    const bad = [];
    if (need > n) bad.push(`le frequenze minime sommano ${need} pasti ma i pasti proteici sono ${n}`);
    for (const t of types) if (cap(t) < lo[t]) bad.push(`${t}: servono almeno ${lo[t]} pasti ma solo ${cap(t)} li ammettono (dieta, regole e piano)`);
    if (types.reduce((a, t) => a + Math.min(hi[t], cap(t)), 0) < n) bad.push('i gruppi ammessi non bastano a coprire tutti i pasti proteici');
    if (slots.some((s) => !s.domain.length)) bad.push('un pasto non ha nessun gruppo proteico ammesso');
    if (bad.length) { problems.push({ person: m.name, msg: `${m.name}: ${bad.join('; ')}` }); continue; }

    // ricerca con ritorno: assegna un tipo a ogni pasto rispettando minimi, massimi e capacità residua
    const solutions = [];
    const cnt = Object.fromEntries(types.map((t) => [t, 0]));
    const cur = new Array(n);
    const dfs = (i, budget) => {
      if (solutions.length >= 24 || budget.left-- <= 0) return;
      if (i === n) { if (types.every((t) => cnt[t] >= lo[t] && cnt[t] <= hi[t])) solutions.push([...cur]); return; }
      const remaining = n - i;
      for (const t of shuffle(slots[i].domain.filter((x) => cnt[x] < hi[x]), rnd)) {
        cnt[t]++; cur[i] = t;
        // potatura: i minimi mancanti devono stare nei pasti rimasti
        let ok = true, miss = 0;
        for (const x of types) {
          const m2 = Math.max(0, lo[x] - cnt[x]);
          miss += m2;
          if (m2 > slots.slice(i + 1).filter((s) => s.domain.includes(x)).length) { ok = false; break; }
        }
        if (ok && miss <= remaining - 1) dfs(i + 1, budget);
        cnt[t]--;
      }
    };
    dfs(0, { left: 40000 });
    if (!solutions.length) { problems.push({ person: m.name, msg: `${m.name}: non esiste una distribuzione dei gruppi proteici che rispetti tutte le frequenze` }); continue; }
    // fra le soluzioni la più varia: meno ripetizioni consecutive e meno lo stesso gruppo a pranzo e a cena dello stesso giorno
    const score = (sol) => sol.reduce((a, t, i) => a + (i > 0 && sol[i - 1] === t ? 3 : 0) + (i > 1 && sol[i - 2] === t ? 1 : 0), 0);
    const best = solutions.sort((a, b) => score(a) - score(b))[0];
    slots.forEach((s, i) => map.set(`${m.id}|${s.d}|${s.slot}`, best[i]));
  }
  return { map, problems };
};
