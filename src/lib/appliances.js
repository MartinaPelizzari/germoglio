// Elettrodomestici e attrezzi che una ricetta richiede davvero.
// Una ricetta li "richiede" solo se nei passaggi o nel titolo compaiono senza alternativa: "cuoci in forno" richiede il forno,
// "tosta il pane in tostapane o in padella" no. Le note (es. "scaldala al microonde") non contano: sono consigli, non preparazione.
// Il nucleo indica cosa ha in casa (household.appliances: elenco di id); senza indicazione si considera tutto disponibile.

export const APPLIANCES = [
  { id: 'forno', label: 'Forno', hint: 'per teglie, gratin, torte, pizze', re: /\bforno\b(?!\s+(?:a\s+)?microonde)|\binforn\w+|\bsforn\w+|\bgratin\w*/i },
  { id: 'frullatore', label: 'Frullatore o minipimer', hint: 'per smoothie, creme, hummus, zuppe', re: /\bfrull\w+|\bminipimer\b|\bmixer\b/i },
  { id: 'piastra-waffle', label: 'Piastra per waffle', hint: 'solo per i waffle', re: /piastra per waffle|\bwaffle(?:ra|iera)\b/i },
  { id: 'friggitrice', label: 'Friggitrice ad aria', hint: 'per cotture croccanti senza forno', re: /friggitrice/i },
  { id: 'pentola-pressione', label: 'Pentola a pressione', hint: 'per legumi e cereali in poco tempo', re: /pentola a pressione/i },
  { id: 'microonde', label: 'Forno a microonde', hint: 'per scaldare e cotture veloci', re: /microonde/i },
  { id: 'tostapane', label: 'Tostapane', hint: 'per pane e toast', re: /tostapane|tostiera/i },
];
const BY_ID = new Map(APPLIANCES.map((a) => [a.id, a]));
export const applianceLabel = (id) => BY_ID.get(id)?.label || id;

// una frase offre un'alternativa a cosa si usa ("o in padella", "oppure", "anche", "se preferisci")
const ALT = /\b(oppure|in alternativa|anche|se preferisci|se vuoi|se non hai|se hai)\b|\bo\s+(?:in\s+|nel\s+|nella\s+|al\s+|alla\s+|con\s+(?:la|il)\s+|a\s+)?(?:padella|casseruola|pentola|forno|friggitrice|tostapane|microonde|piastra|griglia|coltello|forchetta|schiacci\w*|sbatti)\b|\b(?:padella|casseruola|forno|friggitrice|tostapane|microonde|pentola(?: normale)?)\s+o\b|\bfrull\w+\s+o\b/i;

const memo = new WeakMap();
// id degli elettrodomestici che la ricetta richiede (un campo `appliances` scritto a mano nella ricetta ha la precedenza)
export const appliancesNeeded = (recipe) => {
  if (!recipe) return [];
  if (Array.isArray(recipe.appliances)) return recipe.appliances;
  if (memo.has(recipe)) return memo.get(recipe);
  const texts = [recipe.title || '', ...(recipe.steps || [])];
  const out = APPLIANCES.filter((a) => texts.some((t) => String(t).split(/(?<=[.;])\s+/).some((s) => a.re.test(s) && !ALT.test(s)))).map((a) => a.id);
  memo.set(recipe, out);
  return out;
};

// elettrodomestici mancanti per cucinare la ricetta, dato l'elenco di quelli posseduti (undefined = tutti)
export const missingAppliances = (recipe, owned) => (Array.isArray(owned) ? appliancesNeeded(recipe).filter((id) => !owned.includes(id)) : []);

// quante ricette richiedono ciascun elettrodomestico (per mostrare solo quelli che cambiano davvero qualcosa)
export const applianceStats = (recipes) => {
  const n = {};
  for (const r of recipes) for (const id of appliancesNeeded(r)) n[id] = (n[id] || 0) + 1;
  return n;
};
