export const GROUPS = [
  { id: 'carb', label: 'Carboidrati', emoji: '🌾' },
  { id: 'protein', label: 'Proteine', emoji: '🫘' },
  { id: 'veg', label: 'Verdure', emoji: '🥦' },
  { id: 'fat', label: 'Grassi', emoji: '🥜' },
  { id: 'fruit', label: 'Frutta', emoji: '🍎' },
  { id: 'dairy', label: 'Latte e yogurt', emoji: '🥛' },
  { id: 'other', label: 'Altro', emoji: '🧂' },
];

// Gruppi per cui si può fissare una dose in grammi nella scheda persona
export const TARGET_GROUPS = GROUPS.filter((g) => g.id !== 'other');

export const GROUP_LABEL = Object.fromEntries(GROUPS.map((g) => [g.id, g.label]));

export const UNITS = ['g', 'ml', 'pz', 'cucchiai', 'cucchiaini', 'q.b.'];

const KEYWORDS = [
  ['dairy', ['latte', 'yogurt', 'bevanda di', 'panna vegetale', 'kefir']],
  ['fat', ['olio', 'burro', 'noci', 'mandorl', 'nocciol', 'pistacch', 'anacard', 'arachid', 'semi', 'tahin', 'olive', 'avocado', 'pinoli', 'cocco']],
  ['carb', ['pasta', 'riso', 'farro', 'orzo', 'quinoa', 'couscous', 'pane', 'farina', 'fiocchi', 'avena', 'patat', 'gnocchi', 'polenta', 'cereali', 'granola', 'piadina', 'tortilla', 'cracker', 'grissini', 'fette biscottate', 'pangrattato', 'miglio', 'grano saraceno']],
  ['protein', ['ceci', 'lenticchie', 'fagioli', 'piselli', 'tofu', 'tempeh', 'seitan', 'soia', 'uova', 'uovo', 'ricotta', 'feta', 'formaggio', 'parmigiano', 'edamame', 'fave', 'hummus', 'proteine']],
  ['fruit', ['mela', 'mele', 'banana', 'pera', 'arancia', 'limone', 'frutti', 'fragol', 'mirtill', 'dattert', 'uvetta', 'fico', 'fichi', 'melograno', 'kiwi', 'pesca', 'ananas', 'mango', 'frutta']],
  ['other', ['sale', 'pepe', 'spezi', 'curcuma', 'paprika', 'cannella', 'origano', 'basilico', 'prezzemolo', 'aceto', 'lievito', 'zucchero', 'sciroppo', 'cioccolato', 'cacao', 'salsa di soia', 'brodo', 'acqua', 'vaniglia', 'senape', 'miso', 'rosmarino', 'timo', 'salvia', 'zenzero', 'concentrato']],
  ['veg', ['pomodor', 'zucchin', 'melanzan', 'carot', 'cipoll', 'aglio', 'spinaci', 'broccol', 'cavol', 'peperon', 'insalata', 'lattuga', 'rucola', 'funghi', 'finocch', 'sedano', 'zucca', 'bietol', 'fagiolini', 'asparagi', 'radicchio', 'cetriol', 'verdur', 'porri', 'carciof']],
];

// Prima ipotesi del gruppo in base al nome: serve come suggerimento, l'utente può correggerla.
export const guessGroup = (name = '') => {
  const n = name.toLowerCase();
  for (const [group, words] of KEYWORDS) if (words.some((w) => n.includes(w))) return group;
  return 'other';
};
