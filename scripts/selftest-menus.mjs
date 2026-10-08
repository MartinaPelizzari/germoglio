// Prova dei menu settimanali: regole condivise, colazioni, una sola proteina per pasto, frequenze di ogni persona
import fs from 'node:fs';
import { generateWeek } from '../src/lib/planGen.js';
import { autoMeals } from '../src/lib/autoPlan.js';
import { computeNeeds } from '../src/lib/needs.js';
import { parseSlotPlan } from '../src/lib/dietPlan.js';
import { setNutrition } from '../src/lib/nutrition.js';
import { eatersOf } from '../src/lib/scale.js';
import { resolveItem } from '../src/lib/items.js';
import { recipeFoods } from '../src/lib/goals.js';
import { recipeKind } from '../src/lib/meals.js';
import { setSeasons, outOfSeason } from '../src/lib/seasons.js';

const nd = new URL('../src/data/nutrition/', import.meta.url);
setNutrition(fs.readdirSync(nd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, nd)))));
const rd = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(rd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, rd), 'utf8')));
const map = new Map(recipes.map((r) => [r.id, r]));
setSeasons(JSON.parse(fs.readFileSync(new URL('../src/data/seasons.json', import.meta.url))));

const body = { sex: 'F', age: 30, height: 165, weight: 60, work: 'sedentary', workouts: 0, goal: 'maintain' };
const auto = (id, name, diet, extra = {}) => { const n = computeNeeds({ ...body, diet }); const { meals } = autoMeals({ diet, kcal: n.kcal, protein: n.protein, intolerances: extra.intolerances || [] }); return { id, name, diet, meals, planSource: 'auto', ...extra }; };
const text = { Colazione: '125 g yogurt greco oppure 200 ml latte\n\n50 g fiocchi di avena oppure 60 g pane integrale', 'Spuntino 1': '150 g frutta fresca', Pranzo: '80 g pasta oppure 80 g riso\n\nverdure\n\n120 g legumi cotti oppure 100 g tofu oppure 2 uova', 'Spuntino 2': '150 g frutta fresca', Cena: '150 g pesce oppure 100 g carne bianca oppure 2 uova\n\n60 g pane integrale\n\nverdure' };
const martina = { id: 'm', name: 'Martina', diet: 'vegetarian', goals: [{ id: 'g1', food: 'legumi', times: 3, mode: 'min' }], meals: Object.fromEntries(Object.entries(text).map(([s, t]) => [s, { planText: t, plan: parseSlotPlan(t) }])) };
const mamma = { id: 'a', name: 'Mamma', diet: 'omnivore', meals: {} };
const sorella = auto('s', 'Sorella', 'omnivore', { intolerances: ['glutine'], goals: [{ id: 'g2', food: 'pesce', times: 2, mode: 'min' }] });
const rules = [{ id: 'r', label: "Pranzo d'asporto", slots: ['Pranzo'], days: [0, 1, 2, 3, 4], dietCap: 'vegetarian', takeaway: true }];
const house = { members: [martina, mamma, sorella], rules };

