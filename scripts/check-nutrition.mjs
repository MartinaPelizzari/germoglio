// Copertura dei valori nutrizionali sugli ingredienti delle ricette e precisione dell'abbinamento dei nomi
import fs from 'node:fs';
import { setNutrition, lookup } from '../src/lib/nutrition.js';
const dir = new URL('../src/data/nutrition/', import.meta.url);
const list = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, dir))));
setNutrition(list);
const recipes = fs.readdirSync(new URL('../src/data/recipes/', import.meta.url)).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL('../src/data/recipes/' + f, import.meta.url))));
const miss = new Map(); let tot = 0, ok = 0;
for (const r of recipes) for (const i of r.ingredients || []) {
  if (!i.qty || i.unit === 'q.b.') continue;
  tot++; if (lookup(i.name)) ok++; else miss.set(i.name, (miss.get(i.name) || 0) + 1);
}
console.log(`voci: ${list.length}, ingredienti coperti ${ok}/${tot} (${Math.round(1000 * ok / tot) / 10}%)`);
if (miss.size) console.log('mancano:', [...miss].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} (${c})`).join(', '));
// Abbinamenti che NON devono succedere (parola in comune ma cibo diverso)
const NO = [['peperone rosso', /vino/], ['branzino intero', /latte/], ['salmone fresco', /zenzero/], ['polpo cotto', /prosciutto/], ['mirtilli secchi', /^mirtilli$/i], ['rape', /cocco/], ['mozzarella light', /maionese/], ['semi misti', /peperoni/], ['piadina integrale', /riso/]];
let bad = 0;
for (const [n, re] of NO) { const v = lookup(n); if (v && re.test(v.name)) { bad++; console.log(`KO: "${n}" → "${v.name}"`); } }
console.log(bad ? `${bad} abbinamenti sbagliati` : 'Abbinamenti ok.');
process.exit(bad ? 1 : 0);
