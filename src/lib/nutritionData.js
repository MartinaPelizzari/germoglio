// Carica nell'app le tabelle dei valori nutrizionali (src/data/nutrition/*.json)
import { setNutrition } from './nutrition.js';

const files = import.meta.glob('../data/nutrition/*.json', { eager: true });
setNutrition(Object.values(files).flatMap((m) => m.default));
