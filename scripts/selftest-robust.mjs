// Prova di robustezza: molte famiglie diverse (diete, intolleranze, piani scritti e automatici, regole, frequenze).
// Per ognuna si genera la settimana più volte e si controlla con audit.js: i difetti gravi devono sparire sempre.
// Con REAL_PLANS=1 usa anche i PDF locali indicati in REAL_PDFS (non fanno parte del progetto).
import fs from 'node:fs';
import { generateWeek, generateWeekChecked } from '../src/lib/planGen.js';
import { auditWeek, auditScore } from '../src/lib/audit.js';
import { autoMeals } from '../src/lib/autoPlan.js';
import { computeNeeds } from '../src/lib/needs.js';
import { parseSlotPlan } from '../src/lib/dietPlan.js';
import { setNutrition } from '../src/lib/nutrition.js';
import { setSeasons } from '../src/lib/seasons.js';

const nd = new URL('../src/data/nutrition/', import.meta.url);
setNutrition(fs.readdirSync(nd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, nd)))));
setSeasons(JSON.parse(fs.readFileSync(new URL('../src/data/seasons.json', import.meta.url))));
const MONTH = Number(process.env.MONTH || 10);
const rd = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(rd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, rd), 'utf8')));
const map = new Map(recipes.map((r) => [r.id, r]));

const body = { sex: 'F', age: 32, height: 166, weight: 62, work: 'sedentary', workouts: 0, goal: 'maintain' };
const auto = (id, name, diet, extra = {}, b = body) => { const n = computeNeeds({ ...b, diet }); const { meals } = autoMeals({ diet, kcal: n.kcal, protein: n.protein, intolerances: extra.intolerances || [] }); return { id, name, diet, meals, planSource: 'auto', ...extra }; };
const written = (id, name, diet, text, extra = {}) => ({ id, name, diet, planSource: 'nutritionist', meals: Object.fromEntries(Object.entries(text).map(([s, t]) => [s, { planText: t, plan: parseSlotPlan(t) }])), ...extra });

const PLAN_A = { // vegetariana, frutta e frutta secca negli spuntini, hummus a colazione
  Colazione: '200 ml latte d\'avena oppure 200 ml latte vaccino parzialmente scremato oppure 50 g hummus oppure 125 g yogurt bianco intero oppure 125 g yogurt greco\n\n40 g fette biscottate integrali oppure 60 g pane integrale oppure 50 g fiocchi di avena oppure 50 g granola oppure 50 g muesli a ridotto contenuto di zuccheri oppure 50 g cornflakes',
  'Spuntino 1': '250 g frutta fresca\n\n10 g frutta secca',
  Pranzo: '90 g pasta integrale oppure 90 g riso basmati oppure 90 g farro oppure 90 g orzo oppure 90 g quinoa oppure 360 g patate\n\nverdure',
  'Spuntino 2': '250 g frutta fresca\n\n20 g cioccolato fondente',
  Cena: '2 uova [max 3 volte a settimana]\noppure 150 g tofu [max 2 volte a settimana]\noppure 150 g hamburger di legumi\noppure fino a 230 g legumi cotti\noppure 90 g scamorza\n\n60 g pane integrale oppure 40 g riso basmati oppure 200 g patate\n\nverdure',
};
const PLAN_B = { // onnivora, colazione con tre gruppi e frutta, pranzo e cena con carboidrato + proteina + verdure
  Colazione: '125 g yogurt bianco oppure 125 g skyr oppure 200 ml latte oppure 2 uova\n\n50 g pane integrale oppure 50 g cereali oppure 40 g fette biscottate\n\n1 pz frutta fresca',
  'Spuntino 1': 'Yogurt bianco\nFrutto fresco + frutta secca',
  Pranzo: '100 g pasta integrale oppure 100 g riso oppure 100 g farro oppure 100 g quinoa oppure 130 g pane integrale\n\n170 g pesce bianco oppure 170 g salmone oppure 150 g ceci oppure 170 g carne bianca oppure 3 uova oppure 100 g ricotta oppure 80 g salumi\n\nverdure',
  Cena: '100 g pasta integrale oppure 100 g riso oppure 100 g farro oppure 130 g pane integrale oppure 300 g patate [2 volte a settimana]\n\n170 g pesce bianco oppure 170 g salmone oppure 150 g lenticchie oppure 170 g carne bianca oppure 3 uova oppure 100 g mozzarella\n\nverdure',
};
const rulesWeekday = [{ id: 'r', label: "Pranzo d'asporto", slots: ['Pranzo'], days: [0, 1, 2, 3, 4], dietCap: 'vegetarian', takeaway: true }];
const families = {
  'Singola, piano scritto vegetariano': { members: [written('a', 'Martina', 'vegetarian', PLAN_A, { goals: [{ id: 'g', food: 'legumi', times: 3, mode: 'min' }] })], rules: [] },
  'Singola, piano scritto onnivoro': { members: [written('a', 'Lucia', 'omnivore', PLAN_B, { goals: [{ id: 'g', food: 'pesce', times: 2, mode: 'min' }] })], rules: [] },
  'Singole automatiche (4 diete)': { members: [auto('a', 'A', 'omnivore'), auto('b', 'B', 'vegetarian'), auto('c', 'C', 'vegan'), auto('d', 'D', 'pescetarian')], rules: [] },
  'Famiglia con regola feriale': { members: [written('a', 'Martina', 'vegetarian', PLAN_A), written('b', 'Lucia', 'omnivore', PLAN_B, { intolerances: ['glutine'] }), { id: 'c', name: 'Mamma', diet: 'omnivore', meals: {} }, auto('d', 'Papà', 'omnivore', {}, { sex: 'M', age: 50, height: 175, weight: 110, work: 'active', workouts: 0, goal: 'lose' })], rules: rulesWeekday },
  'Famiglia senza regole': { members: [written('a', 'Martina', 'vegetarian', PLAN_A), { id: 'c', name: 'Mamma', diet: 'omnivore', meals: {} }, { id: 'e', name: 'Papà', diet: 'omnivore', intolerances: ['lattosio'], meals: {} }], rules: [] },
  'Cena individuale (non condivisa)': { members: [written('a', 'Martina', 'vegetarian', PLAN_A), written('b', 'Lucia', 'omnivore', PLAN_B), { id: 'c', name: 'Mamma', diet: 'omnivore', meals: {} }], rules: [], sharedSlots: ['Pranzo'] },
  'Intolleranze varie': { members: [auto('a', 'A', 'vegetarian', { intolerances: ['glutine', 'lattosio'] }), auto('b', 'B', 'omnivore', { intolerances: ['uova', 'guscio'] })], rules: [] },
};

