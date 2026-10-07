import React from 'react';
import { loadNutrition } from '../lib/nutritionData.js';

// Carica i valori nutrizionali e rifà il rendering quando sono pronti
export function useNutrition() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => { let on = true; loadNutrition().then(() => on && setReady(true)).catch(() => {}); return () => { on = false; }; }, []);
  return ready;
}
