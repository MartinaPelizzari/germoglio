// Piano alimentare scritto dalla nutrizionista.
//
// Formato che l'app capisce, per ogni pasto:
//   - un'alternativa per riga, oppure separate da "oppure" / "o" / "/"
//   - le righe di un gruppo sono alternative: se ne sceglie una
//   - gruppi diversi si separano con una riga vuota, con una riga "+" o con " + ": vanno mangiati insieme
// Esempio, colazione:
//   150 g yogurt oppure 30 g pane
//   (riga vuota)
//   1 frutto
import { guessGroup } from './groups.js';
import { FOOD_TYPES } from './foodTypes.js';

const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['di', 'd', 'del', 'della', 'dei', 'delle', 'con', 'e', 'a', 'al', 'alla', 'in', 'per', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'fresco', 'fresca', 'freschi', 'fresche', 'naturale', 'intero', 'intera', 'magro', 'magra', 'biologico', 'cotto', 'cotta', 'crudo', 'cruda', 'qb', 'circa', 'ca', 'stagione', 'tipo', 'bianco', 'bianca', 'vaccino', 'parzialmente', 'scremato', 'scremata', 'integrale', 'integrali', 'soffiato', 'soffiata', 'soffiati', 'basmati', 'volonta']);
const stem = (t) => (t.length > 4 ? t.slice(0, -1) : t);
const tokens = (s) => norm(s).split(' ').filter((t) => t && !STOP.has(t)).map(stem);

const UNIT_MAP = { g: 'g', gr: 'g', grammi: 'g', grammo: 'g', kg: 'kg', ml: 'ml', cl: 'cl', dl: 'dl', l: 'l', lt: 'l', pz: 'pz', pezzi: 'pz', pezzo: 'pz', fetta: 'fetta', fette: 'fetta', cucchiaio: 'cucchiai', cucchiai: 'cucchiai', cucchiaino: 'cucchiaini', cucchiaini: 'cucchiaini', vasetto: 'vasetto', vasetti: 'vasetto', frutto: 'pz', frutti: 'pz', porzione: 'pz', porzioni: 'pz', tazza: 'tazza', tazze: 'tazza', bicchiere: 'bicchiere', bicchieri: 'bicchiere' };
const NUMBER_WORDS = { un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6 };

const toBase = (qty, unit, name) => {
  const n = norm(name);
  switch (unit) {
    case 'kg': return [qty * 1000, 'g'];
    case 'cl': return [qty * 10, 'ml'];
    case 'dl': return [qty * 100, 'ml'];
    case 'l': return [qty * 1000, 'ml'];
    case 'fetta': return /pane|toast|cassetta/.test(n) ? [qty * 30, 'g'] : /biscott/.test(n) ? [qty * 10, 'g'] : [qty, 'pz'];
    case 'vasetto': return [qty * 125, 'g'];
    case 'tazza': case 'bicchiere': return [qty * 200, 'ml'];
    default: return [qty, unit];
  }
};

const num = (s) => parseFloat(String(s).replace(',', '.'));
const wordNum = (w) => (/^\d/.test(w) ? num(w) : NUMBER_WORDS[w.toLowerCase()]);

// Frequenze nelle note: "[due volte a settimana]", "[fino a 6 uova a settimana]"
const readFrequency = (note) => {
  let m = note.match(/\b(una|uno|un|due|tre|quattro|cinque|\d+)\s+volt[ae]\s+(?:a|alla)\s+settimana/i);
  if (m) return { maxPerWeek: wordNum(m[1]) };
  m = note.match(/fino a\s+(\d+)\s*([a-zà-ù]+)?\s+(?:a|alla)\s+settimana/i);
  if (m) return { maxQtyPerWeek: num(m[1]) };
  return null;
};
// "evitando fichi, cachi, uva e mango", "evitiamo la soia"
const readAvoid = (note) => {
  const m = note.match(/evit(?:ando|iamo|are|a|i)\s+([^.;()\[\]]+)/i);
  if (!m) return [];
  return m[1].split(/,|\se\s|\so\s/).map((w) => norm(w).replace(/^(la|il|lo|le|gli|i|l)\s+/, '').trim()).filter((w) => w && w.split(' ').length <= 2 && w.length > 2);
};

