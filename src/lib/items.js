import { foodDiet } from './dietPlan.js';
import { GROUPS } from './groups.js';

// Un piatto del piano è una ricetta oppure un alimento semplice preso dal piano della nutrizionista
// (es. "yogurt 150 g"). Gli alimenti semplici si trattano come ricette di un solo ingrediente.
export const resolveItem = (item, recipeMap) => {
  if (item?.food) {
    const f = item.food;
    return {
      id: `food:${f.name}`, own: false, isFood: true, title: f.name,
      emoji: GROUPS.find((g) => g.id === f.group)?.emoji || '🍽️', diet: foodDiet(f.name),
      ingredients: [{ name: f.name, qty: f.qty > 0 ? f.qty : 1, unit: f.unit && f.unit !== 'q.b.' ? f.unit : 'g', group: f.group || 'other' }],
      steps: [], takeaway: true,
    };
  }
  return recipeMap.get(item?.recipeId);
};
