// Prova dell'accorpamento delle righe della spesa
import { sumIngredients, formatQty } from '../src/lib/scale.js';
import { applyPantry, setStock } from '../src/lib/pantry.js';
let ko = 0;
const check = (c, m) => { if (!c) { ko++; console.log('KO', m); } };
const row = (list, re) => list.filter((r) => re.test(r.name));
const sum = (...items) => sumIngredients([items.map(([name, qty, unit]) => ({ name, qty, unit, group: 'other' }))]);

let l = sum(['Pomodori', 200, 'g'], ['pomodoro fresco', 100, 'g'], ['Pomodori maturi', 1, 'pz']);
check(row(l, /omodor/).length === 1 && row(l, /omodor/)[0].qty === 400, 'pomodori in una riga da 400 g: ' + JSON.stringify(l));
l = sum(['Olio extravergine d\'oliva', 2, 'cucchiai'], ['olio extravergine di oliva', 30, 'ml'], ['Olio extravergine d\'oliva', 1, 'cucchiaini']);
check(l.length === 1 && l[0].unit === 'ml' && l[0].qty === 58, 'olio: cucchiai, cucchiaini e ml insieme ' + JSON.stringify(l));
l = sum(['Uova', 2, 'pz'], ['uovo', 100, 'g']);
check(l.length === 1 && l[0].unit === 'g' && l[0].qty === 210, 'uova: pezzi e grammi ' + JSON.stringify(l));
l = sum(['Cipolla', 1, 'pz'], ['cipolle', 2, 'pz']);
check(l.length === 1 && l[0].qty === 3 && l[0].unit === 'pz', 'cipolle in pezzi ' + JSON.stringify(l));
l = sum(['Latte', 200, 'ml'], ['latte', 100, 'g']);
check(l.length === 1 && l[0].qty === 300, 'latte ml e g ' + JSON.stringify(l));
l = sum(['Sale', 0, 'q.b.'], ['sale', 5, 'g']);
check(l.length === 1 && l[0].unit === 'g', 'sale q.b. e grammi ' + JSON.stringify(l));
l = sum(['Curcuma', 1, 'cucchiaini'], ['curcuma', 1, 'cucchiai']);
check(l.length === 1 && l[0].unit === 'cucchiai' && Math.abs(l[0].qty - 4 / 3) < 0.01, 'curcuma cucchiaini e cucchiai ' + JSON.stringify(l));
l = sum(['Farina 00', 100, 'g'], ['Farina integrale', 50, 'g']);
check(l.length === 2, 'ingredienti diversi restano separati');
l = sum(['Pomodori', 200, 'g'], ['Pomodori pelati', 100, 'g']);
check(l.length === 2, 'pelati restano separati');
l = sum(['Ceci cotti', 150, 'g'], ['Ceci secchi', 50, 'g']);
check(l.length === 2, 'ceci cotti e secchi separati');
l = sum(['Cipolla', 1, 'pz'], ['Cipolla', 80, 'g']);
check(l.length === 1 && l[0].qty === 160, 'cipolla pezzo e grammi ' + JSON.stringify(l));
l = sum(['Foglie di basilico', 5, 'foglie'], ['basilico', 3, 'foglie']);
check(l.length === 2 || l.length === 1, 'basilico non crasha');
check(formatQty(58, 'ml') === '60 ml', 'formato');

// dispensa con quantità parziali: se ne hai 500 g di ceci cotti e ne servono 650, in lista restano 150 g
{
  const list = [{ name: 'Ceci cotti', qty: 650, unit: 'g', group: 'protein' }, { name: 'Uova', qty: 3, unit: 'pz', group: 'protein' }];
  let r = applyPantry(list, [{ id: '1', name: 'Ceci cotti', qty: 500, unit: 'g', always: false }]);
  const ceci = r.needed.find((x) => /ceci/i.test(x.name));
  check(ceci && ceci.qty === 150 && ceci.have === 500, 'ceci: ne mancano 150 g ' + JSON.stringify(r.needed));
  r = applyPantry(list, [{ id: '1', name: 'Ceci cotti', qty: 700, unit: 'g', always: false }]);
  check(!r.needed.some((x) => /ceci/i.test(x.name)) && r.covered.some((x) => /ceci/i.test(x.name)), 'ceci coperti da 700 g');
  r = applyPantry(list, [{ id: '1', name: 'Uova', qty: 110, unit: 'g', always: false }]);
  const uova = r.needed.find((x) => /uova/i.test(x.name));
  check(uova && uova.qty < 3 && uova.qty > 0, 'uova in grammi sottratte da una voce in pezzi ' + JSON.stringify(uova));
  const st = setStock([{ id: '1', name: 'ceci cotti', qty: 100, unit: 'g' }, { id: '2', name: 'Ceci cotti', qty: 50, unit: 'g' }], { name: 'Ceci cotti', unit: 'g' }, 500);
  check(st.save.id === '1' && st.save.qty === 500 && st.remove.join() === '2', 'impostare la scorta aggiorna una voce e toglie i doppioni');
  check(setStock([{ id: '1', name: 'Ceci cotti', qty: 100, unit: 'g' }], { name: 'Ceci cotti', unit: 'g' }, 0).remove.join() === '1', 'quantità zero toglie la scorta');
  check(setStock([], { name: 'Lenticchie', unit: 'g' }, 200).save.qty === 200, 'nuova scorta');
}
console.log(ko ? ko + ' problemi' : 'Tutto ok.');
process.exit(ko ? 1 : 0);
