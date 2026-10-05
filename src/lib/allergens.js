// Intolleranze e allergeni stimati dai nomi degli ingredienti. È una stima: va sempre controllata l'etichetta.
export const ALLERGENS = [
  { id: 'glutine', label: 'Glutine' },
  { id: 'lattosio', label: 'Lattosio' },
  { id: 'uova', label: 'Uova' },
  { id: 'guscio', label: 'Frutta a guscio' },
  { id: 'soia', label: 'Soia' },
  { id: 'pesce', label: 'Pesce e crostacei' },
];

// [parole che indicano la presenza, parole che la escludono]
const RULES = {
  glutine: [
    ['pasta', 'pane', 'pangrattato', 'farina', 'farro', 'orzo', 'couscous', 'cous cous', 'seitan', 'semola', 'grano', 'avena', 'fiocchi d\'avena', 'granola', 'gnocchi', 'piadina', 'tortilla', 'wrap', 'cracker', 'grissini', 'fette biscottate', 'biscott', 'pizza', 'focaccia', 'crostini', 'tostato', 'toast', 'bulgur', 'salsa di soia', 'panko', 'cereali', 'lasagn', 'spaghetti', 'penne', 'fusilli', 'rigatoni', 'tagliatelle', 'orecchiette', 'ravioli', 'tortellini', 'maltagliati', 'sfoglia', 'brisée', 'frolla', 'panino', 'panini', 'crostoni', 'segale', 'pita', 'kamut', 'malto'],
    ['senza glutine', 'di riso', 'di mais', 'di ceci', 'di grano saraceno', 'di quinoa', 'di tapioca', 'di mandorle', 'di cocco', 'tamari', 'di amaranto', 'di miglio', 'di castagne', 'di lenticchie', 'di teff'],
  ],
  lattosio: [
    ['latte', 'yogurt', 'burro', 'panna', 'ricotta', 'mozzarella', 'formaggio', 'parmigiano', 'pecorino', 'grana', 'feta', 'mascarpone', 'stracchino', 'crescenza', 'fior di latte', 'besciamella', 'gorgonzola', 'provola', 'scamorza', 'kefir', 'caprino', 'primosale', 'philadelphia', 'cheddar', 'emmental', 'fontina', 'halloumi', 'burrata', 'robiola', 'taleggio', 'asiago'],
    ['vegetale', 'di soia', 'di avena', 'di mandorla', 'di mandorle', 'di riso', 'di cocco', 'di cocco', 'di anacardi', 'senza lattosio', 'vegan', 'burro di arachidi', 'burro di mandorle', 'burro di nocciole', 'burro di anacardi', 'burro di cacao', 'burro di semi', 'burro di sesamo', 'latte di', 'yogurt di', 'panna di', 'panna vegetale', 'formaggio vegetale', 'lievito alimentare', 'cocco'],
  ],
  uova: [['uova', 'uovo', 'maionese', 'albume', 'tuorlo', 'frittata', 'omelette'], ['vegan', 'senza uova']],
  guscio: [['noci', 'noce', 'mandorl', 'nocciol', 'pistacch', 'anacard', 'pinoli', 'pecan', 'macadamia', 'nutella', 'pesto', 'marzapane', 'granella'], ['noce moscata', 'noce di cocco', 'senza']],
  soia: [['soia', 'tofu', 'tempeh', 'edamame', 'miso', 'tamari'], ['senza soia']],
  pesce: [['tonno', 'salmone', 'merluzzo', 'gamberi', 'gamberetti', 'acciughe', 'alici', 'orata', 'branzino', 'pesce', 'calamari', 'polpo', 'cozze', 'vongole', 'sgombro', 'sardine', 'baccalà', 'trota', 'surimi', 'seppie', 'scampi', 'aragosta', 'granchio'], ['salsa di pesce vegetale']],
};

const hit = (name, [yes, no]) => {
  const n = ` ${name.toLowerCase()} `;
  return yes.some((w) => n.includes(w)) && !no.some((w) => n.includes(w));
};

// Il burro d'arachidi non è lattosio, "latte di soia" non è lattosio: le eccezioni stanno nelle liste sopra.
// Il burro di arachidi contiene però arachidi, non gestite come gruppo a sé: restano nel campo "Da evitare".
const cache = new WeakMap();
export const recipeAllergens = (recipe) => {
  if (cache.has(recipe)) return cache.get(recipe);
  const found = new Set();
  for (const ing of recipe.ingredients || []) {
    for (const a of ALLERGENS) if (hit(ing.name || '', RULES[a.id])) found.add(a.id);
  }
  cache.set(recipe, found);
  return found;
};

export const allergenLabel = (id) => ALLERGENS.find((a) => a.id === id)?.label || id;