// "150 g yogurt", "2 fette di pane (60 g)", "yogurt 150 g [due volte a settimana]", "frutta fresca"
export const parseOption = (raw) => {
  let text = raw.replace(/^[\s\-•*·]+/, '').trim();
  if (!text) return null;
  const original = text;
  const notes = [];
  let paren = null;
  // grammi tra parentesi: prevalgono ("2 fette di pane (60 g)")
  const pm = text.match(/\(\s*(\d+(?:[.,]\d+)?)\s*(g|gr|ml|kg|cl|dl|l)\s*\)/i);
  if (pm) { paren = [num(pm[1]), UNIT_MAP[pm[2].toLowerCase()]]; text = text.replace(pm[0], ' ').trim(); }
  // note tra parentesi quadre o tonde
  text = text.replace(/\[([^\]]*)\]|\(([^)]*)\)/g, (_, a, b) => { notes.push((a ?? b).trim()); return ' '; }).replace(/\s+/g, ' ').trim();
  // spiegazioni dopo i due punti ("frutta fresca: è buona abitudine ...")
  const colon = text.match(/^([^:]{3,60}):\s+(.+)$/);
  if (colon) { text = colon[1]; notes.push(colon[2]); }
  // combinazioni: "4 fette biscottate + un velo di marmellata"
  let extra = '';
  const plus = text.split(/\s\+\s/);
  if (plus.length > 1) { text = plus[0]; extra = plus.slice(1).join(' + '); }
  text = text.replace(/^fino a\s+/i, (m) => { notes.push('fino a'); return ''; });
  const upTo = notes.includes('fino a');

  let qty = 0, unit = 'q.b.', name = text;
  const range = text.match(/^(\d+)\s+o\s+(\d+)\s+(.*)$/);
  const qf = text.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZÀ-ÿ.]+)?\s*(?:di\s+|d')?(.*)$/);
  const wf = text.match(/^(un|uno|una|due|tre|quattro|cinque)\s+(.*)$/i);
  const nf = text.match(/^(.*?)[\s:(-]+(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)\s*\)?\s*$/);
  if (range) { qty = num(range[1]); unit = 'pz'; name = range[3]; notes.push(`da ${range[1]} a ${range[2]}`); }
  else if (qf) {
    qty = num(qf[1]);
    const w = (qf[2] || '').replace(/\.$/, '').toLowerCase();
    if (UNIT_MAP[w]) { unit = UNIT_MAP[w]; name = qf[3] || w; if (w.startsWith('fett') && /^biscott/i.test(name)) name = `fette ${name}`; } // "1 frutto", "1 vasetto": la parola è anche l'alimento
    else { unit = 'pz'; name = `${qf[2] || ''} ${qf[3]}`; }
  } else if (wf && !/^(velo|po|pizzico)\b/i.test(wf[2])) {
    qty = wordNum(wf[1]); unit = 'pz'; name = wf[2];
  } else if (nf && UNIT_MAP[nf[3].toLowerCase()]) {
    qty = num(nf[2]); unit = UNIT_MAP[nf[3].toLowerCase()]; name = nf[1];
  }
  name = name.replace(/^[\s,:;-]+|[\s,:;-]+$/g, '').replace(/\s+/g, ' ');
  if (!name) return null;
  if (paren) [qty, unit] = paren;
  else if (qty) [qty, unit] = toBase(qty, unit, name);
  if (!qty) unit = 'q.b.';

  const noteText = notes.filter((n) => n && n !== 'fino a').join(' · ');
  const freq = readFrequency(notes.join(' '));
  const out = { text: original, name, qty, unit, group: guessGroup(name) };
  if (upTo) out.upTo = true;
  if (extra) out.extra = extra;
  if (noteText) out.note = noteText;
  if (freq?.maxPerWeek) out.maxPerWeek = freq.maxPerWeek;
  else if (freq?.maxQtyPerWeek) out.maxPerWeek = qty > 0 ? Math.max(1, Math.floor(freq.maxQtyPerWeek / qty)) : freq.maxQtyPerWeek;
  const avoid = readAvoid(notes.join('. '));
  if (avoid.length) out.avoid = avoid;
  return out;
};

const POOL_RE = /^fino a\s+(\d+)\s+volte\s+(?:a|alla)\s+settimana\b.*$/i;

