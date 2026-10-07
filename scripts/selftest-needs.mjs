// Prova di fabbisogni e dieta equilibrata generata: energia, diete, intolleranze, settimana generata
import fs from 'node:fs';
import { computeNeeds, bmr, bmrMifflin } from '../src/lib/needs.js';
import { autoMeals } from '../src/lib/autoPlan.js';
import { setNutrition } from '../src/lib/nutrition.js';
import { generateWeek } from '../src/lib/planGen.js';
import { recipeAllergens } from '../src/lib/allergens.js';
import { SLOTS } from '../src/lib/meals.js';

const nd = new URL('../src/data/nutrition/', import.meta.url);
setNutrition(fs.readdirSync(nd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, nd)))));
const rd = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(rd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, rd), 'utf8')));
let ko = 0;
const check = (c, m) => { if (!c) { ko++; console.log('KO', m); } };

// formule: esempio del documento (uomo 30 anni, 68,9 kg, 175 cm → B 1663, Mifflin 1638)
const ex = { sex: 'M', age: 30, weight: 68.9, height: 175 };
check(Math.round(bmr(ex)) === 1663 && Math.round(bmrMifflin(ex)) === 1638, 'BMR di esempio ' + bmr(ex));

const base = { sex: 'F', age: 34, height: 165, weight: 60, work: 'sedentary', workouts: 0, goal: 'maintain' };
const n0 = computeNeeds(base);
console.log('Donna 34, 60 kg, sedentaria:', n0.bmr, 'x', n0.pal, '→', n0.kcal, 'kcal, proteine', n0.protein, 'g');
check(n0.kcal > 1700 && n0.kcal < 1950, 'mantenimento plausibile');
const lose = computeNeeds({ ...base, goal: 'lose' });
check(lose.kcal < n0.kcal && lose.kcal >= 1200, 'dimagrire con deficit e soglia');
const trained = computeNeeds({ ...base, workouts: 4, minutes: 60, intensity: 'moderate' });
check(trained.kcal > n0.kcal + 100 && trained.protein > n0.protein, 'allenamenti aumentano energia e proteine');
// cautele
check(computeNeeds({ ...base, age: 16 }).blocked?.id === 'minor', 'minorenne');
check(computeNeeds({ ...base, pregnant: true }).blocked?.id === 'pregnant', 'gravidanza');
check(computeNeeds({ ...base, condition: true }).blocked?.id === 'condition', 'patologie');
check(computeNeeds({ ...base, weight: 45 }).blocked?.id === 'underweight', 'sottopeso');
const ed = computeNeeds({ ...base, goal: 'lose', edHistory: true });
check(ed.goal === 'maintain' && ed.hideNumbers, 'disturbi alimentari: mantenimento e niente numeri');
check(computeNeeds({ ...base, goal: 'lose', age: 80 }).goal === 'maintain', 'over 75 senza deficit');

// piano generato per diete e intolleranze diverse
const cases = [
  { name: 'onnivora', diet: 'omnivore', body: base },
  { name: 'vegana allenata', diet: 'vegan', body: { ...base, sex: 'M', weight: 75, height: 180, workouts: 4, minutes: 60, intensity: 'moderate' } },
  { name: 'vegetariana senza lattosio', diet: 'vegetarian', intolerances: ['lattosio'], body: base },
  { name: 'pescetariana senza glutine', diet: 'pescetarian', intolerances: ['glutine'], body: { ...base, goal: 'lose' } },
  { name: 'padre 110 kg magazziniere', diet: 'omnivore', body: { sex: 'M', age: 45, height: 175, weight: 110, work: 'active', workouts: 0, goal: 'lose' } },
  { name: 'uomo onnivoro in aumento', diet: 'omnivore', body: { sex: 'M', age: 25, height: 182, weight: 72, work: 'light', workouts: 3, minutes: 60, intensity: 'intense', goal: 'gain' } },
];
for (const c of cases) {
  const needs = computeNeeds({ ...c.body, diet: c.diet });
  const { meals, estKcal, texts } = autoMeals({ diet: c.diet, intolerances: c.intolerances || [], kcal: needs.kcal, protein: needs.protein });
  console.log(`\n${c.name}: obiettivo ${needs.kcal} kcal, stima del piano ${estKcal} kcal`);
  console.log('  Pranzo:', texts.Pranzo.replace(/\n+/g, ' + '));
  console.log('  Cena:', texts.Cena.replace(/\n+/g, ' + '));
  check(Math.abs(estKcal - needs.kcal) < needs.kcal * 0.05, `${c.name}: stima lontana dal fabbisogno (${estKcal} vs ${needs.kcal})`);
  check(SLOTS.every((s) => meals[s]?.plan?.length), `${c.name}: pasto senza gruppi`);
  const all = Object.values(texts).join('\n');
  if (c.diet === 'vegan') check(!/yogurt\b(?! di soia)|uova|pesce|pollo|carne|formaggio|latte parz/.test(all), 'vegano con prodotti animali');
  if (c.diet === 'vegetarian') check(!/pesce|pollo|carne rossa/.test(all), 'vegetariano con carne o pesce');
  for (const a of c.intolerances || []) check(!Object.values(texts).some((t) => t.split('\n').some((l) => recipeAllergens({ ingredients: [{ name: l.replace(/^\S+\s\S+\s/, '') }] }).has(a))), `${c.name}: contiene ${a}`);
  // settimana generata: nessun buco, nessun errore
  const me = { id: 'm', name: 'Prova', diet: c.diet, intolerances: c.intolerances || [], meals };
  for (let run = 0; run < 5; run++) {
    const days = generateWeek(recipes, { members: [me], rules: [] });
    const empty = [0, 1, 2, 3, 4, 5, 6].flatMap((i) => SLOTS.filter((s) => !days[i]?.[s]?.items?.length).map((s) => `${i}:${s}`));
    check(empty.length === 0, `${c.name}: pasti vuoti ${empty.join(',')}`);
  }
}
console.log(ko ? `\n${ko} problemi` : '\nTutto ok.');
process.exit(ko ? 1 : 0);
