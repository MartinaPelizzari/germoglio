// Controlla la copertura dei valori nutrizionali sugli ingredienti delle ricette
import fs from 'node:fs';
import { setNutrition, lookup, gramsOf } from '../src/lib/nutrition.js';
const dir = new URL('../src/data/nutrition/', import.meta.url);
const list = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, dir))));
setNutrition(list);
const recipes = fs.readdirSync(new URL('../src/data/recipes/', import.meta.url)).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL('../src/data/recipes/' + f, import.meta.url))));
const miss = new Map(); let tot = 0, ok = 0;
for (const r of recipes) for (const i of r.ingredients || []) {
  if (!i.qty || i.unit === 'q.b.' || gramsOf(i) < 15) continue;
  tot++; if (lookup(i.name)) ok++; else miss.set(i.name, (miss.get(i.name) || 0) + 1);
}
console.log(`voci: ${list.length}, ingredienti coperti ${ok}/${tot} (${Math.round(100 * ok / tot)}%)`);
console.log([...miss].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([n, c]) => `${n} (${c})`).join(', '));
