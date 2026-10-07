// Confezioni tipiche del supermercato (indicative) per gli ingredienti che si vendono a pezzo intero o in vaschetta:
// servono a non sprecare (un menu riusa la metà avanzata nei giorni dopo) e a dire in spesa "2 confezioni da 250 g".
// size in g o ml; shelf = giorni in cui l'avanzo si conserva bene in frigo.
const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// [riconoscimento, nome, quantità, unità, giorni di conservazione dopo l'apertura]
const PACKS = [
  [/\bricotta\b/, 'Ricotta', 250, 'g', 4], [/mozzarella|fior di latte/, 'Mozzarella', 125, 'g', 3], [/stracchino|crescenza|squacquerone/, 'Stracchino', 170, 'g', 4],
  [/\bfeta\b/, 'Feta', 200, 'g', 7], [/scamorza|provola/, 'Scamorza', 250, 'g', 7], [/formaggio fresco spalmabile|philadelphia/, 'Formaggio spalmabile', 150, 'g', 7],
  [/skyr/, 'Skyr', 150, 'g', 4], [/yogurt greco/, 'Yogurt greco', 150, 'g', 4], [/\bkefir\b/, 'Kefir', 500, 'ml', 5], [/\bpanna\b/, 'Panna', 200, 'ml', 4],
  [/\blatte\b(?! di)/, 'Latte', 1000, 'ml', 4], [/latte di (soia|avena|mandorla|riso)|bevanda (di|d) /, 'Bevanda vegetale', 1000, 'ml', 5],
  [/\btofu\b/, 'Tofu', 250, 'g', 5], [/tempeh/, 'Tempeh', 200, 'g', 5], [/seitan/, 'Seitan', 200, 'g', 5], [/hummus/, 'Hummus', 200, 'g', 5],
  [/\bverza\b|cavolo cappuccio/, 'Verza', 800, 'g', 6], [/cavolfiore/, 'Cavolfiore', 700, 'g', 5], [/\bzucca\b/, 'Zucca', 1000, 'g', 7], [/cavolo nero/, 'Cavolo nero', 300, 'g', 4],
  [/finocch/, 'Finocchi', 400, 'g', 6], [/sedano/, 'Sedano', 500, 'g', 7], [/\bspinaci\b/, 'Spinaci', 250, 'g', 3], [/\brucola\b/, 'Rucola', 100, 'g', 3],
  [/lattuga|insalata/, 'Insalata', 250, 'g', 4], [/broccol/, 'Broccoli', 500, 'g', 4], [/\bporri?\b/, 'Porri', 400, 'g', 6], [/melanzan/, 'Melanzane', 400, 'g', 5],
  [/\bfunghi\b|champignon/, 'Funghi', 250, 'g', 3], [/pomodorini/, 'Pomodorini', 250, 'g', 5], [/barbabiet/, 'Barbabietola', 500, 'g', 7], [/\bavocado\b/, 'Avocado', 150, 'g', 2],
  [/\bpanna vegetale\b/, 'Panna vegetale', 200, 'ml', 5], [/passata/, 'Passata di pomodoro', 700, 'g', 4], [/\bpolpa di pomodoro\b/, 'Polpa di pomodoro', 400, 'g', 4],
  [/ceci cotti|fagioli .* cotti|lenticchie cotte|legumi cotti/, 'Legumi in barattolo', 240, 'g', 4], [/salmone affumicato/, 'Salmone affumicato', 100, 'g', 4],
  [/prosciutto cotto|prosciutto crudo|bresaola|speck/, 'Affettato', 100, 'g', 4], [/\buova\b|\buovo\b/, 'Uova', 6, 'pz', 21],
];

export const packFor = (name) => {
  const n = norm(name);
  const hit = PACKS.find(([re]) => re.test(n));
  return hit ? { label: hit[1], size: hit[2], unit: hit[3], shelf: hit[4] } : null;
};

// Per la lista della spesa: quante confezioni servono e quanto avanza (in g, ml o pezzi)
export const packNeed = (name, qty, unit) => {
  const p = packFor(name);
  if (!p || !qty || p.unit !== (unit === 'ml' ? 'ml' : unit === 'pz' ? 'pz' : 'g')) return null;
  const count = Math.max(1, Math.ceil(qty / p.size - 0.05));
  return { count, size: p.size, unit: p.unit, left: Math.round(count * p.size - qty), shelf: p.shelf, label: p.label };
};
