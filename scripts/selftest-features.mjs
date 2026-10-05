// Prova delle nuove logiche: intolleranze, obiettivi settimanali, dispensa, storico
import fs from 'node:fs';
import { recipeAllergens } from '../src/lib/allergens.js';
import { recipeFoods, weekCounts, goalStatus } from '../src/lib/goals.js';
import { applyPantry } from '../src/lib/pantry.js';
import { buildRecency, weekIdToMonday, weeksBetween } from '../src/lib/usage.js';
import { eatersOf } from '../src/lib/scale.js';
import { resolveItem } from '../src/lib/items.js';

const dir = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')));

const count = (id) => recipes.filter((r) => recipeAllergens(r).has(id)).length;
console.log('Con glutine:', count('glutine'), '| con lattosio:', count('lattosio'), '| con uova:', count('uova'), '| con guscio:', count('guscio'), '| soia:', count('soia'), '| pesce:', count('pesce'), '| totale', recipes.length);
const gf = recipes.filter((r) => !recipeAllergens(r).has('glutine'));
console.log('\nSenza glutine (stima):', gf.length, '→ da controllare a mano:\n ', gf.map((r) => r.title).join('\n  '));
const lf = recipes.filter((r) => !recipeAllergens(r).has('lattosio') && r.diet !== 'vegan');
console.log('\nNon vegane senza lattosio (stima):', lf.map((r) => r.title).join(' | '));

// ingredienti che contengono glutine ma passano? cerca parole sospette tra i "senza glutine"
const sospette = /(pasta|pane|farina|farro|orzo|couscous|seitan|avena|gnocchi|piadina|wrap|tortilla|cracker|grissini|biscott|bulgur|semola|panko|granola)/i;
const leaks = gf.flatMap((r) => r.ingredients.filter((i) => sospette.test(i.name)).map((i) => `${r.title}: ${i.name}`));
console.log('\nIngredienti sospetti nei "senza glutine":', leaks.length ? leaks : 'nessuno');

const foods = (id) => recipes.filter((r) => recipeFoods(r).has(id)).length;
console.log('\nTipi di alimento:', ['legumi', 'pesce', 'carne-bianca', 'carne-rossa', 'salumi', 'uova', 'formaggi', 'frutta-secca', 'cereali-integrali', 'verdure-foglia'].map((f) => `${f} ${foods(f)}`).join(', '));

// obiettivi
const map = new Map(recipes.map((r) => [r.id, r]));
const legume = recipes.find((r) => recipeFoods(r).has('legumi') && r.category === 'Pranzo');
const hh = { members: [{ id: 'm', name: 'M', meals: {} }] };
const plan = { days: { 0: { Pranzo: { items: [{ instanceId: 'a', recipeId: legume.id }] } }, 2: { Pranzo: { items: [{ instanceId: 'b', recipeId: legume.id }] } } } };
const c = weekCounts(plan, hh, map);
console.log('\nLegumi in 2 pranzi →', c.m.legumi, goalStatus({ mode: 'min', times: 3 }, c.m.legumi), goalStatus({ mode: 'max', times: 1 }, c.m.legumi), goalStatus({ mode: 'exact', times: 2 }, c.m.legumi));

// dispensa
const list = [{ name: 'Ceci cotti', qty: 300, unit: 'g' }, { name: 'Olio extravergine d\'oliva', qty: 3, unit: 'cucchiai' }, { name: 'Pasta integrale', qty: 200, unit: 'g' }, { name: 'Sale', qty: 0, unit: 'q.b.' }];
const r = applyPantry(list, [{ name: 'Ceci cotti', qty: 120, unit: 'g' }, { name: 'Olio', always: true }, { name: 'Sale', always: true }, { name: 'Pasta integrale', qty: 500, unit: 'g' }]);
console.log('Dispensa → da comprare:', r.needed.map((i) => `${i.name} ${i.qty}${i.unit} (hai ${i.have})`), '| coperti:', r.covered.map((i) => i.name));

// storico
console.log('\n2026-W41 inizia il', weekIdToMonday('2026-W41').toISOString().slice(0, 10), '| W41→W44:', weeksBetween('2026-W41', '2026-W44'), 'settimane');
const rec = buildRecency([{ id: '2026-W39', days: { 0: { Pranzo: { items: [{ recipeId: 'x' }] } } } }, { id: '2026-W41', days: { 0: { Pranzo: { items: [{ recipeId: 'x' }, { recipeId: 'y', leftoverOf: 'q' }] } } } }], '2026-W43');
console.log('Recency x:', rec.get('x'), '(attesa 2) | y avanzo ignorato:', rec.has('y') ? 'NO' : 'sì');

