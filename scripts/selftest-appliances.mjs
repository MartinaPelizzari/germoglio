// Elettrodomestici: senza forno o frullatore nessuna ricetta che li richiede entra nel menu, e le ricette con un'alternativa ("o in padella") restano.
import fs from 'node:fs';
import { appliancesNeeded, applianceStats, missingAppliances } from '../src/lib/appliances.js';
import { generateWeekChecked } from '../src/lib/planGen.js';
import { auditWeek } from '../src/lib/audit.js';
import { fits, mealConstraints, problemsFor } from '../src/lib/diet.js';
import { setNutrition } from '../src/lib/nutrition.js';
import { setSeasons } from '../src/lib/seasons.js';

const nd = new URL('../src/data/nutrition/', import.meta.url);
setNutrition(fs.readdirSync(nd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, nd)))));
setSeasons(JSON.parse(fs.readFileSync(new URL('../src/data/seasons.json', import.meta.url))));
const rd = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(rd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, rd), 'utf8')));
const map = new Map(recipes.map((r) => [r.id, r]));
let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.log('ERRORE:', msg); } };

// riconoscimento: richiesto solo se non c'è un'alternativa
const R = (title, ...steps) => ({ title, steps });
check(appliancesNeeded(R('Torta', 'Preriscalda il forno a 180 gradi.', 'Cuoci per 30 minuti.')).includes('forno'), 'il forno nel passaggio va riconosciuto');
check(!appliancesNeeded(R('Toast', 'Tosta il pane in tostapane o in padella.')).includes('tostapane'), 'tostapane con alternativa non è richiesto');
check(!appliancesNeeded(R('Mela', 'Scalda la mela al forno a microonde per 3 minuti.')).includes('forno'), '"forno a microonde" non è il forno');
check(!appliancesNeeded(R('Uova', 'Frulla o sbatti l\'uovo con il latte.')).includes('frullatore'), '"frulla o sbatti" non richiede il frullatore');
check(appliancesNeeded(R('Crema', 'Frulla i ceci con tahina e limone.')).includes('frullatore'), 'frullare richiede il frullatore');
check(appliancesNeeded({ ...R('X', 'Cuoci in forno.'), appliances: [] }).length === 0, 'il campo appliances scritto a mano ha la precedenza');
check(missingAppliances(R('Torta', 'Cuoci in forno.'), undefined).length === 0, 'senza indicazione tutto è disponibile');
check(missingAppliances(R('Torta', 'Cuoci in forno.'), ['frullatore']).join() === 'forno', 'forno mancante');

const stats = applianceStats(recipes);
console.log('Ricette che richiedono: ', JSON.stringify(stats));
check(stats.forno > 50 && stats.frullatore > 20, 'il riconoscimento sul ricettario sembra troppo scarso');

// menu senza forno e senza frullatore
const body = (id, name, diet) => ({ id, name, diet, meals: {} });
const house = { members: [body('a', 'A', 'omnivore'), body('b', 'B', 'vegetarian')], rules: [], appliances: [] };
const weeks = 6;
let bad = 0, defects = 0, heavy = 0;
for (let w = 0; w < weeks; w++) {
  const g = generateWeekChecked(recipes, house, { month: 10 }, { tries: 4 });
  for (const d of Object.values(g.days)) for (const sl of Object.values(d)) for (const it of sl.items || []) { const r = it.recipeId && map.get(it.recipeId); if (r && missingAppliances(r, []).length) bad++; }
  heavy += g.issues.filter((i) => ['vuoto', 'dieta', 'colazione', 'doppio', 'contorno', 'regola'].includes(i.kind)).length;
  defects += auditWeek(g.days, house, map, { month: 10 }).filter((i) => i.kind === 'elettrodomestico').length;
}
check(bad === 0, `${bad} piatti che richiedono forno o frullatore nei menu di una casa che non li ha`);
check(heavy === 0, `${heavy} difetti gravi (menu vuoti o fuori dieta) in una casa senza forno né frullatore`);
check(defects === 0, 'l\'audit segnala elettrodomestici mancanti nei menu generati');
// l'audit riconosce un piatto sbagliato messo a mano
const oven = recipes.find((r) => appliancesNeeded(r).includes('forno'));
const manual = { 0: { Pranzo: { items: [{ instanceId: 'x', recipeId: oven.id }] } } };
check(auditWeek(manual, house, map, { month: 10 }).some((i) => i.kind === 'elettrodomestico'), 'l\'audit non vede un piatto al forno in una casa senza forno');
// il selettore e l'avviso nel Planner lo segnalano
const c = mealConstraints(house, 0, 'Pranzo', house.members);
check(!fits(oven, c), 'fits deve escludere il piatto al forno');
check(problemsFor(oven, house, 0, 'Pranzo', house.members, { instanceId: 'x', recipeId: oven.id }).some((m) => /forno/.test(m)), 'avviso "richiede il forno" mancante');
// casa con tutto: nessuna esclusione
const full = { ...house, appliances: undefined };
check(fits(oven, mealConstraints(full, 0, 'Pranzo', full.members)), 'senza indicazione il piatto al forno va bene');
console.log(fails ? `${fails} errori` : 'Tutto ok.');
process.exit(fails ? 1 : 0);