// Testo di un pasto -> gruppi di alternative.
//  - alternative: una per riga, oppure separate da "oppure", "o", "/";
//  - quantità e unità dell'ultima alternativa valgono anche per quelle scritte senza ("90 g di riso / pasta di farro");
//  - gruppi diversi (da mangiare insieme): riga vuota, riga "+", oppure " + " in una riga singola con due quantità;
//  - una riga "Fino a 3 volte a settimana: ..." limita le alternative che seguono (insieme) a quel numero di pasti.
export const parseSlotPlan = (text = '') => {
  const blocks = text.replace(/\r/g, '').split(/\n\s*\n+|\n\s*\+\s*\n|\n\s*(?:più|piu|inoltre)\s*\n/i)
    .flatMap((b) => (!b.includes('\n') && /\d.*\s\+\s.*\d/.test(b) ? b.split(/\s\+\s/) : [b]));
  const groups = [];
  for (const block of blocks) {
    const options = [];
    let pool = null;
    for (const rawLine of block.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;
      const pm = line.replace(/^[\s•*\-]+/, '').match(POOL_RE);
      if (pm) { pool = { key: `pool${groups.length}`, max: Number(pm[1]) }; continue; }
      // protegge le note tra parentesi prima di spezzare le alternative
      const held = [];
      const safe = line.replace(/\[[^\]]*\]|\([^)]*\)/g, (m) => { held.push(m); return `\u0001${held.length - 1}\u0001`; });
      const parts = safe.split(/;|\s+oppure\s+|\s+o\s+(?!\d)|\s*\/\s+|\s\/\s|(?<=[a-zà-ù])\/(?=\s?[a-zà-ù])/i).map((p) => p.trim()).filter(Boolean);
      let shared = null; // quantità condivisa dalle alternative senza numero
      const lineStart = options.length;
      for (const part of parts) {
        const restored = part.replace(/\u0001(\d+)\u0001/g, (_, i) => held[Number(i)]);
        let opt = parseOption(restored);
        if (!opt) continue;
        if (opt.qty > 0) shared = { qty: opt.qty, unit: opt.unit };
        else if (shared && !/^(un|una|uno|\d)/i.test(restored)) { opt = { ...opt, qty: shared.qty, unit: shared.unit }; }
        if (pool) opt.pool = pool;
        options.push(opt);
      }
      // "evitiamo la soia" scritto alla fine di una riga con più alternative vale per tutte
      const avoidAll = [...new Set(options.slice(lineStart).flatMap((o) => o.avoid || []))];
      if (avoidAll.length) options.slice(lineStart).forEach((o) => { o.avoid = avoidAll; });
    }
    if (options.length) groups.push({ options });
  }
  return groups;
};

const HEADINGS = [
  ['Colazione', /^colazione/i],
  ['Spuntino 1', /^(spuntino (del )?(mattina|metà mattina|mattino)|spuntino 1|break|metà mattina)/i],
  ['Spuntino 2', /^(merenda|spuntino (del )?(pomeriggio|pomeridiano)|spuntino 2)/i],
  ['Pranzo', /^pranzo/i],
  ['Cena', /^cena/i],
  ['Spuntino 1', /^spuntino/i],
];

