import { foodDiet } from './dietPlan.js';
import { GROUPS } from './groups.js';
import { defaultParts } from './portions.js';
import { deriveRecipe } from './variants.js';

// Un piatto del piano è una ricetta oppure un alimento semplice preso dal piano della nutrizionista
// (es. "yogurt 150 g"). Gli alimenti semplici si trattano come ricette di un solo ingrediente.
export const resolveItem = (item, recipeMap) => {
  if (item?.food) {
    const f = item.food;
    return {
      id: `food:${f.name}`, own: false, isFood: true, title: f.name,
      emoji: GROUPS.find((g) => g.id === f.group)?.emoji || '🍽️', diet: foodDiet(f.name),
      // senza quantità nel piano si usa la porzione standard (non 1 g)
      ingredients: f.qty > 0 ? [{ name: f.name, qty: f.qty, unit: f.unit && f.unit !== 'q.b.' ? f.unit : 'g', group: f.group || 'other' }] : defaultParts(f.name, f.group || 'other'),
      steps: [], takeaway: true,
    };
  }
  const base = recipeMap.get(item?.recipeId);
  // variante derivata: la ricetta base con un'altra fonte proteica (variants.js)
  if (base && item.variant) return deriveRecipe(base, item.variant);
  return base;
};
