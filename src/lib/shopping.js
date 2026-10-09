import { eatersOf, householdOnDay, mealOfItem, scaleRecipe, sumIngredients } from './scale.js';
import { resolveItem } from './items.js';

// Costruisce la lista della spesa dai pasti pianificati: per ogni piatto somma le dosi di chi lo mangia.
// onlyMemberId: per la vista personale, conta solo le dosi di quella persona
export const buildShoppingList = ({ plan, days, recipeMap, household, onlyMemberId }) => {
  const lists = [];
  for (const day of days) {
    const daySlots = plan?.days?.[day] || {};
    const hh = householdOnDay(household, Number(day), daySlots); // chi per schema salta un pasto non entra nella spesa di quel pasto
    for (const [slot, data] of Object.entries(daySlots)) {
      const entries = data?.items || [];
      for (const item of entries) {
        const recipe = resolveItem(item, recipeMap);
        if (!recipe) continue;
        for (const member of eatersOf(item, hh, slot, data)) {
          if (onlyMemberId && member.id !== onlyMemberId) continue;
          lists.push(scaleRecipe(recipe, mealOfItem(member, slot, item)));
        }
      }
    }
  }
  return sumIngredients(lists);
};

