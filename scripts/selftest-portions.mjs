// Quantità plausibili: il caso "mamma" (56 anni, 157 cm, lavoro dinamico, nessun allenamento) proponeva 155 g di pasta a pranzo e 80 g di pane a cena.
// Il peso non è noto: si provano più valori. Limiti di sicurezza per porzione, crudo/cotto, dieta della nutrizionista invariata.
import fs from 'node:fs';
import { computeNeeds } from '../src/lib/needs.js';
import { autoMeals } from '../src/lib/autoPlan.js';
import { portionIssue, maxPortion } from '../src/lib/portionLimits.js';
import { auditWeek } from '../src/lib/audit.js';
import { generateWeekChecked } from '../src/lib/planGen.js';
import { matchScore, parseSlotPlan } from '../src/lib/dietPlan.js';
import { setNutrition } from '../src/lib/nutrition.js';
import { setSeasons } from '../src/lib/seasons.js';

const nd = new URL('../src/data/nutrition/', import.meta.url);
setNutrition(fs.readdirSync(nd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, nd)))));
setSeasons(JSON.parse(fs.readFileSync(new URL('../src/data/seasons.json', import.meta.url))));
const rd = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(rd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, rd), 'utf8')));
const map = new Map(recipes.map((r) => [r.id, r]));
let ko = 0;
const check = (c, m) => { if (!c) { ko++; console.log('KO', m); } };

// 1. il caso di prima: 155 g di pasta e 80 g di pane sono fuori scala per 2070-2220 kcal, 100 g e 50 g no
check(!!portionIssue('Pasta', 155, 'g', 2070), '155 g di pasta con 2070 kcal devono essere fuori scala');
check(!!portionIssue('Pane', 80, 'g', 2070), '80 g di pane con 2070 kcal devono essere fuori scala');
check(!portionIssue('Pasta', 100, 'g', 2070) && !portionIssue('Pane', 50, 'g', 2070), 'le porzioni ragionevoli non vanno segnalate');
check(!portionIssue('Pasta', 155, 'g', 3300), '155 g di pasta per chi ha bisogno di 3300 kcal è accettabile');
check(maxPortion('Riso basmati', 2000).max === 120 && maxPortion('Fette biscottate', 2000).max === 45, 'limiti dalle porzioni standard (80 g e 30 g x 1,5)');

// 2. profilo di tua madre: più pesi (il vero peso non è nel progetto) e due livelli di lavoro
const lines = (t) => t.split('\n').filter(Boolean).map((l) => l.match(/^(\d+(?:,\d+)?)\s*(g|ml|pz)?\s+(.*?)(?:\s*\[.*\])?$/)).filter(Boolean).map((m) => ({ qty: Number(m[1].replace(',', '.')), unit: m[2] || 'pz', name: m[3] }));
const report = [];
for (const work of ['light', 'active']) for (const weight of [55, 65, 75, 85]) {
  const n = computeNeeds({ sex: 'F', age: 56, height: 157, weight, work, workouts: 0, goal: 'maintain', diet: 'omnivore' });
  const { texts, estKcal } = autoMeals({ diet: 'omnivore', kcal: n.kcal, protein: n.protein });
  for (const [slot, t] of Object.entries(texts)) for (const l of lines(t)) check(!portionIssue(l.name, l.qty, l.unit, n.kcal), `${work} ${weight} kg, ${slot}: ${l.qty} ${l.unit} ${l.name} fuori scala`);
  const pasta = Math.max(...lines(texts.Pranzo).filter((l) => /^pasta$/i.test(l.name)).map((l) => l.qty));
  const pane = Math.max(...lines(texts.Cena).filter((l) => /^pane$/i.test(l.name)).map((l) => l.qty));
  const cap = n.kcal < 2400 ? 100 : n.kcal < 3000 ? 120 : 160;
  check(pasta <= cap, `${work} ${weight} kg: pasta a pranzo ${pasta} g oltre ${cap} g`);
  check(pane <= (n.kcal < 2400 ? 50 : 60), `${work} ${weight} kg: pane a cena ${pane} g`);
  check(estKcal <= n.kcal * 1.05 && estKcal >= n.kcal * 0.85, `${work} ${weight} kg: il piano stima ${estKcal} kcal contro ${n.kcal}`);
  report.push(`${work} ${weight} kg: ${n.kcal} kcal, pasta ${pasta} g, pane a cena ${pane} g, piano ${estKcal} kcal`);
}
console.log(report.join('\n'));