let ko = 0;
const bad = new Map();
const check = (c, m) => { if (!c) { ko++; bad.set(m, (bad.get(m) || 0) + 1); } };
const protein = (r) => (r.ingredients || []).reduce((a, i) => a + (i.group === 'protein' ? (i.unit === 'pz' ? i.qty * 55 : i.unit === 'g' || i.unit === 'ml' ? i.qty : 0) : 0), 0);
const RUNS = 30;
let goalsMet = 0, goalsTot = 0;
for (let run = 0; run < RUNS; run++) {
  const days = generateWeek(recipes, house);
  const seen = { m: { legumi: 0 }, s: { pesce: 0 } };
  for (let d = 0; d < 7; d++) {
    // pranzi feriali: un solo piatto per tutti e d'asporto
    if (d < 5) {
      // la frutta del piano non mangiata prima (modalità giornata) si aggiunge a chi ce l'ha: non conta come piatto diverso
      const items = (days[d].Pranzo?.items || []).filter((it) => !(it.food && it.food.group === 'fruit' || it.food && /frutt/i.test(it.food.name)));
      check(items.length > 0, 'pranzo feriale vuoto');
      if (items.some((it) => it.food) && process.env.DEBUG) console.log('esempio:', items.map((it) => (map.get(it.recipeId)?.title || `[${it.food.name}]`) + (it.eaters ? `<${it.eaters.join('')}>` : '')).join(' + '));
      check(items.every((it) => !it.food), 'pranzo feriale con alimenti sparsi invece di un piatto');
      check(items.every((it) => !it.eaters || it.eaters.length === 3), 'pranzo feriale non uguale per tutti');
      check(items.every((it) => !it.recipeId || map.get(it.recipeId).takeaway), 'pranzo feriale non da asporto');
    }
    // colazioni: niente piatti da spuntino salato
    for (const it of days[d].Colazione?.items || []) {
      const t = map.get(it.recipeId)?.title || '';
      check(!/bruschett|hummus|crostin|popcorn|ceci croccanti|muffin salati/i.test(t), 'colazione da spuntino salato: ' + t);
    }
    // una sola proteina per pasto principale, per persona
    for (const slot of ['Pranzo', 'Cena']) {
      const data = days[d][slot];
      for (const p of house.members) {
        const mine = (data?.items || []).filter((it) => eatersOf(it, house, slot, data).some((e) => e.id === p.id));
        const n = mine.filter((it) => { const r = resolveItem(it, map); return r && (it.food ? ['protein'].includes(it.food.group) : protein(r) >= 40); }).length;
        check(n <= 1, `${slot}: ${n} proteine per ${p.name}`);
        // un contorno non sta mai da solo: serve un piatto vero o un carboidrato/proteina
        check(!mine.length || mine.some((it) => (it.food ? it.food.group !== 'veg' : recipeKind(resolveItem(it, map)) !== 'contorno')), `${slot}: solo contorni per ${p.name}`);
        // niente zuppe o vellutate d'asporto
        check(mine.every((it) => !it.recipeId || !(!map.get(it.recipeId).takeaway === false && /vellutat|zupp|minestr/i.test(map.get(it.recipeId).title)) || !rules[0].days.includes(d) || slot !== 'Pranzo'), 'zuppa a pranzo d\'asporto');
      }
    }
    for (const slot of ['Pranzo', 'Cena']) for (const it of days[d][slot]?.items || []) {
      const r = map.get(it.recipeId); if (!r) continue; const f = recipeFoods(r);
      for (const [pid, food, key] of [['m', 'legumi', 'm'], ['s', 'pesce', 's']]) if (f.has(food) && eatersOf(it, house, slot, days[d][slot]).some((e) => e.id === pid)) seen[key][food]++;
    }
  }
  goalsTot += 2; goalsMet += (seen.m.legumi >= 3) + (seen.s.pesce >= 2);
}
// piano con l'hummus a colazione tra le alternative (come in un piano reale): colazione quasi sempre yogurt, latte o cereali, hummus ogni tanto
const hum = { Colazione: '200 ml latte oppure 125 g yogurt greco oppure 50 g hummus\n\n50 g fiocchi di avena oppure 60 g pane integrale oppure 40 g fette biscottate' };
const hp = { id: 'h', name: 'Prova', diet: 'vegetarian', meals: Object.fromEntries(Object.entries(hum).map(([k, t]) => [k, { planText: t, plan: parseSlotPlan(t) }])) };
let hummusDays = 0, odd = 0, total = 0;
for (let run = 0; run < 30; run++) {
  const ds = generateWeek(recipes, { members: [hp], rules: [] });
  for (let d = 0; d < 7; d++) {
    total++;
    const items = ds[d].Colazione?.items || [];
    const names = items.map((it) => map.get(it.recipeId)?.title || it.food?.name || '').join(' ');
    if (/hummus/i.test(names)) hummusDays++;
    if (/bruschett|crostin|popcorn|ceci croccanti/i.test(names)) odd++;
  }
}
// regola personale: sempre la stessa colazione per tutta la settimana (solo per chi la ha)
const pr = { id: 'p', name: 'Con regola', diet: 'vegetarian', meals: {}, rules: [{ id: 'r1', label: 'Stessa colazione', slots: ['Colazione'], days: [0, 1, 2, 3, 4, 5, 6], takeaway: false, batch: 7 }] };
const other = { id: 'q', name: 'Senza regola', diet: 'vegetarian', meals: {} };
let sameWeeks = 0, varied = 0;
for (let run = 0; run < 10; run++) {
  const ds = generateWeek(recipes, { members: [pr, other], rules: [] });
  const mine = (d) => (ds[d].Colazione?.items || []).filter((it) => !it.eaters || it.eaters.includes('p')).map((it) => it.recipeId || it.food?.name).join(',');
  const theirs = (d) => (ds[d].Colazione?.items || []).filter((it) => !it.eaters || it.eaters.includes('q')).map((it) => it.recipeId || it.food?.name).join(',');
  if ([1, 2, 3, 4, 5, 6].every((d) => mine(d) === mine(0))) sameWeeks++;
  if (new Set([0, 1, 2, 3, 4, 5, 6].map(theirs)).size > 3) varied++;
}
// pranzo con gli avanzi della cena di ieri
const lh = { members: [{ id: 'a', name: 'A', diet: 'vegetarian', meals: {} }, { id: 'b', name: 'B', diet: 'omnivore', meals: {} }], rules: [{ id: 'l', label: 'Avanzi', slots: ['Pranzo'], days: [1, 2, 3, 4], takeaway: true, leftoverDinner: true, batch: 1 }] };
let leftOk = 0, leftTot = 0;
for (let run = 0; run < 6; run++) {
  const ds = generateWeek(recipes, lh, { month: 10 });
  for (let d = 1; d <= 4; d++) {
    leftTot++;
    const lunch = ds[d].Pranzo?.items || [];
    const dinner = (ds[d - 1].Cena?.items || []).map((it) => it.recipeId).sort().join();
    if (lunch.length && lunch.every((it) => it.leftoverOf) && lunch.map((it) => it.recipeId).sort().join() === dinner && lunch.every((it) => map.get(it.recipeId).takeaway)) leftOk++;
  }
}
console.log(`Pranzo con gli avanzi della cena (d'asporto): ${leftOk}/${leftTot}`);
check(leftOk >= leftTot * 0.9, 'avanzi della cena non rispettati (' + leftOk + '/' + leftTot + ')');

