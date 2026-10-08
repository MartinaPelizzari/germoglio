import React from 'react';
import { useData, usePlans } from '../hooks/data.jsx';
import { addWeeks, getWeekId } from '../lib/dates.js';
import { generateWeekChecked } from '../lib/planGen.js';
import { buildRecency } from '../lib/usage.js';
import { monthOfWeek } from '../lib/seasons.js';

// Settimane tenute sempre pianificate in anticipo (3: la corrente e le due successive). Quando ne passa una, se ne aggiunge una in fondo.
export const HORIZON_WEEKS = 3;
// Da aumentare ogni volta che cambia il modo di generare i menu: le settimane proposte dall'app e mai toccate si rifanno con il nuovo metodo
export const GENERATOR_VERSION = 9;

// Impronta di tutto ciò che influisce sui pasti: persone, diete, piani alimentari, pasti condivisi, regole.
// Se cambia, le settimane proposte dall'app e mai toccate a mano si rifanno da sole.
export const householdSignature = (household) => {
  if (!household) return '';
  const members = household.members.map((m) => [m.id, m.diet, m.intolerances, m.avoid, m.visibleSlots, m.balance, m.goals, m.mult, m.meals]);
  const text = JSON.stringify([GENERATOR_VERSION, members, household.sharedSlots, household.rules, household.appliances ?? null]);
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
    worker.onmessage = (e) => { const p = pending.get(e.data.id); pending.delete(e.data.id); if (p) (e.data.error ? p.reject(new Error(e.data.error)) : p.resolve({ days: e.data.days, problems: e.data.problems || [] })); };
    worker.onerror = () => { worker = false; pending.forEach((p) => p.reject(new Error('worker'))); pending.clear(); };
  } catch { worker = false; }
  return worker;
};
const generate = (recipes, household, favorites, recency, existing, month) => {
  const w = getWorker();
  if (!w) return Promise.resolve(generateWeekChecked(recipes, household, { favorites, recency, existing, month }));
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    const send = recipes !== sentRecipes ? recipes : undefined; // le ricette si inviano solo quando cambiano
    sentRecipes = recipes;
    w.postMessage({ id, recipes: send, household, favorites: [...favorites], recency: [...recency], existing, month });
  }).catch(() => generateWeekChecked(recipes, household, { favorites, recency, existing, month }));
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
        const { days, problems } = await generate(rr, hh, ff, buildRecency(pp.filter((p) => p.id !== todo), todo), undefined, monthOfWeek(todo));
        await create(todo, days, ss, problems);
      } catch (e) { console.error(e); }
      setTick((t) => t + 1);
    }, tick === 0 ? 1200 : 2500); // si parte dopo che l'app è comparsa e si va piano: la prima interazione ha la precedenza
    return () => clearTimeout(timer);
  }, [synced, me?.id, recipes.length, sig, tick, plans.length]);
}

// "Rigenera settimana": rifà il menu di una settimana per tutte le persone, in base a tutte le diete (assenti e ospiti restano).
// Restituisce una funzione asincrona: l'attesa può durare qualche secondo, quindi chi la usa mostra un'animazione.
export function useRegenerateWeek() {
  const { household, recipes, favorites, writeWeek } = useData();
  const { plans } = usePlans();
  return async (weekId, existing) => {
    const { days, problems } = await generate(recipes, household, favorites, buildRecency(plans.filter((p) => p.id !== weekId), weekId), existing, monthOfWeek(weekId));
    await writeWeek(weekId, days, householdSignature(household), problems);
  };
}
