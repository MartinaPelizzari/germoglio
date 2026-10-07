// Stagionalità di frutta e verdura in Italia (src/data/seasons.json, fonti in docs/stagionalita.md).
// Una ricetta con un ortaggio o un frutto importante fuori stagione perde punti nella scelta dei menu: più qualità e meno spesa.
// I dati si caricano a parte (seasonsData.js nell'app, direttamente nelle prove da terminale).
import { weekIdToMonday } from './usage.js';

const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const stem = (w) => (w.length > 3 && /[aeio]$/.test(w) ? w.slice(0, -1) : w);
const words = (s) => norm(s).split(' ').filter(Boolean).map(stem);
// prodotti lavorati o conservati: non seguono la stagione
const PROCESSED = /secch|sott|conserv|surgel|congel|essicc|passata|concentrato|succo|marmellat|confettur|polpa|pelati|sciropp|in polvere|cott[oaie]\b|lessat|affumic|farina|fiocchi|crema di/;

let entries = [];
// i mesi si allargano di uno prima e uno dopo: il calendario è indicativo (il Sud e il Nord hanno stagioni diverse) e si penalizza solo il chiaramente fuori stagione
const widen = (months) => [...new Set(months.flatMap((m) => [((m + 10) % 12) + 1, m, (m % 12) + 1]))];
export const setSeasons = (list) => { entries = list.map((e) => ({ words: words(e.name), months: widen(e.months) })).filter((e) => e.words.length); };
export const seasonsCount = () => entries.length;

// mese (1-12) di una settimana "2026-W41": si usa il giovedì, come fa l'ISO per assegnare la settimana
export const monthOfWeek = (weekId) => { const d = weekIdToMonday(weekId); d.setUTCDate(d.getUTCDate() + 3); return d.getUTCMonth() + 1; };

// true / false se l'ingrediente è di stagione nel mese, null se non lo sappiamo
export const inSeason = (name, month) => {
  if (!entries.length || PROCESSED.test(norm(name))) return null;
  const iw = new Set(words(name));
  let best = null;
  for (const e of entries) if (e.words.every((w) => iw.has(w)) && (!best || e.words.length > best.words.length)) best = e;
  return best ? best.months.includes(month) : null;
};

const grams = (i) => (['g', 'ml'].includes(i.unit) ? i.qty : i.unit === 'pz' ? i.qty * 100 : 0);
// ortaggi e frutta importanti della ricetta (almeno 60 g) che sono fuori stagione nel mese
export const outOfSeason = (recipe, month) => (recipe.ingredients || []).filter((i) => ['veg', 'fruit'].includes(i.group) && grams(i) >= 60 && inSeason(i.name, month) === false).map((i) => i.name);
