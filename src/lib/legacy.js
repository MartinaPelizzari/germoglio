import { guessGroup } from './groups.js';

// Converte una ricetta della vecchia app (quantità separate Martina/Carmen, procedura in un blocco di testo)
// nel formato nuovo: la quantità di riferimento è quella della prima persona che l'ha compilata.
export const convertLegacyRecipe = (old) => {
  const steps = (old.procedure || '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    title: old.title || 'Senza titolo',
    category: old.category || 'Pranzo',
    time: old.time || 'media',
    minutes: null,
    emoji: old.emoji || null,
    diet: null,
    photo: null,
    notes: '',
    source: null,
    steps,
    ingredients: (old.ingredients || []).map((i) => {
      const qty = parseFloat(i.qtyM) || parseFloat(i.qtyC) || 0;
      const unit = i.unit === 'gr' ? 'g' : i.unit || 'g';
      return { name: i.name || '', qty: unit === 'q.b.' ? 0 : qty, unit, group: guessGroup(i.name) };
    }),
  };
};
