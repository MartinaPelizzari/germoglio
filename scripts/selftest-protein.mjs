// Prova del caso "sorella": 14 pasti proteici a settimana (pranzo e cena), con frequenze: legumi almeno 2, carne rossa 2, pesce 2,
// carne bianca 2, uova 2, formaggi al massimo 2. Il conteggio riguarda solo i pasti di lei e conta solo la fonte proteica principale.
import fs from 'node:fs';
import { generateWeek, generateWeekChecked } from '../src/lib/planGen.js';
import { auditWeek } from '../src/lib/audit.js';
import { parseSlotPlan } from '../src/lib/dietPlan.js';
import { proteinSourceOf } from '../src/lib/protein.js';
import { allocateProteins } from '../src/lib/quota.js';
import { resolveItem } from '../src/lib/items.js';
import { eatersOf } from '../src/lib/scale.js';
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
const house = { members: [mk('s', 'Sorella', 'omnivore', T, goals), mk('m', 'Martina', 'vegetarian', null), mk('a', 'Mamma', 'omnivore', null)], rules: [{ id: 'r', label: 'Pranzo', slots: ['Pranzo'], days: [0, 1, 2, 3, 4], dietCap: 'vegetarian', takeaway: true }] };

// 1. l'assegnazione dei gruppi: 14 pasti, vincoli rispettati, pranzi feriali vegetariani
for (let i = 0; i < 20; i++) {
  const q = allocateProteins(house);
  check(!q.problems.length, 'assegnazione impossibile: ' + JSON.stringify(q.problems));
  const t = {};
  for (const [k, v] of q.map) { t[v] = (t[v] || 0) + 1; const [, d, slot] = k.split('|'); if (slot === 'Pranzo' && Number(d) < 5) check(['legumi', 'uova', 'formaggi'].includes(v), `pranzo feriale con ${v} (dev'essere vegetariano)`); }
  check(q.map.size === 14, `i pasti proteici sono ${q.map.size} invece di 14`);
  check(Object.values(t).reduce((a, b) => a + b, 0) === 14, 'la somma dei gruppi non è 14');
  check((t.legumi || 0) >= 2 && t['carne-rossa'] === 2 && t.pesce === 2 && t['carne-bianca'] === 2 && t.uova === 2 && (t.formaggi || 0) <= 2, 'frequenze non rispettate: ' + JSON.stringify(t));
}

// 2. le settimane generate: un solo gruppo proteico per pasto, solo per i suoi pasti, somma 14, nessun problema segnalato dall'audit
let clean = 0;
for (let i = 0; i < 12; i++) {
  const r = generateWeekChecked(recipes, house, { month: 10 }, { tries: 8 });
  const days = r.days;
  const tally = {};
  let meals = 0;
  for (let d = 0; d < 7; d++) for (const slot of ['Pranzo', 'Cena']) {
    const data = days[d][slot];
    const src = new Set();
    for (const it of data?.items || []) {
      if (!eatersOf(it, house, slot, data).some((e) => e.id === 's')) continue;
      const rr = resolveItem(it, map);
      const s = it.food ? null : proteinSourceOf(rr);
      if (it.food) { const t2 = proteinSourceOf(rr); if (t2) src.add(t2); } else if (s) src.add(s);
    }
    meals++;
    check(src.size === 1, `g${d} ${slot}: ${src.size} gruppi proteici`);
    for (const s of src) tally[s] = (tally[s] || 0) + 1;
  }
  check(meals === 14 && Object.values(tally).reduce((a, b) => a + b, 0) === 14, 'somma dei gruppi diversa da 14');
  // il conteggio mostrato nell'app è quello di lei soltanto e uguale a questo
  const counts = weekCounts({ days }, house, map).s || {};
  for (const [f, n] of Object.entries(tally)) check(counts[f] === n, `il conteggio dell'app per ${f} (${counts[f]}) non coincide con quello reale (${n})`);
  const prob = r.issues.filter((x) => ['proteine', 'vincoli'].includes(x.kind));
  if (!prob.length) clean++;
}
console.log(`Settimane senza problemi proteici: ${clean}/12`);
check(clean === 12, 'alcune settimane non rispettano le quote proteiche');

// 3. la verifica automatica blocca il menu: un menu con la proteina sbagliata viene segnalato
const bad = generateWeek(recipes, house, { month: 10 });
const lunch = bad[2].Pranzo; // feriale
lunch.items = [{ instanceId: 'x', food: { name: 'pollo', qty: 170, unit: 'g', group: 'protein' }, eaters: ['s'] }, { instanceId: 'y', food: { name: 'tonno', qty: 100, unit: 'g', group: 'protein' }, eaters: ['s'] }];
check(auditWeek(bad, house, map, { month: 10 }).some((i) => i.kind === 'proteine'), "l'audit non segnala un pasto con due gruppi proteici");

console.log(ko ? ko + ' problemi' : 'Tutto ok.');
process.exit(ko ? 1 : 0);
