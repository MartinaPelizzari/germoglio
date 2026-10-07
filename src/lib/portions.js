// Porzioni standard (CREA 2018, Tabella 9.1 e LARN V, docs/porzioni.md) per gli alimenti di un piano scritto senza quantità
// ("Cracker integrali", "Stick di carote con hummus", "Pane con marmellata e burro di arachidi"): servono per la lista della spesa
// e per le dosi. Un alimento descritto con più parti diventa un ingrediente per parte.
const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// [riconoscimento, ingrediente, quantità, unità, gruppo]
const TABLE = [
  [/cracker/, 'Cracker integrali', 30, 'g', 'carb'],
  [/fett\w* biscott/, 'Fette biscottate integrali', 30, 'g', 'carb'],
  [/gallett/, 'Gallette di riso', 30, 'g', 'carb'],
  [/\bpane\b|pane\b|toast/, 'Pane integrale', 50, 'g', 'carb'],
  [/hummus/, 'Hummus', 50, 'g', 'protein'],
  [/yogurt|skyr/, 'Yogurt bianco', 125, 'g', 'dairy'],
  [/kefir/, 'Kefir', 150, 'g', 'dairy'],
  [/\blatte\b|bevanda vegetale/, 'Latte', 200, 'ml', 'dairy'],
  [/carot/, 'Carote', 100, 'g', 'veg'],
  [/pomodorin|pomodor/, 'Pomodorini', 100, 'g', 'veg'],
  [/mirtill|frutti di bosco|lampon|fragol/, 'Frutti di bosco', 80, 'g', 'fruit'],
  [/marmellat|confettur/, 'Marmellata', 20, 'g', 'other'],
  [/burro di arachid/, 'Burro di arachidi', 15, 'g', 'fat'],
  [/burro di mandorl/, 'Burro di mandorle', 15, 'g', 'fat'],
  [/parmigian|grana|pecorino/, 'Parmigiano reggiano', 15, 'g', 'protein'],
  [/ricotta/, 'Ricotta', 50, 'g', 'protein'],
  [/\bolio\b/, 'Olio extravergine d\'oliva', 10, 'ml', 'fat'],
  [/frutta secca|noci|mandorle|nocciole/, 'Frutta secca', 15, 'g', 'fat'],
  [/frutt[oa] fresc|frutto|frutta/, 'Frutta fresca', 150, 'g', 'fruit'],
];
const GENERIC = { carb: 50, protein: 100, dairy: 125, fruit: 150, veg: 150, fat: 15, other: 30 };

// Ingredienti per una porzione standard di un alimento senza quantità
export const defaultParts = (name = '', group = 'other') => {
  const n = norm(name);
  const parts = [];
  const used = new Set();
  for (const [re, ing, qty, unit, g] of TABLE) {
    if (re.test(n) && !used.has(ing)) { parts.push({ name: ing, qty, unit, group: g }); used.add(ing); }
  }
  // "Stick di carote con hummus" contiene "carote" e "hummus"; "Yogurt greco + mirtilli": più parti. Se nulla è riconosciuto, un solo ingrediente generico
  if (!parts.length) parts.push({ name: name.trim(), qty: GENERIC[group] ?? 50, unit: 'g', group });
  // quando il nome intero è già un alimento semplice riconosciuto, si tiene il nome originale ("Yogurt greco", "Yogurt bianco")
  if (parts.length === 1 && TABLE.some(([re]) => re.test(n)) && n.split(/\s+/).length <= 3) parts[0] = { ...parts[0], name: name.trim() };
  return parts;
};
