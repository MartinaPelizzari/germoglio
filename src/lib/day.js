// Regolazione sulla giornata.
//
// Con "rispetta le quantità della giornata" i gruppi del piano di tutti i pasti formano un budget unico del giorno:
// ogni gruppo ("frutta 250 g", "pane 60 g o fiocchi 50 g", ...) si consuma una volta sola, ma può essere mangiato in un
// pasto diverso da quello in cui è scritto. Esempi: un frutto a colazione al posto del frutto dello spuntino; niente pane
// a colazione e quei carboidrati spostati a pranzo. I gruppi senza quantità (verdure, elenchi di idee) restano del loro pasto.
import { SLOTS } from './meals.js';
import { mealOf } from './scale.js';
import { planMatches } from './dietPlan.js';

export const instanceKey = (slot, gi) => `${slot}|${gi}`;
// Un gruppo grande di frutta (es. "250 g di frutta") si può dividere in due metà fra due pasti: la chiave "Pasto|1~h1" è la prima metà,
// "Pasto|1~h2" la seconda; quando le mangi tutte e due il gruppo conta come consumato
export const parseKey = (key) => { const [base, part] = key.split('~'); const [slot, gi] = base.split('|'); return { slot, gi: Number(gi), part }; };
export const halveGroup = (group) => ({ ...group, options: group.options.map((o) => (o.qty > 0 ? { ...o, qty: o.qty / 2 } : o)) });
export const isBigFruit = (group) => group.options.some((o) => o.qty >= 150) && group.options.every((o) => !(o.qty > 0) || o.group === 'fruit');

// Un gruppo si può spostare in un altro pasto solo se ha almeno una quantità
export const movable = (group) => group.options.some((o) => o.qty > 0);

// Con un piano scritto, di default le quantità valgono per la giornata (si può mangiare la frutta a colazione e il resto allo spuntino);
// chi sceglie "per ogni pasto" le rispetta pasto per pasto. La dieta creata dall'app resta pasto per pasto.
export const isDayBalanced = (member) => member?.balance === 'day' || (!member?.balance && member?.planSource !== 'auto' && !!member?.meals && Object.values(member.meals).some((m) => m?.plan?.length));

// Tutti i gruppi del piano di una persona nella giornata, nell'ordine dei pasti
export const dayInstances = (member) =>
  SLOTS.flatMap((slot) => {
    const m = mealOf(member, slot);
    return m.eats ? m.plan.map((group, gi) => ({ key: instanceKey(slot, gi), slot, gi, group })) : [];
  });

// Come dayInstances, tenendo conto delle metà di frutta già mangiate: se una metà è stata consumata resta l'altra (dimezzata)
export const dayInstancesFor = (member, consumed = new Set()) =>
  dayInstances(member).flatMap((inst) => {
    if (!isBigFruit(inst.group) || consumed.has(inst.key)) return [inst];
    const k = inst.key;
    if (consumed.has(`${k}~h1`)) return consumed.has(`${k}~h2`) ? [inst] : [{ ...inst, key: `${k}~h2`, group: halveGroup(inst.group), part: 'h2' }];
    if (consumed.has(`${k}~h2`)) return [{ ...inst, key: `${k}~h1`, group: halveGroup(inst.group), part: 'h1' }];
    return [inst];
  });

// Gruppi che la ricetta (o l'alimento) consuma, scegliendo fra i gruppi indicati: restituisce le chiavi
export const keysCovered = (recipe, instances) => {
  const matches = planMatches(recipe, instances.map((i) => i.group));
  return instances.filter((_, i) => matches[i]).map((i) => i.key);
};

// Gruppi della giornata già consumati da una persona in base ai piatti pianificati.
// daySlots = { Pasto: { items, ... } }; resolve(item) -> ricetta; eatersOf(item, slot, data) -> persone
export const consumedKeys = (member, daySlots, resolve, eatersOf) => {
  const consumed = new Set();
  for (const [slot, data] of Object.entries(daySlots || {})) {
    for (const item of data?.items || []) {
      if (!eatersOf(item, slot, data).some((e) => e.id === member.id)) continue;
      const recipe = resolve(item);
      if (!recipe) continue;
      const explicit = item.uses?.[member.id];
      if (explicit) { explicit.forEach((k) => consumed.add(k)); continue; }
      // piatto senza indicazioni (aggiunto a mano): consuma i gruppi del proprio pasto che copre
      const own = mealOf(member, slot).plan.map((group, gi) => ({ key: instanceKey(slot, gi), group }));
      keysCovered(recipe, own).forEach((k) => consumed.add(k));
    }
  }
  // le due metà di una frutta divisa contano come il gruppo intero
  for (const k of [...consumed]) { const [base, part] = k.split('~'); if (part && consumed.has(`${base}~h1`) && consumed.has(`${base}~h2`)) consumed.add(base); }
  return consumed;
};

// Quanto resta da mangiare oggi: gruppi non ancora consumati
export const remainingInstances = (member, consumed) => dayInstances(member).filter((i) => !consumed.has(i.key));
