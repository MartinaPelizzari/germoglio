// Prova della regolazione sulla giornata con un piano di esempio (non è il piano di nessuno)
import fs from 'node:fs';
import { generateWeek, categoryOf, canBorrow, usesFor } from '../src/lib/planGen.js';
import { parseSlotPlan } from '../src/lib/dietPlan.js';
import { consumedKeys, dayInstances, movable, parseKey } from '../src/lib/day.js';
import { eatersOf, mealOfItem, scaleRecipe } from '../src/lib/scale.js';
import { resolveItem } from '../src/lib/items.js';

const dir = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')));
const map = new Map(recipes.map((r) => [r.id, r]));
let ko = 0;
const check = (c, m) => { if (!c) { ko++; if (ko < 8) console.log('KO', m); } };

const text = {
  Colazione: '125 g yogurt greco oppure 200 ml latte\n\n50 g fiocchi di avena oppure 60 g pane integrale',
  'Spuntino 1': '250 g frutta fresca\n\n10 g frutta secca',
  Pranzo: '90 g pasta oppure 90 g riso\n\nverdure',
  'Spuntino 2': '250 g frutta fresca\n\n20 g cioccolato fondente',
  Cena: '150 g tofu oppure 2 uova\n\n60 g pane integrale oppure 200 g patate\n\nverdure',
};
const meals = Object.fromEntries(Object.entries(text).map(([s, t]) => [s, { planText: t, plan: parseSlotPlan(t) }]));
const me = { id: 'm', name: 'Prova', diet: 'vegetarian', balance: 'day', meals };
const house = { members: [me], rules: [] };

let borrowed = 0, weeks = 0;
for (let run = 0; run < 25; run++) {
  weeks++;
  const days = generateWeek(recipes, house);
  for (let d = 0; d < 7; d++) {
    const claims = new Map();
    for (const [slot, data] of Object.entries(days[d])) {
      for (const it of data.items) {
        for (const k of it.uses?.m || []) {
          claims.set(k, (claims.get(k) || 0) + 1);
          const { slot: from, gi } = parseKey(k);
          if (from !== slot) {
            borrowed++;
            const g = me.meals[from].plan[gi];
            check(canBorrow(categoryOf(g), slot), `prestito non ammesso: ${k} → ${slot} (${categoryOf(g)})`);
          }
        }
        // le dosi del piatto si calcolano sui gruppi che consuma
        const r = resolveItem(it, map);
        if (it.uses?.m) check(scaleRecipe(r, mealOfItem(me, slot, it)).length > 0, 'dosi');
      }
    }
    check([...claims.values()].every((n) => n === 1), `giorno ${d}: un gruppo consumato due volte`);
    const consumed = consumedKeys(me, days[d], (it) => resolveItem(it, map), (it, sl, dt) => eatersOf(it, house, sl, dt));
    const missing = dayInstances(me).filter((i) => movable(i.group) && !consumed.has(i.key));
    check(missing.length === 0, `giorno ${d}: gruppi non mangiati ${missing.map((m) => m.key).join(', ')}`);
  }
}
console.log(`${weeks} settimane generate, ${borrowed} gruppi mangiati in un pasto diverso dal proprio.`);
check(borrowed > 0, 'nessun "mischiotto" nelle settimane generate');
console.log(ko ? `\n${ko} problemi` : '\nTutto ok.');
process.exit(ko ? 1 : 0);
