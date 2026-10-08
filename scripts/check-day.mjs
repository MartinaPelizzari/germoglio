// Verifica una giornata contro un piano alimentare scritto: gruppo per gruppo dice se è coperto, con quali dosi, cosa manca e cosa sfora.
// Uso: node scripts/check-day.mjs <piano.pdf> <giornata.json> [day|meal]
//   giornata.json: { "diet": "vegetarian", "slots": { "Colazione": ["Titolo di una ricetta", ...], "Spuntino 1": ["food:frutta fresca", ...], ... } }
//   "food:nome" = alimento semplice del piano; altrimenti il titolo (esatto) di una ricetta del ricettario.
// Il PDF resta sul tuo computer: non viene copiato né inviato da nessuna parte.
import fs from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPlanPdf } from '../src/lib/pdfPlan.js';
import { parseSlotPlan, describeOption, planMatches, planViolations } from '../src/lib/dietPlan.js';
import { newState, planFor, usesFor, registerMeal } from '../src/lib/planGen.js';
import { SLOTS, mealOfItem, scaleRecipe, eatersOf } from '../src/lib/scale.js';
import { resolveItem } from '../src/lib/items.js';
import { setSeasons } from '../src/lib/seasons.js';

const [pdfPath, dayPath, modeArg] = process.argv.slice(2);
if (!pdfPath || !dayPath) { console.log('Uso: node scripts/check-day.mjs piano.pdf giornata.json [day|meal]'); process.exit(1); }
const rd = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(rd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, rd), 'utf8')));
const byTitle = new Map(recipes.map((r) => [r.title.toLowerCase(), r]));
const map = new Map(recipes.map((r) => [r.id, r]));
setSeasons([]);
const spec = JSON.parse(fs.readFileSync(dayPath, 'utf8'));
const text = await readPlanPdf(pdfjs, new Uint8Array(fs.readFileSync(pdfPath)));
const meals = Object.fromEntries(Object.entries(text).map(([s, t]) => [s, { planText: t, plan: parseSlotPlan(t) }]));

import { evaluateDay } from '../src/lib/dayCheck.js';
const evaluate = (mode) => evaluateDay({ meals, spec, recipes, mode });

const modes = modeArg ? [modeArg] : ['day', 'meal'];
for (const mode of modes) {
  const r = evaluate(mode);
  console.log(`\n===== Modalità ${mode === 'day' ? 'GIORNALIERA' : 'ESATTA PER PASTO'} =====`);
  for (const [key, v] of r.covered) {
    const [slot] = key.split('|');
    console.log(`${key.padEnd(14)} ${v.eatenBy.length ? 'COPERTO ' : 'MANCA   '} [${v.opts}]${v.eatenBy.length ? '\n                   ' + v.eatenBy.join('\n                   ') : ''}`);
  }
  if (r.extras.length) console.log('\nSFORA / fuori piano:\n  ' + r.extras.join('\n  '));
  if (r.notes.length) console.log('\nNote:\n  ' + r.notes.join('\n  '));
}
