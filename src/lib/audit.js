// Controllo di qualità di una settimana generata: verifica, per ogni persona e pasto, che il menu abbia senso.
// Serve a due cose: scegliere il migliore fra più tentativi di generazione (generateWeekChecked) e far fallire le prove
// automatiche se il generatore introduce di nuovo un difetto. Ogni problema ha un peso: i difetti gravi (dieta,
// allergie, pasti vuoti) pesano più di quelli di coerenza.
import { SLOTS, eatersOf, mealOf, mealOfItem, scaleRecipe } from './scale.js';
import { breakfastClass, recipeKind, slotKind } from './meals.js';
import { isDayBalanced, parseKey } from './day.js';
import { problemsFor, rulesFor } from './diet.js';
import { resolveItem } from './items.js';
import { recipeFoods } from './goals.js';
import { planMatches } from './dietPlan.js';
import { outOfSeason } from './seasons.js';
import { MIN_COLOR_GRAMS, colorMass, consistencyOf } from './variety.js';

const approx = (ing) => (['g', 'ml'].includes(ing.unit) ? ing.qty : ing.unit === 'pz' ? ing.qty * (ing.group === 'fruit' ? 120 : ing.group === 'protein' ? 55 : 50) : ing.unit === 'cucchiai' ? ing.qty * 10 : ing.unit === 'cucchiaini' ? ing.qty * 4 : 0);
const massOf = (recipe, group) => (recipe.ingredients || []).reduce((a, i) => a + (i.group === group ? approx(i) : 0), 0);

// Soglie sotto cui un ingrediente è solo un contorno
const SUBSTANTIAL = { protein: 40, carb: 70 };

const WEIGHT = { liquidi: 20, beige: 5, stagione: 8, sforo: 20, somiglianza: 6, dieta: 100, vuoto: 100, colazione: 30, spostato: 30, doppio: 20, contorno: 20, regola: 25, frequenza: 8, gruppo: 15, doppioGruppo: 25 };

