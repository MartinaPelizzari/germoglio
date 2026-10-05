// Prova del piano della nutrizionista, dei menu separati per dieta e della dieta/dosi
import fs from 'node:fs';
import { parseSlotPlan, splitFullPlan, describeOption, coveredGroupIndexes } from '../src/lib/dietPlan.js';
import { generateWeek, uncoveredPairs } from '../src/lib/planGen.js';
import { mealOf, scaleRecipe, eatersOf, slotPeople } from '../src/lib/scale.js';
import { resolveItem } from '../src/lib/items.js';
import { buildShoppingList } from '../src/lib/shopping.js';
import { menuClusters, problemsFor } from '../src/lib/diet.js';

const dir = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')));
const map = new Map(recipes.map((r) => [r.id, r]));
let ko = 0;
const check = (cond, msg) => { if (!cond) { ko++; console.log('KO', msg); } };

// --- lettura del testo
const g1 = parseSlotPlan('150 g yogurt oppure 30 g pane\n\n1 frutto');
console.log('Colazione →', g1.map((g) => g.options.map(describeOption).join(' | ')).join('  +  '));
check(g1.length === 2 && g1[0].options.length === 2 && g1[0].options[0].qty === 150 && g1[0].options[1].qty === 30, 'colazione base');
const g2 = parseSlotPlan('80 gr di pasta\n+\n200 g verdure\n\nLegumi 150 g o 100 g tofu');
console.log('Pranzo →', g2.map((g) => g.options.map(describeOption).join(' | ')).join('  +  '));
check(g2.length === 3, 'gruppi pranzo (' + g2.length + ')');
const g3 = parseSlotPlan('2 fette di pane (60 g)\n1 vasetto di yogurt\n200 ml latte');
console.log('Varie →', g3[0].options.map((o) => `${o.name}=${o.qty}${o.unit}`).join(' | '));
check(g3[0].options[0].qty === 60 && g3[0].options[1].qty === 125 && g3[0].options[2].qty === 200, 'unità');
const full = splitFullPlan('COLAZIONE\n150 g yogurt oppure 30 g pane\n\nSpuntino\n1 frutto\n\nPranzo: 80 g pasta + 200 g verdure\n\nMerenda\n20 g noci\n\nCena\n150 g legumi');
console.log('Piano completo → pasti riconosciuti:', Object.keys(full).join(', '));
check(['Colazione', 'Spuntino 1', 'Pranzo', 'Spuntino 2', 'Cena'].every((k) => full[k]), 'titoli pasti');

// --- dosi: la ricetta prende le quantità del piano
const toast = recipes.find((r) => /Toast integrale/.test(r.title));
const plan = parseSlotPlan('30 g pane oppure 150 g yogurt');
const m = { eats: true, mult: 1, plan, planText: '', note: '' };
const scaled = scaleRecipe(toast, m);
const pane = scaled.find((i) => /pane/i.test(i.name));
console.log('Toast con pane 30 g di piano →', pane.name, pane.qty, 'g (ricetta:', toast.ingredients.find((i) => /pane/i.test(i.name)).qty, 'g)');
check(Math.round(pane.qty) === 30, 'dose pane');

// --- menu separati: 1 vegetariana + 2 onnivore a cena
const house = {
  members: [
    { id: 'm', name: 'Martina', diet: 'vegetarian', meals: { Colazione: { plan: g1 } } },
    { id: 'a', name: 'Mamma', diet: 'omnivore', meals: { Colazione: { plan: parseSlotPlan('150 g yogurt oppure 30 g pane') } } },
    { id: 's', name: 'Sorella', diet: 'omnivore', meals: {} },
  ],
  rules: [],
};
const people = house.members;
const cl = menuClusters(house, 2, 'Cena', people);
console.log('\nMenu a cena:', cl.map((c) => `${c.eaters.map((e) => e.name).join(' + ')} (livello ${c.level})`).join('  |  '));
check(cl.length === 2, 'due menu');
let nonVegDinners = 0, vegDinners = 0, sepOk = 0;
for (let run = 0; run < 20; run++) {
  const days = generateWeek(recipes, house, {});
  for (let d = 0; d < 7; d++) {
    const dinner = days[d].Cena;
    if (!dinner) continue;
    const bySet = {};
    for (const it of dinner.items) (bySet[(it.eaters || []).join(',')] ||= []).push(it);
    if (Object.keys(bySet).length === 2) sepOk++;
    for (const it of dinner.items) {
      const r = resolveItem(it, map);
      const eaters = eatersOf(it, house, 'Cena', dinner);
      const p = problemsFor(r, house, d, 'Cena', eaters);
      check(!p.length, `${d} Cena ${r.title}: ${p.join('; ')}`);
      if (it.eaters?.includes('m') && !it.eaters.includes('a')) vegDinners++;
      if (it.eaters?.includes('a') && ['omnivore', 'pescetarian'].includes(r.diet)) nonVegDinners++;
    }
  }
}
console.log('Su 20 settimane: cene con due menu separati =', sepOk, '/ 140 | piatti con carne o pesce per le onnivore =', nonVegDinners, '| piatti per la vegetariana =', vegDinners);
check(sepOk === 140, 'tutte le cene con due menu');

// --- colazione: il piano di Martina è coperto (ricette o alimenti semplici)
const days = generateWeek(recipes, house, {});
const bf = days[0].Colazione;
const shown = bf.items.map((it) => `${resolveItem(it, map).title}${it.food ? ' [alimento]' : ''} → ${(it.eaters || ['tutti']).join('+')}`);
console.log('\nColazione lunedì:', shown.join(' ; '));
const martinaItems = bf.items.filter((it) => !it.eaters || it.eaters.includes('m')).map((it) => resolveItem(it, map));
check(uncoveredPairs(martinaItems, [house.members[0]], 'Colazione').length === 0, 'piano colazione coperto per Martina');

// --- spesa con alimenti semplici
const list = buildShoppingList({ plan: { days: { 0: { Colazione: bf } } }, days: [0], recipeMap: map, household: house });
console.log('Spesa colazione lunedì:', list.map((i) => `${i.name} ${Math.round(i.qty)}${i.unit}`).join(' | '));
console.log(ko ? `\n${ko} problemi` : '\nTutto ok.');
process.exit(ko ? 1 : 0);