const HEAVY = ['dieta', 'vuoto', 'colazione', 'spostato', 'doppio', 'contorno', 'doppioGruppo', 'regola', 'proteine', 'dose', 'fuoripiano', 'elettrodomestico'];
const RUNS = Number(process.env.RUNS || 12);
let fails = 0;
for (const [name, house] of Object.entries(families)) {
  let rawClean = 0, rawHeavy = 0, chkHeavy = 0, chkClean = 0;
  const kinds = {};
  const light = {};
  const t0 = Date.now();
  for (let r = 0; r < RUNS; r++) {
    const raw = auditWeek(generateWeek(recipes, house, { month: MONTH }), house, map, { month: MONTH });
    if (!raw.length) rawClean++;
    if (raw.some((i) => HEAVY.includes(i.kind))) rawHeavy++;
    const best = generateWeekChecked(recipes, house, { month: MONTH }, { tries: 8 });
    if (!best.issues.length) chkClean++;
    for (const i of best.issues.filter((x) => !HEAVY.includes(x.kind))) light[i.kind + ': ' + i.msg.slice(0, 60)] = (light[i.kind + ': ' + i.msg.slice(0, 60)] || 0) + 1;
    // dosi e piatti fuori piano che nessuna combinazione può evitare (es. regola "pranzo d'asporto in un piatto" contro piani rigidi)
    // sono ammessi solo se la settimana li dichiara nei suoi "problemi": l'app non deve mai sforare in silenzio
    const declared = new Set((best.problems || []).map((q) => `${q.kind}|${q.day}|${q.slot}|${q.msg}`));
    const heavy = best.issues.filter((i) => HEAVY.includes(i.kind) && !(['dose', 'fuoripiano'].includes(i.kind) && declared.has(`${i.kind}|${i.day}|${i.slot}|${i.msg}`)));
    if (heavy.length) { chkHeavy++; for (const i of heavy) kinds[i.kind + ': ' + i.msg.slice(0, 70)] = (kinds[i.kind + ': ' + i.msg.slice(0, 70)] || 0) + 1; }
  }
  console.log(`${name}: senza controllo ${rawClean}/${RUNS} perfette (${rawHeavy} con difetti gravi); con controllo ${chkClean}/${RUNS} perfette, ${chkHeavy} con difetti gravi`);
  console.log(`    (${Math.round((Date.now() - t0) / RUNS)} ms a settimana con controllo; difetti lievi rimasti: ${Object.entries(light).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => n + 'x ' + k).join(' | ') || 'nessuno'})`);
  for (const [k, n] of Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 4)) console.log('   ', n, 'x', k);
  if (chkHeavy > 0) fails++;
}
console.log(fails ? `${fails} famiglie con difetti gravi` : 'Tutto ok.');
process.exit(fails ? 1 : 0);
