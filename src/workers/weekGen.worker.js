// Genera le settimane in un thread a parte, così l'app resta fluida mentre prepara i mesi in anticipo.
import { generateWeek } from '../lib/planGen.js';

let recipes = [];
self.onmessage = (e) => {
  const { id, recipes: r, household, favorites, recency } = e.data;
  if (r) recipes = r;
  try {
    const days = generateWeek(recipes, household, { favorites: new Set(favorites), recency: new Map(recency) });
    self.postMessage({ id, days });
  } catch (err) {
    self.postMessage({ id, error: String(err?.message || err) });
  }
};