export const auditWeek = (days, household, recipeMap, { month } = {}) => {
  const issues = [];
  const add = (kind, day, slot, msg) => issues.push({ kind, day, slot, msg, weight: WEIGHT[kind] || 10 });
  const people = household.members;
  const counts = {}; // persona -> alimento -> set di "giorno|pasto"

  for (let d = 0; d < 7; d++) {
    const day = days[d] || {};
    for (const slot of SLOTS) {
      const data = day[slot];
      const main = slotKind(slot) === 'principale';
      const items = data?.items || [];
      const eating = people.filter((p) => mealOf(p, slot).eats && !(data?.absent || []).includes(p.id));
      if (!items.length && eating.length && !data?.covered) add('vuoto', d, slot, 'pasto senza piatti');
      const rules = rulesFor(household, d, slot, eating);

      for (const it of items) {
        const recipe = resolveItem(it, recipeMap);
        if (!recipe) continue;
        const eaters = eatersOf(it, household, slot, data);
        // dieta, allergie, ingredienti da evitare, asporto
        const hard = problemsFor(recipe, household, d, slot, eaters, it).filter((p) => !/fuori dal piano/.test(p));
        if (hard.length) add('dieta', d, slot, `${recipe.title}: ${hard.join('; ')}`);
        if (!recipe.isFood) {
          if (slot === 'Colazione') {
            const cls = breakfastClass(recipe);
            const planWants = eaters.some((e) => mealOf(e, slot).plan.some((g) => planMatches(recipe, [g])[0]));
            if (cls === 'no' || (cls === 'salata' && !planWants)) add('colazione', d, slot, `${recipe.title} non è una colazione`);
          }
          if (month && outOfSeason(recipe, month).length) add('stagione', d, slot, `${recipe.title}: ${outOfSeason(recipe, month).join(', ')} fuori stagione`);
          if (rules.some((r) => r.takeaway) && /vellutat|zupp|minestr/i.test(recipe.title)) add('regola', d, slot, `${recipe.title} (liquido) in un pasto d'asporto`);
        }
        const foods = recipeFoods(recipe);
        for (const e of eaters) for (const f of foods) ((counts[e.id] ||= {})[f] ||= new Set()).add(`${d}|${slot}`);
      }

      // un pasto d'asporto o condiviso con regola: un solo piatto per tutti
      if (main && rules.some((r) => r.dietCap) && eating.length > 1) {
        const recs = items.filter((it) => !it.food && !(it.eaters && it.eaters.length < eating.length));
        const partial = items.filter((it) => !it.food && it.eaters && it.eaters.length < eating.length && it.eaters.length > 0);
        if (items.length && partial.length && !recs.length) add('regola', d, slot, 'regola condivisa ma piatti diversi per ognuno');
      }
      for (const it of items) if (!it.food) { const r = resolveItem(it, recipeMap); if (main && rules.some((x) => x.takeaway) && r && !r.takeaway) add('regola', d, slot, `${r.title} non è d'asporto`); }

      // una sola fonte di proteine e di carboidrati per persona nei pasti principali; un contorno non sta mai da solo
      if (main) {
        for (const p of eating) {
          const mine = items.filter((it) => eatersOf(it, household, slot, data).some((e) => e.id === p.id));
          for (const [cat, label] of [['protein', 'proteine'], ['carb', 'carboidrati']]) {
            const n = mine.filter((it) => {
              const r = resolveItem(it, recipeMap);
              if (!r) return false;
              if (it.food) return it.food.group === cat;
              return massOf(r, cat) >= SUBSTANTIAL[cat];
            }).length;
            if (n > 1) add('doppio', d, slot, `${n} fonti di ${label} per ${p.name}`);
          }
          if (mine.length && mine.every((it) => !it.food && recipeKind(resolveItem(it, recipeMap)) === 'contorno')) add('contorno', d, slot, `solo contorni per ${p.name}`);
          // varietà: non tutto liquido, non tutto beige
          const rs = mine.map((it) => resolveItem(it, recipeMap)).filter((r) => r && !r.isFood);
          if (rs.filter((r) => consistencyOf(r) === 'liquido').length > 1) add('liquidi', d, slot, `due piatti liquidi nello stesso pasto per ${p.name}`);
          if (rs.length && rs.reduce((a, r) => a + colorMass(r), 0) < MIN_COLOR_GRAMS) add('beige', d, slot, `pasto senza colore per ${p.name}`);
        }
      }
    }

    // pasti principali con menu diversi per gruppi di persone: devono assomigliarsi
    for (const slot of ['Pranzo', 'Cena']) {
      const data = day[slot];
      const clusters = new Map();
      for (const it of data?.items || []) {
        const r = resolveItem(it, recipeMap);
        if (!r) continue;
        const key = (it.eaters || []).slice().sort().join(',');
        if (!clusters.has(key)) clusters.set(key, []);
        clusters.get(key).push(r);
      }
      const sets = [...clusters.values()].map((rs) => new Set(rs.flatMap((r) => (r.ingredients || []).filter((i) => i.unit !== 'q.b.' && ['carb', 'protein', 'veg', 'dairy', 'fruit'].includes(i.group)).map((i) => i.name.toLowerCase().split(' ')[0]))));
      for (let a = 0; a < sets.length; a++) for (let b = a + 1; b < sets.length; b++) {
        const inter = [...sets[a]].filter((w) => sets[b].has(w)).length;
        if (sets[a].size && sets[b].size && inter / new Set([...sets[a], ...sets[b]]).size < 0.1) add('somiglianza', d, slot, 'menu per gruppi di persone molto diversi fra loro');
      }
    }

    // le quantità di frutta, carboidrati, latticini e grassi mangiate non superano quelle del piano (più una tolleranza per i condimenti)
    for (const p of people) {
      for (const slot of SLOTS) {
        const data = day[slot];
        const m = mealOf(p, slot);
        if (!m.eats || !m.plan.length) continue;
        const mine = (data?.items || []).filter((it) => eatersOf(it, household, slot, data).some((e) => e.id === p.id));
        const planned = { fruit: 0, carb: 0, dairy: 0, fat: 0 };
        for (const it of mine) for (const k of it.uses?.[p.id] || []) {
          const { slot: from, gi, part } = parseKey(k);
          const g = mealOf(p, from).plan[gi];
          // quantità massima ammessa dal gruppo (le alternative hanno dosi diverse: 90 g di pasta o 360 g di patate)
          for (const cat of Object.keys(planned)) {
            const q = Math.max(0, ...(g?.options || []).filter((x) => x.group === cat && ['g', 'ml'].includes(x.unit)).map((x) => x.qty));
            if (q) planned[cat] += q * (part ? 0.5 : 1);
          }
        }
        const actual = { fruit: 0, carb: 0, dairy: 0, fat: 0 };
        for (const it of mine) {
          const r = resolveItem(it, recipeMap);
          if (!r) continue;
          for (const ing of scaleRecipe(r, mealOfItem(p, slot, it))) if (actual[ing.group] !== undefined && ['g', 'ml'].includes(ing.unit)) actual[ing.group] += ing.qty;
        }
        for (const cat of ['fruit', 'carb', 'dairy']) {
          // frutta e carboidrati con quantità nel piano di quel pasto: non si superano di oltre il 25%
          const inPlan = m.plan.some((g) => g.options.some((o) => o.group === cat && o.qty > 0));
          if (inPlan && planned[cat] > 0 && actual[cat] > planned[cat] * 1.25 + 15) add('sforo', d, slot, `${p.name}: ${cat} ${Math.round(actual[cat])} g contro ${Math.round(planned[cat])} g del piano`);
        }
      }
    }

    // quantità del piano: ogni gruppo si mangia una volta sola, e i gruppi degli spuntini non finiscono a pranzo o a cena
    for (const p of people) {
      const claims = new Map();
      for (const slot of SLOTS) {
        const data = day[slot];
        for (const it of data?.items || []) {
          if (!eatersOf(it, household, slot, data).some((e) => e.id === p.id)) continue;
          for (const k of it.uses?.[p.id] || []) {
            claims.set(k, (claims.get(k) || 0) + 1);
            const { slot: from } = parseKey(k);
            if (from !== slot && slotKind(from) === 'spuntino' && slotKind(slot) === 'principale') add('spostato', d, slot, `un gruppo di ${from} è finito a ${slot} per ${p.name}`);
            if (from !== slot && slotKind(from) === 'principale' && slotKind(slot) === 'spuntino') add('spostato', d, slot, `un gruppo di ${from} è finito a ${slot} per ${p.name}`);
          }
        }
      }
      for (const [k, n] of claims) if (n > 1) add('doppioGruppo', d, parseKey(k).slot, `${k}: gruppo del piano consumato ${n} volte per ${p.name}`);
      // gruppi con quantità del piano rimasti senza essere mangiati (per chi regola sulla giornata)
      if (isDayBalanced(p)) {
        for (const slot of SLOTS) {
          const m = mealOf(p, slot);
          if (!m.eats) continue;
          m.plan.forEach((g, gi) => {
            if (!g.options.some((o) => o.qty > 0)) return;
            const base = `${slot}|${gi}`;
            let eaten = claims.has(base) || (claims.has(`${base}~h1`) && claims.has(`${base}~h2`));
            // un piatto con una fonte sostanziosa di proteine o carboidrati che il piano non nomina in modo identico vale come mangiato
            const cat = g.options.find((o) => o.qty > 0)?.group;
            if (!eaten && SUBSTANTIAL[cat]) {
              const sd = day[slot];
              eaten = (sd?.items || []).some((it) => eatersOf(it, household, slot, sd).some((e) => e.id === p.id) && (it.food ? it.food.group === cat : massOf(resolveItem(it, recipeMap), cat) >= SUBSTANTIAL[cat]));
            }
            const day7 = day[slot];
            if (!eaten && !(day7?.covered)) add('gruppo', d, slot, `${p.name}: gruppo ${gi + 1} di ${slot} non mangiato`);
          });
        }
      }
    }
  }

  // frequenze settimanali di ogni persona
  for (const p of people) for (const g of p.goals || []) {
    const n = counts[p.id]?.[g.food]?.size || 0;
    if (g.mode !== 'max' && n < g.times) add('frequenza', -1, '', `${p.name}: ${g.food} ${n}/${g.times}`);
    if ((g.mode === 'max' || g.mode === 'exact') && n > g.times) add('frequenza', -1, '', `${p.name}: ${g.food} ${n} oltre ${g.times}`);
  }
  return issues;
};

export const auditScore = (issues) => issues.reduce((a, i) => a + i.weight, 0);
export { scaleRecipe, mealOfItem };
