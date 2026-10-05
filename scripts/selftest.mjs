// Prova rapida della logica (dosi, diete, regole, pasti equilibrati, spesa) senza interfaccia
import fs from 'node:fs';
import { generateWeek, missingGroups } from '../src/lib/planGen.js';
import { buildShoppingList } from '../src/lib/shopping.js';
import { scaleRecipe, mealOf, formatQty } from '../src/lib/scale.js';
import { recipeLevel, problemsFor, mealConstraints, memberLevel } from '../src/lib/diet.js';

const dir = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')));
const map = new Map(recipes.map((r) => [r.id, r]));
const household = {
  members: [
    { id: 'm', name: 'Martina', diet: 'vegetarian', meals: { Pranzo: { targets: { carb: 80, protein: 120, veg: 200 } } } },
    { id: 'a', name: 'Mamma', diet: 'omnivore', meals: { 'Spuntino 1': { eats: false }, 'Spuntino 2': { eats: false } } },
    { id: 's', name: 'Sorella', diet: 'omnivore', meals: { Colazione: { eats: false }, 'Spuntino 1': { eats: false }, 'Spuntino 2': { eats: false }, Pranzo: { mult: 1.25 } } },
  ],
  rules: [{ id: 'r', label: 'Asporto', slots: ['Pranzo'], days: [0, 1, 2, 3, 4], dietCap: 'vegetarian', takeaway: true }],
};

let bad = 0;
const fail = (m) => { bad++; console.log('KO', m); };

const days = generateWeek(recipes, household);
for (let d = 0; d < 7; d++) {
  for (const [slot, data] of Object.entries(days[d])) {
    const rs = data.items.map((i) => map.get(i.recipeId));
    const eaters = household.members.filter((m) => mealOf(m, slot).eats);
    const c = mealConstraints(household, d, slot, eaters);
    rs.forEach((r) => {
      if (!r) return fail(`ricetta mancante ${d} ${slot}`);
      const p = problemsFor(r, household, d, slot, eaters);
      if (p.length) fail(`${d} ${slot} ${r.id}: ${p.join('; ')}`);
    });
    if (c.required.length && missingGroups(c.required, rs).length) console.log(`  nota: giorno ${d} ${slot} manca ${missingGroups(c.required, rs)} (${rs.map((r) => r.title).join(' + ')})`);
  }
}
console.log('Lunedì:', Object.entries(days[0]).map(([s, d]) => `${s}: ${d.items.map((i) => map.get(i.recipeId).title).join(' + ')}`).join('\n         '));
console.log('Sabato pranzo:', days[5].Pranzo?.items.map((i) => map.get(i.recipeId).title + ` [${map.get(i.recipeId).diet}]`).join(' + '));

// dosi su misura
const r = map.get('pranzo-pasta-ceci-rosmarino') || recipes.find((x) => x.category === 'Pranzo' && x.diet === 'vegan');
console.log('\nDosi', r.title, '-> base:', r.ingredients.filter((i) => i.qty).map((i) => `${i.name} ${formatQty(i.qty, i.unit)}`).join(', '));
console.log('Martina (80 carb/120 prot/200 veg):', scaleRecipe(r, mealOf(household.members[0], 'Pranzo')).filter((i) => i.qty).map((i) => `${i.name} ${formatQty(i.qty, i.unit)}`).join(', '));
console.log('Sorella x1,25:', scaleRecipe(r, mealOf(household.members[2], 'Pranzo')).filter((i) => i.qty).map((i) => `${i.name} ${formatQty(i.qty, i.unit)}`).join(', '));

const list = buildShoppingList({ plan: { days }, days: [0, 1, 2, 3, 4, 5, 6], recipeMap: map, household });
console.log('\nSpesa:', list.length, 'voci; prime:', list.slice(0, 5).map((i) => `${i.name} ${formatQty(i.qty, i.unit)}`).join(' | '));
const levels = new Set(recipes.map((x) => x.diet));
console.log('Diete presenti:', [...levels].join(', '), '| ricette:', recipes.length, '| asporto:', recipes.filter((x) => x.takeaway).length);
process.exit(bad ? 1 : 0);
