// Prova di pasti condivisi / individuali, pasti da vedere e familiari aggiunti a un pasto individuale
import fs from 'node:fs';
import { generateWeek } from '../src/lib/planGen.js';
import { eatersOf, mealOf, slotPeople } from '../src/lib/scale.js';
import { menuClusters } from '../src/lib/diet.js';
import { resolveItem } from '../src/lib/items.js';

const dir = new URL('../src/data/recipes/', import.meta.url);
const recipes = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')));
const map = new Map(recipes.map((r) => [r.id, r]));
let ko = 0;
const check = (c, m) => { if (!c) { ko++; console.log('KO', m); } };

const house = {
  members: [
    { id: 'm', name: 'Martina', diet: 'vegetarian', meals: {} },
    { id: 'a', name: 'Mamma', diet: 'omnivore', visibleSlots: ['Pranzo', 'Cena'], meals: {} },
    { id: 's', name: 'Sorella', diet: 'omnivore', meals: {} },
  ],
  rules: [],
  sharedSlots: ['Pranzo', 'Cena'],
};

// 1. chi vede cosa
check(!mealOf(house.members[1], 'Colazione').eats, 'Mamma non vede la colazione');
check(mealOf(house.members[1], 'Pranzo').eats, 'Mamma vede il pranzo');
console.log('Colazione, persone:', slotPeople(house, 'Colazione').map((p) => p.name).join(', '), '| Cena:', slotPeople(house, 'Cena').map((p) => p.name).join(', '));

// 2. menu: individuali a colazione, condivisi (per dieta) a cena
const bf = menuClusters(house, 0, 'Colazione', slotPeople(house, 'Colazione'), undefined);
const dn = menuClusters(house, 0, 'Cena', slotPeople(house, 'Cena'), undefined);
console.log('Colazione →', bf.map((c) => c.eaters.map((e) => e.name).join('+')).join(' | '), '  Cena →', dn.map((c) => c.eaters.map((e) => e.name).join('+')).join(' | '));
check(bf.length === 2 && bf.every((c) => c.eaters.length === 1), 'colazione individuale');
check(dn.length === 2, 'cena: due menu per dieta');

// 3. settimana: nessuno vede o mangia ciò che ha nascosto, ogni piatto individuale è di una sola persona
const days = generateWeek(recipes, house);
for (let d = 0; d < 7; d++) {
  const b = days[d].Colazione;
  check(b && b.items.every((it) => Array.isArray(it.eaters) && it.eaters.length === 1), `colazione ${d}: ogni piatto ha una persona`);
  check(!b.items.some((it) => it.eaters.includes('a')), `colazione ${d}: Mamma non c'è`);
  check(['Pranzo', 'Cena'].every((s) => days[d][s]), `pranzo e cena ${d}`);
}

// 4. familiare aggiunto al mio pasto individuale
const data = { items: [], joined: { m: ['s'] } };
const people = slotPeople(house, 'Colazione', data);
const cl = menuClusters(house, 0, 'Colazione', people, data);
console.log('Colazione con Sorella aggiunta a Martina →', cl.map((c) => c.eaters.map((e) => e.name).join('+')).join(' | '));
check(cl.length === 1 && cl[0].eaters.length === 2, 'Sorella mangia con Martina');
const days2 = generateWeek(recipes, house, { existing: { 0: { Colazione: data } } });
const it0 = days2[0].Colazione.items[0];
check(it0.eaters === undefined || (it0.eaters.includes('m') && it0.eaters.includes('s')), 'piatto condiviso da Martina e Sorella');
check(days2[0].Colazione.joined?.m?.[0] === 's', 'aggiunta conservata dopo "Proponi"');
console.log('Lunedì colazione:', days2[0].Colazione.items.map((it) => `${resolveItem(it, map).title} → ${(it.eaters || ['tutti']).join('+')}`).join(' ; '));

// 5. pasti tutti condivisi
const all = { ...house, sharedSlots: ['Colazione', 'Pranzo', 'Spuntino 1', 'Spuntino 2', 'Cena'] };
const d3 = generateWeek(recipes, all);
check(d3[0].Colazione.items.length >= 1, 'colazione condivisa');

// 5. togliere una persona da tutti i pasti vale subito sui menu già fatti, senza rigenerare
{
  const base = { ...house, members: house.members.map((m) => ({ ...m, visibleSlots: undefined })), sharedSlots: ['Pranzo', 'Cena'] };
  const week = generateWeek(recipes, base);
  const gone = { ...base, members: base.members.map((m) => (m.id === 's' ? { ...m, visibleSlots: [] } : m)) };
  let still = 0, shown = 0;
  for (const d of Object.values(week)) for (const [slot, data] of Object.entries(d)) for (const it of data.items || []) {
    if (eatersOf(it, gone, slot, data).some((e) => e.id === 's')) still++;
    if (eatersOf(it, base, slot, data).some((e) => e.id === 's')) shown++;
  }
  check(shown > 0, 'prima la sorella mangia qualcosa');
  check(still === 0, `la sorella è stata tolta da tutti i pasti ma mangia ancora ${still} piatti nei menu già fatti`);
}
console.log(ko ? `\n${ko} problemi` : '\nTutto ok.');
process.exit(ko ? 1 : 0);
