// Controlla che le ricette precaricate rispettino lo schema (vedi src/data/recipes/SPEC.md)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'recipes');
const CATS = ['Colazione', 'Pranzo', 'Cena', 'Spuntino', 'Contorno'];
const TIMES = ['breve', 'media', 'lunga'];
const UNITS = ['g', 'ml', 'pz', 'cucchiai', 'cucchiaini', 'q.b.'];
const GROUPS = ['carb', 'protein', 'veg', 'fat', 'fruit', 'dairy', 'other'];
const MEAT = /\b(pollo|manzo|maiale|vitello|tacchino|prosciutto|pancetta|salsiccia|speck|bresaola|agnello|carne|guanciale|wurstel|salame|mortadella|coniglio)\b/i;
const FISH = /\b(tonno|salmone|merluzzo|gamberi|gamberetti|acciughe|alici|orata|branzino|pesce|calamari|polpo|cozze|vongole|sgombro|sardine|baccalà|trota)\b/i;
const ANIMAL = /\b(miele|latte vaccino|burro|uova?|formaggio|parmigiano|pecorino|ricotta|feta|yogurt greco|mozzarella|panna|gelatina)\b/i;
const NON_VEGAN_OK = /(vegetale|di soia|di mandorla|di mandorle|di avena|di cocco|di riso|di arachidi|di anacardi|di nocciole|di sesamo|vegan|senza)/i;

const ids = new Set();
const errors = [];
let total = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const list = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const r of list) {
    total++;
    const w = (m) => errors.push(`${f} ${r.id || r.title}: ${m}`);
    if (!r.id || ids.has(r.id)) w('id mancante o duplicato');
    ids.add(r.id);
    if (!CATS.includes(r.category)) w('categoria non valida');
    if (!TIMES.includes(r.time)) w('time non valido');
    if (!['vegan', 'vegetarian', 'pescetarian', 'omnivore'].includes(r.diet)) w('diet non valida');
    if (typeof r.takeaway !== 'boolean') w('takeaway mancante');
    if (!Array.isArray(r.steps) || r.steps.length < 2) w('passaggi mancanti');
    if (!Array.isArray(r.ingredients) || !r.ingredients.length) w('ingredienti mancanti');
    for (const i of r.ingredients || []) {
      if (!UNITS.includes(i.unit)) w(`unità non valida "${i.unit}" (${i.name})`);
      if (!GROUPS.includes(i.group)) w(`gruppo non valido "${i.group}" (${i.name})`);
      if (typeof i.qty !== 'number' || i.qty < 0) w(`qty non valida (${i.name})`);
      if (i.unit !== 'q.b.' && i.qty === 0) w(`qty 0 senza q.b. (${i.name})`);
      if (['vegan', 'vegetarian'].includes(r.diet) && (MEAT.test(i.name) || FISH.test(i.name))) w(`carne/pesce in ricetta ${r.diet}: ${i.name}`);
      if (r.diet === 'pescetarian' && MEAT.test(i.name)) w(`carne in ricetta pescetarian: ${i.name}`);
      if (r.diet === 'vegan' && ANIMAL.test(i.name) && !NON_VEGAN_OK.test(i.name)) w(`ingrediente non vegano in ricetta vegan: ${i.name}`);
    }
  }
}
console.log(`${total} ricette controllate.`);
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
console.log('Tutto ok.');
