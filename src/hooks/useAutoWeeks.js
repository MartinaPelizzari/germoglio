import React from 'react';
import { useData } from '../hooks/data.jsx';
import { addWeeks, getWeekId } from '../lib/dates.js';
import { generateWeek } from '../lib/planGen.js';
import { buildRecency } from '../lib/usage.js';

// Settimane tenute sempre pianificate in anticipo (circa 4 mesi). Quando ne passa una, se ne aggiunge una in fondo.
export const HORIZON_WEEKS = 16;

// Impronta di tutto ciò che influisce sui pasti: persone, diete, piani alimentari, pasti condivisi, regole.
// Se cambia, le settimane proposte dall'app e mai toccate a mano si rifanno da sole.
export const householdSignature = (household) => {
  if (!household) return '';
  const members = household.members.map((m) => [m.id, m.diet, m.intolerances, m.avoid, m.visibleSlots, m.balance, m.goals, m.mult, m.meals]);
  const text = JSON.stringify([members, household.sharedSlots, household.rules]);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return String(h >>> 0);
};

// Una settimana alla volta, a intervalli, così l'app resta sempre reattiva; ogni settimana si tenta una sola volta per sessione
// (se la scrittura fallisce non si riprova in continuazione).
export function useAutoWeeks() {
  const { me, household, recipes, favorites, plans, plansLoaded, createWeek } = useData();
  const tried = React.useRef(new Set());
  const sig = React.useMemo(() => householdSignature(household), [household]);
  const latest = React.useRef({});
  latest.current = { household, recipes, favorites, plans, sig, createWeek };
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!plansLoaded || !me || !household || !recipes.length) return undefined;
    const timer = setTimeout(async () => {
      const { household: hh, recipes: rr, favorites: ff, plans: pp, sig: ss, createWeek: create } = latest.current;
      const have = new Map(pp.map((p) => [p.id, p]));
      const ids = Array.from({ length: HORIZON_WEEKS }, (_, i) => getWeekId(addWeeks(new Date(), i)));
      const todo = ids.find((id) => {
        if (tried.current.has(`${id}|${ss}`)) return false;
        const p = have.get(id);
        return !p || (p.auto === true && p.sig !== ss);
      });
      if (!todo) return;
      tried.current.add(`${todo}|${ss}`);
      try {
        const days = generateWeek(rr, hh, { favorites: ff, recency: buildRecency(pp.filter((p) => p.id !== todo), todo) });
        await create(todo, days, ss);
      } catch (e) { console.error(e); }
      setTick((t) => t + 1);
    }, tick === 0 ? 400 : 800);
    return () => clearTimeout(timer);
  }, [plansLoaded, me?.id, recipes.length, sig, tick, plans.length]);
}
