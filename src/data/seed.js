// Ricettario precaricato: tutti i file JSON della cartella recipes. Uguale per tutti; in app si possono
// modificare o eliminare (le modifiche stanno nel nucleo e non toccano questi file).
const files = import.meta.glob('./recipes/*.json', { eager: true });

export const SEED_RECIPES = Object.values(files)
  .flatMap((m) => m.default)
  .map((r) => ({ ...r, seed: true }));

export const SEED_IDS = new Set(SEED_RECIPES.map((r) => r.id));
