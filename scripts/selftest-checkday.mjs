// Prova della verifica di una giornata (src/lib/dayCheck.js) con un piano di esempio: vegetariano, frutta e frutta secca negli spuntini,
// pranzo con carboidrato e verdure (nessuna proteina), cena con proteina, carboidrato e verdure.
import fs from 'node:fs';
import { parseSlotPlan } from '../src/lib/dietPlan.js';
import { evaluateDay } from '../src/lib/dayCheck.js';

const rd = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(rd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, rd), 'utf8')));
const T = {
  Colazione: '200 ml latte d\'avena oppure 125 g yogurt greco oppure 50 g hummus\n\n40 g fette biscottate integrali oppure 50 g fiocchi di avena oppure 50 g muesli',
  'Spuntino 1': '250 g frutta fresca\n\n10 g frutta secca',
  Pranzo: '90 g pasta integrale oppure 90 g riso basmati oppure 90 g quinoa\n\nverdure',
  'Spuntino 2': '250 g frutta fresca\n\n20 g cioccolato fondente',
  Cena: '2 uova oppure 150 g tofu oppure 150 g hamburger di legumi\n\n60 g pane integrale oppure 40 g riso basmati\n\nverdure',
};
const meals = Object.fromEntries(Object.entries(T).map(([s, t]) => [s, { planText: t, plan: parseSlotPlan(t) }]));
const day = (lunch, dinner) => ({ diet: 'vegetarian', slots: { Colazione: ['Parfait di yogurt greco, muesli e kiwi'], 'Spuntino 1': ['food:frutta fresca', 'food:frutta secca'], Pranzo: [lunch], 'Spuntino 2': ['food:frutta fresca', 'food:cioccolato'], Cena: [dinner] } });
let ko = 0;
const check = (c, m) => { if (!c) { ko++; console.log('KO', m); } };
const missing = (r) => [...r.covered].filter(([, v]) => !v.eatenBy.length).map(([k]) => k);

// abbinamento sensato: quinoa a pranzo, tofu teriyaki con riso a cena
const good = evaluateDay({ meals, spec: day('Quinoa con zucchine, carote e prezzemolo', 'Tofu teriyaki con riso'), recipes, mode: 'day' });
check(missing(good).length === 0, 'giornata corretta: gruppi non coperti ' + missing(good));
check(good.extras.length === 0, 'giornata corretta: ingredienti fuori piano ' + good.extras);
// la frutta del parfait si divide con lo spuntino: nella giornata ci sono due metà e non si superano i 250 g
const fruit = good.covered.get('Spuntino 1|0');
check(fruit.eatenBy.length === 2 && fruit.eatenBy.every((x) => x.includes('metà')), 'la frutta non è divisa a metà fra colazione e spuntino');

// abbinamento invertito: tofu a pranzo (il piano non lo prevede) e quinoa a cena (cena senza proteina e senza carboidrato del piano)
const swapped = evaluateDay({ meals, spec: day('Tofu teriyaki con riso', 'Quinoa con zucchine, carote e prezzemolo'), recipes, mode: 'day' });
check(missing(swapped).includes('Cena|0') && missing(swapped).includes('Cena|1'), 'la cena senza proteina e carboidrato non viene segnalata');
check(swapped.extras.some((e) => /Tofu/.test(e)) && swapped.extras.some((e) => /Quinoa/.test(e)), 'gli ingredienti fuori piano non vengono segnalati');

// in modalità "esatta per pasto" la frutta nel parfait sfora (la colazione non prevede frutta)
const exact = evaluateDay({ meals, spec: day('Quinoa con zucchine, carote e prezzemolo', 'Tofu teriyaki con riso'), recipes, mode: 'meal' });
check(exact.extras.some((e) => /Kiwi/.test(e)), 'in modalità per pasto il kiwi a colazione dovrebbe risultare fuori piano');

console.log(ko ? ko + ' problemi' : 'Tutto ok.');
process.exit(ko ? 1 : 0);
