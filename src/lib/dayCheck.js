// Verifica di una giornata contro un piano alimentare: gruppo per gruppo copertura, dosi e ingredienti fuori piano.
// Serve a controllare il motore (scripts/check-day.mjs lo usa da riga di comando, le prove automatiche lo usano con piani di esempio).
import { describeOption, planMatches, planViolations } from './dietPlan.js';
import { newState, planFor, usesFor } from './planGen.js';
import { SLOTS, mealOfItem, scaleRecipe } from './scale.js';
import { resolveItem } from './items.js';

// meals = { Pasto: { planText, plan } }, spec = { diet, slots: { Pasto: ["Titolo ricetta" | "food:nome"] } }, recipes = ricettario
export const evaluateDay = ({ meals, spec, recipes, mode }) => {
  const byTitle = new Map(recipes.map((r) => [r.title.toLowerCase(), r]));
  const map = new Map(recipes.map((r) => [r.id, r]));
  const me = { id: 'p', name: 'Tu', diet: spec.diet || 'omnivore', balance: mode, meals };
  const household = { members: [me], rules: [] };
  const state = newState({ month: undefined });
  state.day = { consumed: new Map() };
  const out = { slots: {}, covered: new Map(), extras: [], missing: [], notes: [] };
  const dayItems = {};
  for (const slot of SLOTS) {
    const names = spec.slots?.[slot] || [];
    const items = [];
    state.curSlot = slot; state.curDay = 0;
    const claimed = new Map();
    for (const nm of names) {
      let item;
      if (nm.startsWith('food:')) {
        // alimento semplice: prende dal piano il gruppo che lo nomina, con la quantità indicata
        const word = nm.slice(5).toLowerCase();
        let found = null;
        const pf = planFor(me, slot, state);
        pf.groups.forEach((g, gi) => g.options.forEach((o) => { if (!found && !pf.keys[gi].endsWith('~h1') && o.name.toLowerCase().includes(word) && !state.day.consumed.get('p')?.has(pf.keys[gi])) found = { o, key: pf.keys[gi] }; }));
        if (!found) { out.notes.push(`${slot}: "${word}" non è tra gli alimenti del piano per questo pasto`); item = { instanceId: nm, food: { name: word, qty: 0, unit: 'g', group: 'other' } }; }
        else item = { instanceId: nm, food: { name: found.o.name, qty: found.o.qty, unit: found.o.unit, group: found.o.group }, uses: { p: [found.key] } };
      } else {
        const r = byTitle.get(nm.toLowerCase());
        if (!r) { out.notes.push(`${slot}: ricetta "${nm}" non trovata nel ricettario`); continue; }
        item = { instanceId: nm, recipeId: r.id };
        const u = usesFor(r, [me], slot, state, claimed);
        if (u) item.uses = u;
      }
      items.push(item);
      // registra i gruppi consumati per i pasti successivi
      for (const [pid, keys] of Object.entries(item.uses || {})) { const set = state.day.consumed.get(pid) || new Set(); keys.forEach((k) => set.add(k)); state.day.consumed.set(pid, set); }
    }
    dayItems[slot] = { items };
    out.slots[slot] = items;
  }
  // gruppo per gruppo
  for (const slot of SLOTS) {
    meals[slot]?.plan.forEach((g, gi) => {
      const key = `${slot}|${gi}`;
      const opts = g.options.filter((o) => o.qty > 0).slice(0, 3).map(describeOption).join(' | ') || 'verdure (senza quantità)';
      const eatenBy = [];
      for (const s2 of SLOTS) for (const it of dayItems[s2].items) {
        const keys = it.uses?.p || [];
        const hit = keys.filter((k) => k === key || k === `${key}~h1` || k === `${key}~h2`);
        if (!hit.length) continue;
        const r = resolveItem(it, map);
        const part = hit.map((k) => (k.endsWith('~h1') || k.endsWith('~h2') ? 'metà' : 'intero')).join('+');
        const meal = mealOfItem(me, s2, it);
        let grams = '';
        if (!it.food && r) {
          const sc = scaleRecipe(r, meal);
          const pos = (it.uses?.p || []).indexOf(hit[0]);
          const m = planMatches(r, meal.plan)[pos];
          if (m) grams = m.idx.map((i) => `${sc[i].name} ${Math.round(sc[i].qty * 10) / 10} ${sc[i].unit}`).join(', ');
          else grams = 'nessun ingrediente del piatto corrisponde con certezza';
        }
        else if (it.food) grams = `${it.food.name} ${it.food.qty} ${it.food.unit}`;
        eatenBy.push(`${s2}: ${r?.title || it.food?.name} (${part})${grams ? ' → ' + grams : ''}`);
      }
      out.covered.set(key, { opts, eatenBy });
    });
  }
  // ingredienti fuori piano
  for (const slot of SLOTS) for (const it of dayItems[slot].items) {
    if (it.food) continue;
    const r = resolveItem(it, map);
    const meal = mealOfItem(me, slot, it);
    const off = planViolations(r, [...meal.plan, ...(meals[slot]?.plan || [])]);
    if (off.length) out.extras.push(`${slot}: ${r.title} contiene ${[...new Set(off)].join(', ')}, che il piano non prevede in quel pasto`);
  }
  return out;
};
