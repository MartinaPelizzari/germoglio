// Perché una ricetta non rispetta il piano alimentare di una persona e come adattarla.
import { describeOption, planMatches, planViolationItems } from './dietPlan.js';

const GROUP_NAME = { carb: 'carboidrati', protein: 'proteine', dairy: 'latticini', fruit: 'frutta', fat: 'grassi e frutta secca', other: 'dolci' };
const coarse = (g) => (g === 'other' ? 'other' : g);

// Report per una persona e un pasto: gli ingredienti fuori piano (con le alternative del piano nello stesso gruppo)
// e i gruppi del piano che la ricetta non copre.
export const planReport = (recipe, groups, slot) => {
  if (!groups?.length) return { issues: [], uncovered: [] };
  const matches = planMatches(recipe, groups);
  const free = groups.map((g, gi) => ({ g, gi })).filter(({ gi }) => !matches[gi]); // gruppi non coperti dalla ricetta
  const issues = planViolationItems(recipe, groups).map(({ ing, index }) => {
    const kind = coarse(ing.group);
    // alternative del piano dello stesso tipo, preferendo i gruppi che la ricetta non copre ancora
    const pool = (free.length ? free : groups.map((g, gi) => ({ g, gi }))).flatMap(({ g }) => g.options.filter((o) => coarse(o.group) === kind));
    const options = pool.filter((o) => o.qty > 0).slice(0, 4);
    const qty = ing.unit === 'q.b.' ? '' : ` (${Math.round(ing.qty * 10) / 10} ${ing.unit})`;
    const why = `${ing.name}${qty} non è previsto nel piano di ${slot.toLowerCase()}.`;
    const hint = options.length
      ? `Il tuo piano ammette ${GROUP_NAME[kind] || 'un alimento simile'}: ${options.map(describeOption).join(', ')}.`
      : `Il piano di ${slot.toLowerCase()} non prevede ${GROUP_NAME[kind] || 'questo tipo di alimento'}: conviene toglierlo.`;
    return { index, ing, why, hint, options };
  });
  return { issues, uncovered: free.map(({ g, gi }) => ({ gi, label: g.options.slice(0, 2).map(describeOption).join(' o ') })) };
};

// choices[index] = { action: 'keep' | 'remove' | 'replace', option } -> nuova ricetta (copia personale, l'originale non cambia)
export const adaptRecipe = (recipe, issues, choices, slot) => {
  const notes = [];
  const ingredients = [];
  (recipe.ingredients || []).forEach((ing, i) => {
    const issue = issues.find((x) => x.index === i);
    const c = issue ? choices[i] : null;
    if (!c || c.action === 'keep') { ingredients.push({ ...ing }); return; }
    if (c.action === 'remove') { notes.push(`tolto ${ing.name.toLowerCase()}`); return; }
    const o = c.option;
    const cap = o.name.charAt(0).toUpperCase() + o.name.slice(1);
    ingredients.push({ name: cap, qty: o.qty > 0 ? o.qty : ing.qty, unit: o.qty > 0 ? o.unit : ing.unit, group: o.group || ing.group });
    notes.push(`${ing.name.toLowerCase()} sostituito con ${o.name.toLowerCase()}`);
  });
  const { id, own, seed, overridden, ...rest } = recipe;
  return {
    ...rest,
    id: null,
    own: true,
    title: `${recipe.title} (adattata al piano)`,
    ingredients,
    notes: [recipe.notes, notes.length ? `Adattata al piano alimentare di ${slot.toLowerCase()}: ${notes.join('; ')}. Controlla il procedimento.` : ''].filter(Boolean).join(' '),
    source: recipe.source || null,
  };
};
