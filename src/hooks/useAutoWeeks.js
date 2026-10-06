import React from 'react';
import { useData } from '../hooks/data.jsx';
import { addWeeks, getWeekId } from '../lib/dates.js';
import { generateWeek } from '../lib/planGen.js';
import { buildRecency } from '../lib/usage.js';

// Settimane tenute sempre pianificate in anticipo (circa 4 mesi). Quando ne passa una, se ne aggiunge una in fondo.
export const HORIZON_WEEKS = 16;

// Prepara in automatico le settimane mancanti, una alla volta, tenendo conto di quelle già pianificate per non ripetere i piatti.
// Non tocca mai una settimana che esiste già.
export function useAutoWeeks() {
  const { me, household, recipes, favorites, plans, plansLoaded, createWeek } = useData();
  const running = React.useRef(false);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!plansLoaded || !me || !household || !recipes.length || running.current) return;
    const have = new Set(plans.map((p) => p.id));
    const missing = Array.from({ length: HORIZON_WEEKS }, (_, i) => getWeekId(addWeeks(new Date(), i))).filter((id) => !have.has(id));
    if (!missing.length) return;
    running.current = true;
    (async () => {
      const list = [...plans];
      try {
        for (const id of missing) {
          await new Promise((r) => setTimeout(r, 30)); // lascia respirare l'interfaccia
          const days = generateWeek(recipes, household, { favorites, recency: buildRecency(list, id) });
          list.push({ id, days });
          await createWeek(id, days);
        }
      } finally { running.current = false; setTick((t) => t + 1); }
    })();
  }, [plansLoaded, plans, me?.id, household, recipes.length, tick]);
}
