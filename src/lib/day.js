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
export const parseKey = (key) => { const [slot, gi] = key.split('|'); return { slot, gi: Number(gi) }; };

// Un gruppo si può spostare in un altro pasto solo se ha almeno una quantità
export const movable = (group) => group.options.some((o) => o.qty > 0);

export const isDayBalanced = (member) => member?.balance === 'day';

// Tutti i gruppi del piano di una persona nella giornata, nell'ordine dei pasti
export const dayInstances = (member) =>
  SLOTS.flatMap((slot) => {
    const m = mealOf(member, slot);
    return m.eats ? m.plan.map((group, gi) => ({ key: instanceKey(slot, gi), slot, gi, group })) : [];
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
  return consumed;
};

// Quanto resta da mangiare oggi: gruppi non ancora consumati
export const remainingInstances = (member, consumed) => dayInstances(member).filter((i) => !consumed.has(i.key));
