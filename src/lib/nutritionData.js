// Carica nell'app le tabelle dei valori nutrizionali (src/data/nutrition/*.json) solo quando servono
import { setNutrition } from './nutrition.js';

const files = import.meta.glob('../data/nutrition/*.json', { eager: false });
let loading = null;
export const loadNutrition = () => {
  if (!loading) loading = Promise.all(Object.values(files).map((load) => load())).then((mods) => setNutrition(mods.flatMap((m) => m.default)));
  return loading;
};