// 3. audit: una dose fuori scala per chi ha un piano dell'app si segnala; per chi ha la dieta della nutrizionista no (le quantità sono quelle della dieta)
{
  const pastaRecipe = recipes.find((r) => r.category === 'Pranzo' && r.ingredients.some((i) => /^pasta/i.test(i.name) && i.unit === 'g'));
  const text = '155 g pasta oppure 155 g riso\n\nverdure';
  const mk = (source) => ({ id: 'm', name: 'Mamma', diet: 'omnivore', planSource: source, body: { sex: 'F', age: 56, height: 157, weight: 65, work: 'light', workouts: 0, goal: 'maintain' }, meals: { Pranzo: { planText: text, plan: parseSlotPlan(text) } }, visibleSlots: ['Pranzo'] });
  const days = { 0: { Pranzo: { items: [{ instanceId: 'x', recipeId: pastaRecipe.id }] } } };
  const a = auditWeek(days, { members: [mk('auto')], rules: [] }, map, { month: 10 });
  check(a.some((i) => i.kind === 'porzione'), 'l\'audit non segnala 155 g di pasta in un piano creato dall\'app');
  const b = auditWeek(days, { members: [mk('nutritionist')], rules: [] }, map, { month: 10 });
  check(!b.some((i) => i.kind === 'porzione'), 'le quantità di una dieta della nutrizionista non vanno giudicate');
}

// 4. crudo e cotto: la dose del piano non si applica a un ingrediente in stato diverso
{
  const cotti = parseSlotPlan('150 g legumi cotti')[0].options[0];
  check(matchScore(cotti, { name: 'Lenticchie secche', group: 'protein' }) === 0, 'legumi cotti del piano sulle lenticchie secche della ricetta');
  check(matchScore(cotti, { name: 'Ceci cotti', group: 'protein' }) > 0, 'legumi cotti del piano sui ceci cotti della ricetta');
  const pastaCotta = parseSlotPlan('200 g pasta cotta')[0].options[0];
  check(matchScore(pastaCotta, { name: 'Pasta integrale corta', group: 'carb' }) === 0, 'pasta cotta del piano sulla pasta (a crudo) della ricetta');
  check(matchScore(parseSlotPlan('80 g pasta')[0].options[0], { name: 'Pasta integrale corta', group: 'carb' }) > 0, 'pasta senza stato sulla pasta della ricetta');
}

// 5. settimane generate per lei: nessuna porzione fuori scala e nessun difetto grave
{
  const n = computeNeeds({ sex: 'F', age: 56, height: 157, weight: 65, work: 'light', workouts: 0, goal: 'maintain', diet: 'omnivore' });
  const { meals } = autoMeals({ diet: 'omnivore', kcal: n.kcal, protein: n.protein });
  const mom = { id: 'a', name: 'Mamma', diet: 'omnivore', planSource: 'auto', body: { sex: 'F', age: 56, height: 157, weight: 65, work: 'light', workouts: 0, goal: 'maintain' }, meals };
  for (let i = 0; i < 4; i++) {
    const r = generateWeekChecked(recipes, { members: [mom], rules: [] }, { month: 10 }, { tries: 6 });
    check(!r.issues.some((x) => x.kind === 'porzione'), 'porzioni fuori scala nella settimana generata: ' + r.issues.filter((x) => x.kind === 'porzione').map((x) => x.msg).slice(0, 2).join(' | '));
    check(!r.issues.some((x) => ['dieta', 'vuoto', 'dose'].includes(x.kind)), 'difetti gravi nella settimana di mamma');
  }
}
console.log(ko ? `\n${ko} problemi` : '\nTutto ok.');
process.exit(ko ? 1 : 0);