// ---- generazione con obiettivi, intolleranze, batch, storico e preferiti
const { generateWeek } = await import('../src/lib/planGen.js');
const { mealOf } = await import('../src/lib/scale.js');
const { problemsFor } = await import('../src/lib/diet.js');
const house = {
  members: [
    { id: 'm', name: 'Martina', diet: 'vegetarian', goals: [{ id: 'g1', food: 'legumi', times: 4, mode: 'min' }, { id: 'g2', food: 'uova', times: 2, mode: 'max' }], meals: {} },
    { id: 'a', name: 'Mamma', diet: 'omnivore', meals: {} },
    { id: 's', name: 'Sorella', diet: 'omnivore', intolerances: ['glutine'], meals: {} },
  ],
  rules: [{ id: 'r', label: 'Asporto', slots: ['Pranzo'], days: [0, 1, 2, 3, 4], dietCap: 'vegetarian', takeaway: true, batch: 2 }],
};
let ko = 0;
for (let run = 0; run < 20; run++) {
  const days = generateWeek(recipes, house, { favorites: new Set([recipes[0].id]), recency: new Map() });
  for (let d = 0; d < 7; d++) for (const [slot, data] of Object.entries(days[d])) {
    for (const it of data.items) { const eaters = eatersOf(it, house, slot, data); const p = problemsFor(resolveItem(it, map), house, d, slot, eaters); if (p.length) { ko++; if (ko < 4) console.log('KO', d, slot, map.get(it.recipeId).title, p); } }
  }
  if (run === 0) {
    const lunch = [0, 1, 2, 3, 4].map((d) => days[d].Pranzo.items.map((i) => `${map.get(i.recipeId).title}${i.leftoverOf ? ' (avanzo)' : ''}`).join(' + '));
    console.log('\nPranzi lun-ven con batch 2:\n ', lunch.join('\n  '));
    const { weekCounts } = await import('../src/lib/goals.js');
    const c = weekCounts({ days }, house, map).m || {};
    console.log('Martina legumi (obiettivo almeno 4):', c.legumi || 0, '| uova (max 2):', c.uova || 0);
  }
}
console.log('Violazioni su 20 settimane:', ko);

// ---- assenti, ospiti, vista personale
const { slotPeople } = await import('../src/lib/scale.js');
const { mealConstraints } = await import('../src/lib/diet.js');
const { buildShoppingList } = await import('../src/lib/shopping.js');
const guest = { id: 'g-1', name: 'Ospite', diet: 'vegan', mult: 1.5, intolerances: [], meals: {} };
const house2 = { members: [{ id: 'm', name: 'M', diet: 'vegetarian', meals: {} }, { id: 'a', name: 'A', diet: 'omnivore', meals: {} }], rules: [] };
const dinner = { items: [], guests: [guest], absent: ['m'] };
const ppl = slotPeople(house2, 'Cena', dinner).map((p) => p.name);
console.log('\nPresenti a cena (M assente, 1 ospite vegano):', ppl.join(', '), '| dieta massima ammessa:', mealConstraints(house2, 2, 'Cena', slotPeople(house2, 'Cena', dinner)).maxLevel, '(0 = solo vegano)');
const dish = recipes.find((r) => r.category === 'Cena' && r.diet === 'vegan');
const plan2 = { days: { 2: { Cena: { items: [{ instanceId: 'i', recipeId: dish.id }], guests: [guest], absent: ['m'] } } } };
const total = buildShoppingList({ plan: plan2, days: [2], recipeMap: map, household: house2 });
const onlyA = buildShoppingList({ plan: plan2, days: [2], recipeMap: map, household: house2, onlyMemberId: 'a' });
const onlyM = buildShoppingList({ plan: plan2, days: [2], recipeMap: map, household: house2, onlyMemberId: 'm' });
const sum = (l) => Math.round(l.filter((i) => i.unit === 'g').reduce((a, i) => a + i.qty, 0));
console.log('Grammi totali spesa:', sum(total), '| solo A:', sum(onlyA), '| solo M (assente):', sum(onlyM), '| ospite x1,5 → totale ≈ A*2,5:', Math.round(sum(onlyA) * 2.5));
const gen = generateWeek(recipes, house2, { existing: { 2: { Cena: dinner } } });
const gd = gen[2].Cena;
console.log('Cena con ospite vegano e M assente:', gd.items.map((i) => `${resolveItem(i, map).title} [${resolveItem(i, map).diet}] → ${(i.eaters || ['tutti']).join('+')}`).join(' ; '), '| ospite mantenuto:', gd.guests?.length === 1, '| assente mantenuto:', gd.absent?.[0] === 'm');
