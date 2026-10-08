// Genera le settimane in un thread a parte, così l'app resta fluida mentre prepara i mesi in anticipo.
import { generateWeekChecked } from '../lib/planGen.js';
import '../lib/seasonsData.js';

let recipes = [];
self.onmessage = (e) => {
  const { id, recipes: r, household, favorites, recency, existing, month } = e.data;
  if (r) recipes = r;
  try {
    const { days, problems } = generateWeekChecked(recipes, household, { favorites: new Set(favorites), recency: new Map(recency), existing, month });
    self.postMessage({ id, days, problems });
  } catch (err) {
    self.postMessage({ id, error: String(err?.message || err) });
  }
};
