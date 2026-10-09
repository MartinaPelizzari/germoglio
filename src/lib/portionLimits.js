// Limiti di sicurezza per porzione: una quantità fuori scala non si propone, si rigenera o si segnala.
// Le porzioni standard sono quelle di docs/porzioni.md (CREA 2018 Tab. 9.1, LARN V), a crudo e al netto degli scarti.
// Il limite è un multiplo della porzione standard che cresce col fabbisogno di energia: chi ha bisogno di molte calorie può mangiare di più,
// ma nessuno mangia 155 g di pasta in un pasto con 2000 kcal al giorno.
// Valgono solo per le quantità che sceglie l'app (dieta equilibrata creata dall'app): le quantità di un piano scritto da una nutrizionista
// sono quelle della dieta e non si toccano.
import { pieceGrams } from './nutrition.js';
import { computeNeeds } from './needs.js';

const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// [riconoscimento del nome, porzione standard, unità, nome per i messaggi]. La prima riga che corrisponde vince.
const STANDARD = [
  [/fette? biscott|cracker|gallett|grissin|frisell/, 30, 'g', 'fette biscottate o cracker'],
  [/cereali|muesli|granola|fiocchi d.?avena|fiocchi di|corn ?flakes/, 40, 'g', 'cereali da colazione'],
  [/\bpane\b|panino|piadin|toast|focaccia/, 50, 'g', 'pane'],
  [/gnocchi/, 150, 'g', 'gnocchi'],
  [/pasta|spaghett|penne|fusill|riso|farro|orzo|couscous|cous cous|quinoa|bulgur|miglio|mais|polenta/, 80, 'g', 'pasta, riso o cereali'],
  [/patat/, 200, 'g', 'patate'],
  [/lenticch\w* secch|ceci secch|fagioli secch|legumi secch|fave secch|piselli secch/, 50, 'g', 'legumi secchi'],
  [/ceci|lenticch|fagiol|fave|piselli|edamame|legumi/, 150, 'g', 'legumi'],
  [/tofu|tempeh|seitan|burger/, 100, 'g', 'tofu o simili'],
  [/prosciutto|bresaola|salume|speck|mortadella/, 50, 'g', 'salumi'],
  [/manzo|vitello|maiale|agnello|pollo|tacchino|coniglio|carne|fettin|hamburger|polpett/, 100, 'g', 'carne'],
  [/pesce|merluzz|salmon|tonno|orata|branzin|gamber|cozze|vongol|calamar|polpo|trota|sgombro/, 150, 'g', 'pesce'],
  [/parmigian|grana|pecorino|gorgonzola|formaggio stagion/, 50, 'g', 'formaggio stagionato'],
  [/ricotta|mozzarella|stracchin|formaggio|feta|fiocchi di latte|primo sale|scamorza/, 100, 'g', 'formaggio fresco'],
  [/yogurt|skyr|kefir/, 125, 'g', 'yogurt'],
  [/\blatte\b|bevanda (di|vegetale)/, 200, 'ml', 'latte'],
  [/frutta secca|noci|mandorl|nocciol|pistacch|anacard|arachid|semi di|pinoli/, 30, 'g', 'frutta secca'],
  [/\bolio\b/, 10, 'ml', 'olio'],
  [/frutta|mel[ae]\b|pera|pere|banan|arancia|arance|kiwi|pesca|pesche|fragol|uva\b|mandarin|albicocch|susin/, 150, 'g', 'frutta fresca'],
];
// la frutta si mangia anche in due porzioni, l'olio e la frutta secca hanno limiti propri
const EXTRA = { 'frutta fresca': 2, olio: 2, 'frutta secca': 1.5 };

// Moltiplicatore massimo della porzione standard in base all'energia giornaliera della persona (kcal; senza dato: adulto medio)
export const limitFactor = (kcal) => (!kcal || kcal < 2400 ? 1.5 : kcal < 3000 ? 1.75 : 2.25);
// Moltiplicatore che l'app stessa usa per le sue proposte: più stretto del limite
export const targetFactor = (kcal) => (!kcal || kcal < 2400 ? 1.25 : kcal < 3000 ? 1.5 : 2);

export const standardOf = (name) => {
  const n = norm(name);
  const hit = STANDARD.find(([re]) => re.test(n));
  return hit ? { std: hit[1], unit: hit[2], label: hit[3] } : null;
};

// Massimo ammesso (g o ml) per una porzione di quell'alimento in un pasto, o null se l'alimento non ha un limite
export const maxPortion = (name, kcal) => {
  const s = standardOf(name);
  if (!s) return null;
  const mult = Math.max(limitFactor(kcal), EXTRA[s.label] ?? 0);
  return { max: Math.round(s.std * mult), unit: s.unit, std: s.std, label: s.label };
};

// Una quantità è fuori scala? Restituisce null o { label, qty, max, std, unit }
export const portionIssue = (name, qty, unit, kcal) => {
  let q = Number(qty) || 0;
  let u = unit;
  if (u === 'pz') { const g = pieceGrams(name); if (!g) return null; q *= g; u = 'g'; }
  if (!['g', 'ml'].includes(u) || q <= 0) return null;
  const m = maxPortion(name, kcal);
  if (!m) return null; // g e ml si confrontano alla pari (liquidi ≈ 1 g/ml)
  return q > m.max ? { label: m.label, qty: Math.round(q), max: m.max, std: m.std, unit: m.unit } : null;
};

// Fabbisogno giornaliero di chi ha i dati del corpo nel profilo (serve a dare il limite di porzione giusto); senza dati: adulto medio
const energyMemo = new WeakMap();
export const energyOf = (member) => {
  if (!member?.body) return undefined;
  if (!energyMemo.has(member)) { let k; try { const n = computeNeeds({ ...member.body, diet: member.diet }); k = n.blocked ? undefined : n.kcal; } catch { k = undefined; } energyMemo.set(member, k); }
  return energyMemo.get(member);
};
