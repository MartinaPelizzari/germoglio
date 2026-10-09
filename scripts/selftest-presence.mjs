// Presenza ai pasti per persona e per giorno: schemi ricorrenti ("non pranzo dal lunedì al venerdì"), correzione del singolo giorno,
// quote proteiche ricalcolate sui pasti attivi e segnalazione quando lo schema rende impossibile un vincolo.
import fs from 'node:fs';
import { generateWeekChecked } from '../src/lib/planGen.js';
import { auditWeek } from '../src/lib/audit.js';
import { parseSlotPlan } from '../src/lib/dietPlan.js';
import { allocateProteins } from '../src/lib/quota.js';
import { awayByRule, eatersOf, householdOnDay, isPresent, slotPeople, SLOTS } from '../src/lib/scale.js';
import { buildShoppingList } from '../src/lib/shopping.js';
import { weekCounts } from '../src/lib/goals.js';

const rd = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(rd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, rd), 'utf8')));
const map = new Map(recipes.map((r) => [r.id, r]));
let ko = 0;
const check = (c, m) => { if (!c) { ko++; console.log('KO', m); } };
const prot = '170 g pesce bianco oppure 170 g salmone oppure 170 g carne bianca oppure 170 g carne rossa di manzo oppure 3 uova oppure 150 g ceci oppure 150 g lenticchie oppure 100 g ricotta oppure 100 g mozzarella oppure 80 g salumi';
const T = { Pranzo: `100 g pasta integrale oppure 100 g riso oppure 100 g farro\\n\\n${prot}\\n\\nverdure`, Cena: `100 g pasta integrale oppure 100 g riso oppure 100 g farro\\n\\n${prot}\\n\\nverdure` };
const mk = (id, name, diet, plan, goals = []) => ({ id, name, diet, goals, meals: plan ? Object.fromEntries(Object.entries(plan).map(([s, x]) => [s, { planText: x.replace(/\\n/g, '\n'), plan: parseSlotPlan(x.replace(/\\n/g, '\n')) }])) : {} });
const goals = [{ id: '1', food: 'legumi', times: 2, mode: 'min' }, { id: '2', food: 'carne-rossa', times: 2, mode: 'exact' }, { id: '3', food: 'pesce', times: 2, mode: 'exact' }, { id: '4', food: 'carne-bianca', times: 2, mode: 'exact' }, { id: '5', food: 'uova', times: 2, mode: 'exact' }, { id: '6', food: 'formaggi', times: 2, mode: 'max' }];
const away = (slots, days) => ({ id: Math.random().toString(36).slice(2), slots, days });
const WEEKDAYS = [0, 1, 2, 3, 4];

// 1. regole di base
{
  const m = { id: 'p', name: 'Papà', diet: 'omnivore', meals: {}, away: [away(['Pranzo'], WEEKDAYS)] };
  check(awayByRule(m, 'Pranzo', 0) && !awayByRule(m, 'Pranzo', 5) && !awayByRule(m, 'Cena', 0), 'schema: pranzo assente lun-ven');
  check(!isPresent(m, 'Pranzo', 2, undefined) && isPresent(m, 'Pranzo', 6, undefined) && isPresent(m, 'Cena', 2, undefined), 'presenza per giorno');
  check(isPresent(m, 'Pranzo', 2, { here: ['p'] }), 'la correzione del giorno riattiva il pasto');
  check(!isPresent({ ...m, away: [] }, 'Pranzo', 2, { absent: ['p'] }), 'assente a mano');
}

// 2. famiglia reale: papà non pranza dal lunedì al venerdì, Martina non cena lunedì e mercoledì
const dad = { ...mk('p', 'Papà', 'omnivore', null), away: [away(['Pranzo'], WEEKDAYS)] };
const me = { ...mk('m', 'Martina', 'vegetarian', null), away: [away(['Cena'], [0, 2])] };
const family = { members: [me, dad, mk('a', 'Mamma', 'omnivore', null), mk('s', 'Sorella', 'omnivore', T, goals)], rules: [] };
let bad = 0, heavy = 0;
for (let i = 0; i < 4; i++) {
  const r = generateWeekChecked(recipes, family, { month: 10 }, { tries: 6 });
  heavy += r.issues.filter((x) => ['dieta', 'vuoto', 'proteine', 'fuoripiano', 'dose', 'doppioGruppo'].includes(x.kind)).length;
  for (let d = 0; d < 7; d++) {
    const hh = householdOnDay(family, d, r.days[d]);
    for (const slot of SLOTS) {
      const data = r.days[d][slot];
      for (const it of data?.items || []) {
        const ids = eatersOf(it, hh, slot, data).map((e) => e.id);
        if (slot === 'Pranzo' && d < 5 && ids.includes('p')) bad++;
        if (slot === 'Cena' && [0, 2].includes(d) && ids.includes('m')) bad++;
      }
    }
    check(slotPeople(hh, 'Pranzo', r.days[d].Pranzo).some((x) => x.id === 'p') === (d >= 5), `g${d}: papà a pranzo solo nel weekend`);
    check(slotPeople(hh, 'Cena', r.days[d].Cena).some((x) => x.id === 'm') === ![0, 2].includes(d), `g${d}: Martina a cena tranne lunedì e mercoledì`);
  }
  // il menu del pranzo feriale non ha niente per papà: la spesa del lunedì a pranzo non conta le sue dosi
  const shopNoDad = buildShoppingList({ plan: { days: r.days }, days: [0, 1, 2, 3, 4, 5, 6], recipeMap: map, household: family });
  const shopAlways = buildShoppingList({ plan: { days: r.days }, days: [0, 1, 2, 3, 4, 5, 6], recipeMap: map, household: { ...family, members: family.members.map((m) => ({ ...m, away: [] })) } });
  const tot = (l) => l.reduce((a, x) => a + (x.unit === 'g' ? x.qty : 0), 0);
  check(tot(shopNoDad) < tot(shopAlways), 'la spesa con gli schemi di presenza deve essere minore di quella con tutti sempre presenti');
}
check(bad === 0, `${bad} piatti assegnati a chi in quel pasto è assente per schema`);
check(heavy === 0, `${heavy} difetti gravi nelle settimane con schemi di presenza`);