// stagionalità: a luglio poche ricette con ortaggi o frutta di inverno
let off = 0, offTot = 0;
for (let run = 0; run < 6; run++) {
  const ds = generateWeek(recipes, { members: [{ id: 'v', name: 'V', diet: 'vegetarian', meals: {} }, { id: 'o', name: 'O', diet: 'omnivore', meals: {} }], rules: [] }, { month: 7 });
  for (let d = 0; d < 7; d++) for (const sl of ['Pranzo', 'Cena']) for (const it of ds[d][sl]?.items || []) { offTot++; if (outOfSeason(map.get(it.recipeId), 7).length) off++; }
}
const base = recipes.filter((r) => outOfSeason(r, 7).length).length / recipes.length;
console.log(`Piatti fuori stagione a luglio: ${off}/${offTot} contro ${(base * 100).toFixed(0)}% nel ricettario`);
check(off / offTot < base * 0.6, 'la stagionalità non riduce i piatti fuori stagione');

console.log(`Regola personale: stessa colazione tutta la settimana ${sameWeeks}/10; l'altra persona varia ${varied}/10`);
check(sameWeeks === 10, 'regola personale "stessa colazione" non rispettata');
check(varied >= 8, 'la regola personale ha cambiato anche l\'altra persona');
console.log(`Colazioni con hummus: ${hummusDays}/${total}; strane: ${odd}`);
check(hummusDays > 0 && hummusDays < total * 0.5, 'hummus a colazione: troppo o per niente');
check(odd <= total * 0.05, 'colazioni strane (bruschette, crostini...) oltre il 5%');
console.log(`Frequenze rispettate: ${goalsMet}/${goalsTot}`);
check(goalsMet >= goalsTot * 0.95, 'frequenze settimanali rispettate meno del 95%');
for (const [m, n] of bad) console.log('KO', n, 'x', m);
console.log(ko ? `${bad.size} tipi di problema` : 'Tutto ok.');
process.exit(ko ? 1 : 0);
