// Valori nutrizionali degli ingredienti (per 100 g) e totali di ricette e giornate.
// I valori vengono dalle tabelle in src/data/nutrition (fonti indicate voce per voce) e sono indicativi.
const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
let byName = new Map();
// I dati si caricano a parte (nutritionData.js nell'app, direttamente nelle prove da terminale)
export const setNutrition = (list) => { byName = new Map(list.map((n) => [norm(n.name), n])); };

// Peso approssimativo di un "pezzo" o di un cucchiaio, quando la ricetta non usa i grammi
const PIECE = [
  [/uov/, 55], [/banan/, 120], [/mel[ae]\b|pera|arancia|pesca|nettarin/, 150], [/kiwi/, 75], [/limon|lime/, 60], [/avocado/, 150],
  [/cipollotto|cipolla/, 80], [/aglio/, 4], [/pomodor/, 100], [/patat/, 150], [/carot/, 70], [/zucchin/, 200], [/melanzan/, 250], [/peperon/, 200],
  [/panino|pane/, 50], [/tortilla|piadina|wrap/, 60], [/datter/, 8], [/pita/, 60], [/galletta/, 8],
];
const SPOON_ML = { cucchiai: 12, cucchiaini: 4 };

// Equivalenze sicure fra nomi di ingredienti (stesso prodotto scritto in modo diverso)
const ALIAS = {
  'lime': 'limone', 'manzo macinato magro': 'macinato di manzo', 'maiale macinato magro': 'filetto di maiale', 'halloumi': 'scamorza',
  'bevanda d avena': 'bevanda di avena', 'latte d avena': 'bevanda di avena', 'latte di avena': 'bevanda di avena',
  'latte di mandorla': 'bevanda di mandorla', 'bevanda di soia': 'latte di soia', 'sciroppo d agave': 'sciroppo d agave',
  'burro d arachidi': 'burro di arachidi', 'cacao amaro': 'cacao amaro in polvere', 'menta': 'menta fresca',
  'acqua frizzante': 'acqua', 'olive nere denocciolate': 'olive nere', 'pomodori ciliegini': 'pomodorini', 'pomodori ramati': 'pomodori',
  'pomodori datterini': 'pomodorini', 'peperone verde': 'peperoni', 'peperone rosso': 'peperoni', 'peperone giallo': 'peperoni',
  'cavolo nero': 'cavolo nero', 'pistacchi': 'pistacchi sgusciati', 'gamberi': 'gamberi sgusciati', 'orata intera': 'orata intera pulita',
  'salsiccia': 'salsiccia fresca', 'pane toscano': 'pane raffermo', 'pane da toast': 'pane in cassetta', 'pane per tramezzini': 'pane in cassetta',
  'spaghetti integrali': 'spaghetti', 'farina di mais per polenta': 'farina di mais', 'cocco disidratato': 'cocco rapè',
  'mirtilli essiccati': 'mirtilli secchi', 'lievito per dolci senza glutine': 'lievito per dolci', 'riso per sushi': 'riso per insalate',
  'pane ai cereali in cassetta': 'pane integrale in cassetta', 'pane integrale multicereali': 'pane integrale', 'pane pita integrale': 'pane integrale',
};
const words = (n) => n.split(' ').filter(Boolean);
// parole che cambiano il prodotto (secco, cotto, soffiato...): se l'ingrediente le ha e la voce di tabella no, non è la stessa cosa
const STATE = /^(secch|secc|essicc|cott|crud|soffi|surgel|congel|affumic|sott|disidrat|lessat)/;

export const lookup = (name) => {
  const n = norm(name);
  if (byName.has(n)) return byName.get(n);
  const alias = ALIAS[n];
  if (alias && byName.has(norm(alias))) return byName.get(norm(alias));
  // Voce più vicina: PRIMA tutte le parole della voce di tabella contenute nell'ingrediente (la più specifica vince),
  // poi tutte le parole dell'ingrediente contenute nella voce di tabella (se la voce non è molto più lunga).
  // Mai corrispondenze per una sola parola in comune ("peperone rosso" non è "vino rosso", "branzino intero" non è "latte intero").
  const iw = new Set(words(n));
  let best = null;
  for (const [k, v] of byName) {
    const kw = words(k);
    if (kw.length && kw.every((w) => iw.has(w)) && ![...iw].some((w) => !kw.includes(w) && STATE.test(w))) {
      const score = kw.length / iw.size;
      if (score >= 0.5 && (!best || kw.length > best.len || (kw.length === best.len && score > best.score))) best = { v, len: kw.length, score };
    }
  }
  if (best) return best.v;
  let rev = null;
  for (const [k, v] of byName) {
    const kw = words(k);
    if (iw.size && [...iw].every((w) => kw.includes(w)) && iw.size / kw.length >= 0.6 && (!rev || kw.length < rev.len)) rev = { v, len: kw.length };
  }
  return rev ? rev.v : null;
};

// Peso di un pezzo, se lo conosciamo (altrimenti null)
export const pieceGrams = (name) => PIECE.find(([re]) => re.test(norm(name)))?.[1] ?? null;

export const gramsOf = (ing) => {
  if (['g', 'ml'].includes(ing.unit)) return ing.qty;
  if (ing.unit === 'pz') { const hit = PIECE.find(([re]) => re.test(norm(ing.name))); return ing.qty * (hit ? hit[1] : 50); }
  if (SPOON_ML[ing.unit]) return ing.qty * (/olio|burro|miele|tahin|crema|burro/.test(norm(ing.name)) ? SPOON_ML[ing.unit] * 0.9 : SPOON_ML[ing.unit]);
  return 0;
};