// 3. correzione del singolo giorno: papà mangia a pranzo il lunedì anche se per schema non c'è
{
  const first = generateWeekChecked(recipes, family, { month: 10 }, { tries: 3 });
  const existing = JSON.parse(JSON.stringify(first.days));
  existing[0].Pranzo = { ...(existing[0].Pranzo || {}), here: ['p'] };
  const r = generateWeekChecked(recipes, family, { month: 10, existing }, { tries: 3 });
  const hh = householdOnDay(family, 0, r.days[0]);
  check(slotPeople(hh, 'Pranzo', r.days[0].Pranzo).some((x) => x.id === 'p'), 'papà presente lunedì a pranzo dopo la correzione');
  check((r.days[0].Pranzo?.here || []).includes('p'), 'la correzione resta nel piano rigenerato');
  check(!slotPeople(householdOnDay(family, 1, r.days[1]), 'Pranzo', r.days[1].Pranzo).some((x) => x.id === 'p'), 'martedì papà resta assente');
}

// 4. i conteggi settimanali sono quelli dei suoi pasti attivi: sorella assente a pranzo il sabato e la domenica = 12 pasti proteici
{
  const sis = { ...mk('s', 'Sorella', 'omnivore', T, goals), away: [away(['Pranzo'], [5, 6])] };
  const h = { members: [sis, mk('m', 'Martina', 'vegetarian', null), mk('a', 'Mamma', 'omnivore', null)], rules: [] };
  for (let i = 0; i < 12; i++) {
    const q = allocateProteins(h);
    check(!q.problems.length, 'con 12 pasti attivi le frequenze sono rispettabili: ' + JSON.stringify(q.problems));
    const t = {};
    for (const v of q.map.values()) t[v] = (t[v] || 0) + 1;
    check(q.map.size === 12 && Object.values(t).reduce((a, b) => a + b, 0) === 12, `somma dei gruppi ${Object.values(t).reduce((a, b) => a + b, 0)} invece di 12`);
    check((t.legumi || 0) >= 2 && t['carne-rossa'] === 2 && t.pesce === 2 && t['carne-bianca'] === 2 && t.uova === 2 && (t.formaggi || 0) <= 2, 'frequenze non rispettate: ' + JSON.stringify(t));
  }
  const r = generateWeekChecked(recipes, h, { month: 10 }, { tries: 8 });
  const c = weekCounts({ days: r.days }, h, map).s || {};
  const sum = ['legumi', 'carne-rossa', 'pesce', 'carne-bianca', 'uova', 'formaggi'].reduce((a, f) => a + (c[f] || 0), 0);
  check(sum === 12, `il conteggio mostrato nell'app somma ${sum} invece di 12 ` + JSON.stringify(c));
  check(!auditWeek(r.days, h, map, { month: 10 }).some((x) => x.kind === 'proteine'), 'audit proteine pulito con 12 pasti');
}

// 5. schema impossibile: con soli 6 pasti attivi le frequenze (almeno 10 pasti) non si possono rispettare: si segnala, non si genera in silenzio
{
  const sis = { ...mk('s', 'Sorella', 'omnivore', T, goals), away: [away(['Pranzo', 'Cena'], [0, 1, 2, 3])] };
  const h = { members: [sis, mk('m', 'Martina', 'vegetarian', null)], rules: [] };
  check(allocateProteins(h).problems.length > 0, 'schema impossibile non segnalato dall\'assegnazione');
  const r = generateWeekChecked(recipes, h, { month: 10 }, { tries: 3 });
  check(r.problems.some((p) => p.kind === 'vincoli'), 'schema impossibile non compare nei problemi della settimana');
}
console.log(ko ? `\n${ko} problemi` : '\nTutto ok.');
process.exit(ko ? 1 : 0);
