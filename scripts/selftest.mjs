// Prova di base: dosi per porzione, piano scritto e lista della spesa
import fs from 'node:fs';
import { generateWeek } from '../src/lib/planGen.js';
import { buildShoppingList } from '../src/lib/shopping.js';
import { scaleRecipe, mealOf, formatQty } from '../src/lib/scale.js';
import { parseSlotPlan } from '../src/lib/dietPlan.js';

const dir = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')));
const map = new Map(recipes.map((r) => [r.id, r]));
let ko = 0;
const check = (c, m) => { if (!c) { ko++; console.log('KO', m); } };

const r = recipes.find((x) => x.id === 'pranzo-pasta-ceci-rosmarino') || recipes.find((x) => x.diet === 'vegan' && x.category === 'Pranzo');
const show = (list) => list.filter((i) => i.qty).map((i) => `${i.name} ${formatQty(i.qty, i.unit)}`).join(', ');
const house = {
  members: [
    { id: 'm', name: 'Martina', diet: 'vegetarian', meals: { Pranzo: { plan: parseSlotPlan('80 g pasta\n\n120 g ceci') } } },
    { id: 'a', name: 'Mamma', diet: 'omnivore', meals: { 'Spuntino 1': { eats: false }, 'Spuntino 2': { eats: false } } },
    { id: 's', name: 'Sorella', diet: 'omnivore', meals: { Pranzo: { mult: 1.25 } } },
  ],
  rules: [{ id: 'r', label: 'Asporto', slots: ['Pranzo'], days: [0, 1, 2, 3, 4], dietCap: 'vegetarian', takeaway: true }],
};
console.log('Base:', show(r.ingredients));
console.log('Martina (piano 80 g pasta + 120 g ceci):', show(scaleRecipe(r, mealOf(house.members[0], 'Pranzo'))));
console.log('Sorella x1,25:', show(scaleRecipe(r, mealOf(house.members[2], 'Pranzo'))));
const sor = scaleRecipe(r, mealOf(house.members[2], 'Pranzo')).find((i) => i.qty && i.unit === 'g');
check(Math.abs(sor.qty - r.ingredients.find((i) => i.name === sor.name).qty * 1.25) < 0.01, 'moltiplicatore');

const days = generateWeek(recipes, house);
const list = buildShoppingList({ plan: { days }, days: [0, 1, 2, 3, 4, 5, 6], recipeMap: map, household: house });
console.log('Lunedì:', Object.entries(days[0]).map(([s, d]) => `${s}: ${d.items.length} piatti`).join(' | '));
console.log('Spesa:', list.length, 'voci');
check(list.length > 20, 'spesa vuota');
console.log('Ricette:', recipes.length, '| asporto:', recipes.filter((x) => x.takeaway).length);
process.exit(ko ? 1 : 0);
