// Meal prep: se due giorni di fila il pasto ha la stessa base di carboidrati (riso, patate, pasta...), si suggerisce di cuocerne il doppio la prima sera.
import { mainCarbOf } from './planGen.js';
import { resolveItem } from './items.js';

const WORTH = /riso|patat|pasta|farro|orzo|quinoa|cous|polenta|gnocchi|ceci|lenticch/;

// days = giorni della settimana pianificata; restituisce il testo del suggerimento o null
export const prepHint = (days, d, slot, item, recipeMap) => {
  if (d < 1 || !['Pranzo', 'Cena'].includes(slot) || item.leftoverOf || item.food) return null;
  const recipe = resolveItem(item, recipeMap);
  if (!recipe) return null;
  const carb = mainCarbOf(recipe);
  if (!carb || !WORTH.test(carb)) return null;
  const yesterday = (days?.[d - 1]?.[slot]?.items || []).some((it) => { const r = resolveItem(it, recipeMap); return r && !it.food && mainCarbOf(r) === carb; });
  return yesterday ? `Stessa base di ieri (${carb}): ieri cuoci una dose doppia e risparmi tempo` : null;
};
