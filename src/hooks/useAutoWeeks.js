import React from 'react';
import { useData, usePlans } from '../hooks/data.jsx';
import { addWeeks, getWeekId } from '../lib/dates.js';
import { generateWeek } from '../lib/planGen.js';
import { buildRecency } from '../lib/usage.js';

// Settimane tenute sempre pianificate in anticipo (3: la corrente e le due successive). Quando ne passa una, se ne aggiunge una in fondo.
export const HORIZON_WEEKS = 3;

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

// Generazione in un worker (thread separato); se il browser non lo supporta si ricade sul thread principale
let worker = null;
let sentRecipes = null;
let seq = 0;
const pending = new Map();
const getWorker = () => {
  if (worker !== null) return worker;
  try {
    worker = new Worker(new URL('../workers/weekGen.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => { const p = pending.get(e.data.id); pending.delete(e.data.id); if (p) (e.data.error ? p.reject(new Error(e.data.error)) : p.resolve(e.data.days)); };
    worker.onerror = () => { worker = false; pending.forEach((p) => p.reject(new Error('worker'))); pending.clear(); };
  } catch { worker = false; }
  return worker;
};
const generate = (recipes, household, favorites, recency) => {
  const w = getWorker();
  if (!w) return Promise.resolve(generateWeek(recipes, household, { favorites, recency }));
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    const send = recipes !== sentRecipes ? recipes : undefined; // le ricette si inviano solo quando cambiano
    sentRecipes = recipes;
    w.postMessage({ id, recipes: send, household, favorites: [...favorites], recency: [...recency] });
  }).catch(() => generateWeek(recipes, household, { favorites, recency }));
};

// Una settimana alla volta, a intervalli, così l'app resta sempre reattiva; ogni settimana si tenta una sola volta per sessione
// (se la scrittura fallisce non si riprova in continuazione).
export function useAutoWeeks() {
  const { me, household, recipes, favorites, createWeek } = useData();
  const { plans, synced } = usePlans();
  const tried = React.useRef(new Set());
  const sig = React.useMemo(() => householdSignature(household), [household]);
  const latest = React.useRef({});
  latest.current = { household, recipes, favorites, plans, sig, createWeek };
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!synced || !me || !household || !recipes.length) return undefined;
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
        const days = await generate(rr, hh, ff, buildRecency(pp.filter((p) => p.id !== todo), todo));
        await create(todo, days, ss);
      } catch (e) { console.error(e); }
      setTick((t) => t + 1);
    }, tick === 0 ? 1200 : 2500); // si parte dopo che l'app è comparsa e si va piano: la prima interazione ha la precedenza
    return () => clearTimeout(timer);
  }, [synced, me?.id, recipes.length, sig, tick, plans.length]);
}