// Piano completo incollato: riconosce i titoli dei pasti e restituisce il testo di ciascuno
export const splitFullPlan = (text = '') => {
  const out = {};
  let cur = null;
  let spuntini = 0;
  for (const line of text.replace(/\r/g, '').split('\n')) {
    const t = line.trim().replace(/^[#*\s-]+/, '');
    const h = HEADINGS.find(([, re]) => re.test(t));
    if (h && t.length < 40 && /^[^\d]*:?\s*$/.test(t.replace(/\(.*?\)/g, ''))) {
      let slot = h[0];
      if (slot === 'Spuntino 1' && /^spuntino\s*$/i.test(t.replace(/:/, '').trim())) { spuntini++; slot = spuntini > 1 ? 'Spuntino 2' : 'Spuntino 1'; }
      cur = slot;
      out[cur] = out[cur] || '';
      continue;
    }
    // "Colazione: 150 g yogurt oppure 30 g pane" sulla stessa riga
    const inline = HEADINGS.find(([, re]) => re.test(t)) && t.match(/^[A-Za-zÀ-ÿ ]+:\s*(.+)$/);
    if (inline) { const h2 = HEADINGS.find(([, re]) => re.test(t)); cur = h2[0]; out[cur] = (out[cur] ? `${out[cur]}\n\n` : '') + inline[1]; continue; }
    if (cur) out[cur] += `${line}\n`;
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
};

export const describeOption = (o) => {
  const dose = o.qty > 0 ? `${o.upTo ? 'fino a ' : ''}${o.qty % 1 ? o.qty.toFixed(1).replace('.', ',') : o.qty} ${o.unit === 'q.b.' ? '' : o.unit} ${o.name}`.replace(/\s+/g, ' ').trim() : o.name;
  return o.extra ? `${dose} + ${o.extra}` : dose;
};

// Etichetta breve con le restrizioni settimanali, per l'anteprima
export const optionLimits = (o) => [o.maxPerWeek ? `max ${o.maxPerWeek} ${o.maxPerWeek === 1 ? 'volta' : 'volte'} a settimana` : '', o.pool ? `con le altre dell'elenco max ${o.pool.max} volte a settimana` : ''].filter(Boolean).join(', ');

// ---- abbinamento alle ricette

const GENERIC = { frutt: { group: 'fruit' }, verdur: { group: 'veg' }, ortagg: { group: 'veg' }, cereal: { group: 'carb' }, legum: { food: ['legumi'] }, carn: { food: ['carne-bianca', 'carne-rossa'] }, pesc: { food: ['pesce'] }, formagg: { food: ['formaggi'] } };
// Espressioni di due parole che non si capiscono dai singoli termini
const PHRASES = { 'frutta fresca': { group: 'fruit' }, 'frutta secca': { food: ['frutta-secca'] }, 'verdure cotte': { group: 'veg' }, 'cioccolato fondente': { words: ['cioccolato fondente', 'cioccolato'] } };
const foodWords = (id) => FOOD_TYPES.find((f) => f.id === id)?.words || [];

export const optionMatches = (opt, ing) => {
  const name = (ing.name || '').toLowerCase();
  if ((opt.avoid || []).some((w) => norm(name).includes(w))) return false;
  const phrase = PHRASES[norm(opt.name).split(' ').slice(0, 2).join(' ')];
  if (phrase) {
    if (phrase.group) {
      if (phrase.group === 'fruit' && norm(opt.name).startsWith('frutta fresca') && /datter|uvetta|secc|marmellat|confettur|succo|sciropp|cocco/.test(name)) return false; // la frutta fresca non è secca né in vasetto
      return (ing.group || guessGroup(ing.name)) === phrase.group;
    }
    if (phrase.words) return phrase.words.some((w) => name.includes(w));
    return phrase.food.some((f) => foodWords(f).some((w) => name.includes(w)));
  }
  const o = tokens(opt.name);
  if (!o.length) return false;
  const i = tokens(ing.name);
  if (o.every((t) => i.includes(t))) return true;
  const g = GENERIC[o[0]];
  if (o.length === 1 && g) {
    if (g.group) return (ing.group || guessGroup(ing.name)) === g.group;
    return g.food.some((f) => foodWords(f).some((w) => name.includes(w)));
  }
  return false;
};

const compatUnit = (a, b) => a === b || (['g', 'ml'].includes(a) && ['g', 'ml'].includes(b));

// Per ogni gruppo del piano: l'opzione che la ricetta rispetta e gli ingredienti che la soddisfano
export const planMatches = (recipe, groups) => {
  const used = new Set();
  return (groups || []).map((g) => {
    for (const opt of g.options) {
      const idx = (recipe.ingredients || []).map((ing, k) => (!used.has(k) && optionMatches(opt, ing) ? k : -1)).filter((k) => k >= 0);
      if (idx.length) { idx.forEach((k) => used.add(k)); return { option: opt, idx }; }
    }
    return null;
  });
};

export const coveredGroupIndexes = (recipe, groups) => planMatches(recipe, groups).map((m, gi) => (m ? gi : -1)).filter((gi) => gi >= 0);

// Dosi: gli ingredienti che corrispondono al piano prendono la quantità indicata dalla nutrizionista
export const applyPlanDoses = (ingredients, groups) => {
  const out = ingredients.map((i) => ({ ...i }));
  const matches = planMatches({ ingredients: out }, groups);
  for (const m of matches) {
    if (!m || !(m.option.qty > 0)) continue;
    const compat = m.idx.filter((k) => compatUnit(out[k].unit, m.option.unit) && out[k].qty > 0);
    const total = compat.reduce((a, k) => a + out[k].qty, 0);
    if (!total) continue;
    const factor = m.option.qty / total;
    compat.forEach((k) => { out[k].qty *= factor; });
  }
  return out;
};

// Una scelta del piano è adatta a una persona? (dieta e intolleranze, stimate dal nome)
const MEAT = /\b(pollo|manzo|maiale|vitello|tacchino|prosciutto|pancetta|salsiccia|speck|bresaola|agnello|carne|bistecca|coniglio|salame|mortadella)\b/i;
const FISH = /\b(tonno|salmone|merluzzo|gamberi|pesce|orata|branzino|acciughe|alici|sgombro|sardine|trota|calamari)\b/i;
const VEGETARIAN = /\b(latte|yogurt|formaggio|parmigiano|ricotta|mozzarella|uova|uovo|burro|miele|panna|feta|pecorino|grana|mascarpone|fiocchi di latte|skyr)\b/i;
export const foodDiet = (name) => (MEAT.test(name) ? 'omnivore' : FISH.test(name) ? 'pescetarian' : VEGETARIAN.test(name) && !/\b(di soia|vegetale|di avena|di mandorla|di riso|di cocco)\b/i.test(name) ? 'vegetarian' : 'vegan');
