// Valori nutrizionali degli ingredienti (per 100 g) e totali di ricette e giornate.
// I valori vengono dalle tabelle in src/data/nutrition (fonti indicate voce per voce) e sono indicativi.
const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
let byName = new Map();
// I dati si caricano a parte (nutritionData.js nell'app, direttamente nelle prove da terminale)
export const setNutrition = (list) => { byName = new Map(list.map((n) => [norm(n.name), n])); };
export const nutritionCount = () => byName.size;

// Peso approssimativo di un "pezzo" o di un cucchiaio, quando la ricetta non usa i grammi
const PIECE = [
  [/uov/, 55], [/banan/, 120], [/mel[ae]\b|pera|arancia|pesca|nettarin/, 150], [/kiwi/, 75], [/limon|lime/, 60], [/avocado/, 150],
  [/cipollotto|cipolla/, 80], [/aglio/, 4], [/pomodor/, 100], [/patat/, 150], [/carot/, 70], [/zucchin/, 200], [/melanzan/, 250], [/peperon/, 200],
  [/panino|pane/, 50], [/tortilla|piadina|wrap/, 60], [/datter/, 8], [/pita/, 60], [/galletta/, 8],
];
const SPOON_ML = { cucchiai: 12, cucchiaini: 4 };

export const lookup = (name) => {
  const n = norm(name);
  if (byName.has(n)) return byName.get(n);
  // voce più vicina: tutte le parole del nome della tabella contenute nell'ingrediente (o viceversa)
  const words = new Set(n.split(' '));
  let best = null;
  for (const [k, v] of byName) {
    const kw = k.split(' ');
    const common = kw.filter((w) => words.has(w)).length;
    if (!common) continue;
    const score = common / Math.max(kw.length, words.size);
    if (!best || score > best.score) best = { score, v };
  }
  return best && best.score >= 0.5 ? best.v : null;
};

export const gramsOf = (ing) => {
  if (['g', 'ml'].includes(ing.unit)) return ing.qty;
  if (ing.unit === 'pz') { const hit = PIECE.find(([re]) => re.test(norm(ing.name))); return ing.qty * (hit ? hit[1] : 50); }
  if (SPOON_ML[ing.unit]) return ing.qty * (/olio|burro|miele|tahin|crema|burro/.test(norm(ing.name)) ? SPOON_ML[ing.unit] * 0.9 : SPOON_ML[ing.unit]);
  return 0;
};

const ZERO = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugars: 0, satFat: 0, iron: 0, calcium: 0 };

// Totali di un elenco di ingredienti { name, qty, unit }. `unknown` elenca quelli senza dati (restano fuori dal totale).
export const nutritionOf = (ingredients) => {
  const t = { ...ZERO };
  const unknown = [];
  for (const ing of ingredients) {
    if (!ing.qty || ing.unit === 'q.b.') continue;
    const v = lookup(ing.name);
    const g = gramsOf(ing);
    if (!v || !g) { if (g > 15) unknown.push(ing.name); continue; }
    for (const k of Object.keys(ZERO)) t[k] += ((v[k] || 0) * g) / 100;
  }
  return { ...t, unknown };
};

export const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
