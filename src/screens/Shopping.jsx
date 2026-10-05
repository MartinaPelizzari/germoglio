import React from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Home, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { db } from '../firebase.js';
import { useData, useWeekPlan } from '../hooks/data.jsx';
import { Sheet } from '../components/ui.jsx';
import Pantry from './Pantry.jsx';
import { applyPantry } from '../lib/pantry.js';
import { addWeeks, getWeekId, weekRangeLabel } from '../lib/dates.js';
import { GROUPS, UNITS } from '../lib/groups.js';
import { buildShoppingList } from '../lib/shopping.js';
import { formatQty, ingredientKey, normalizeIngredient, sumIngredients } from '../lib/scale.js';

const DAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Shopping({ weekDate, setWeekDate, days, setDays, viewMode }) {
  const { hid, household, me, recipeMap, pantry, savePantryItem } = useData();
  const personal = viewMode === 'me' && me;
  const weekId = getWeekId(weekDate);
  const { plan } = useWeekPlan(hid, weekId);
  const [checked, setChecked] = React.useState({});
  const [extras, setExtras] = React.useState([]);
  const [adding, setAdding] = React.useState(false);
  const [pantryOpen, setPantryOpen] = React.useState(false);
  const [showCovered, setShowCovered] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', qty: '', unit: 'g' });

  React.useEffect(() => {
    const u1 = onSnapshot(doc(db, 'households', hid, 'shopping', weekId), (s) => setChecked(s.exists() ? s.data() : {}));
    const u2 = onSnapshot(query(collection(db, 'households', hid, 'shoppingExtras'), where('weekId', '==', weekId)), (s) => setExtras(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); };
  }, [hid, weekId]);

  const items = React.useMemo(() => {
    const fromPlan = buildShoppingList({ plan, days, recipeMap, household, onlyMemberId: personal ? me.id : undefined });
    const fromExtras = extras.map((e) => ({ ...normalizeIngredient(e), group: 'extra', extraId: e.id }));
    return sumIngredients([fromPlan, fromExtras]).map((i) => ({ ...i, group: fromExtras.some((e) => ingredientKey(e) === i.key) && !fromPlan.some((p) => ingredientKey(p) === i.key) ? 'extra' : i.group }));
  }, [plan, days, recipeMap, household, extras, personal, me]);

  const { needed, covered } = React.useMemo(() => applyPantry(items, pantry), [items, pantry]);
  const sections = [...GROUPS, { id: 'extra', label: 'Aggiunti a mano', emoji: '✍️' }]
    .map((g) => ({ ...g, items: needed.filter((i) => i.group === g.id).sort((a, b) => a.name.localeCompare(b.name, 'it')) }))
    .filter((s) => s.items.length);

  const toggle = (key) => setDoc(doc(db, 'households', hid, 'shopping', weekId), { [key.replace(/[./]/g, '_')]: !checked[key.replace(/[./]/g, '_')] }, { merge: true }).catch(console.error);
  const isChecked = (key) => !!checked[key.replace(/[./]/g, '_')];

  const addExtra = () => {
    if (!form.name.trim()) return;
    addDoc(collection(db, 'households', hid, 'shoppingExtras'), { weekId, name: form.name.trim(), qty: Number(form.qty) || 0, unit: form.unit, createdAt: new Date().toISOString() }).catch(console.error);
    setForm({ name: '', qty: '', unit: form.unit });
  };

  const toggleDay = (d) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());

  return (
    <div className="flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-extrabold text-2xl text-slate-900">Spesa</h2>
          <button onClick={() => setPantryOpen(true)} className="px-3 py-1.5 bg-white rounded-full shadow-sm text-xs font-bold text-slate-600 flex items-center gap-1.5 active:scale-95"><Package className="w-3.5 h-3.5" /> Dispensa</button>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
          <button onClick={() => setWeekDate(addWeeks(weekDate, -1))} aria-label="Settimana precedente"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
          <span className="text-xs font-bold text-slate-600">{weekRangeLabel(weekDate)}</span>
          <button onClick={() => setWeekDate(addWeeks(weekDate, 1))} aria-label="Settimana successiva"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
        </div>
      </div>
      <div className="flex justify-between mb-4 px-1" role="group" aria-label="Giorni da includere">
        {DAY_LABELS.map((d, idx) => <button key={idx} onClick={() => toggleDay(idx)} aria-pressed={days.includes(idx)} className={`w-10 h-10 rounded-full font-bold text-xs shadow-sm active:scale-95 ${days.includes(idx) ? 'bg-brand-500 text-white scale-110' : 'bg-white text-slate-400'}`}>{d}</button>)}
      </div>

      <div className="bg-white rounded-[32px] shadow-soft p-3 pb-24 relative min-h-[50vh]">
        {sections.length === 0 ? (
          <div className="text-center text-slate-300 mt-16"><ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" /><p>Niente da comprare</p><p className="text-xs mt-1">{covered.length ? 'Hai già tutto in dispensa' : 'Pianifica dei pasti o aggiungi un prodotto'}</p></div>
        ) : sections.map((s) => (
          <div key={s.id} className="mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-1">{s.emoji} {s.label}</h3>
            {s.items.map((i) => (
              <label key={i.key} className="flex items-center p-3 rounded-2xl cursor-pointer active:bg-slate-50">
                <input type="checkbox" className="w-6 h-6 rounded-lg mr-4 accent-emerald-500" checked={isChecked(i.key)} onChange={() => toggle(i.key)} />
                <span className={`flex-1 font-medium ${isChecked(i.key) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{cap(i.name)}</span>
                {i.unit !== 'q.b.' && <span className={`font-bold px-3 py-1 rounded-lg text-sm ${isChecked(i.key) ? 'bg-slate-100 text-slate-400' : 'bg-brand-50 text-brand-600'}`}>{formatQty(i.qty, i.unit)}{i.have ? <span className="font-normal text-[10px] text-slate-400"> (hai {formatQty(i.have, i.unit)})</span> : null}</span>}
                <button onClick={(e) => { e.preventDefault(); savePantryItem({ name: i.name, always: false, qty: i.qty + (i.have || 0), unit: i.unit === 'q.b.' ? 'g' : i.unit }); }} aria-label={`Ce l'ho già: ${i.name}`} title="Ce l'ho già" className="ml-2 p-2 text-slate-300 active:text-brand-600"><Home className="w-4 h-4" /></button>
              </label>
            ))}
          </div>
        ))}
        {covered.length > 0 && (
          <div className="mt-2 border-t border-slate-100 pt-3 px-3">
            <button onClick={() => setShowCovered(!showCovered)} className="text-xs font-bold text-slate-400">{showCovered ? 'Nascondi' : 'Mostra'} {covered.length} già in dispensa</button>
            {showCovered && covered.map((i) => <p key={i.key} className="text-sm text-slate-400 py-1.5 flex justify-between"><span>{i.name}</span><span className="text-xs">{i.why}</span></p>)}
          </div>
        )}
        <button onClick={() => setAdding(true)} aria-label="Aggiungi prodotto" className="fixed bottom-28 right-6 bg-brand-500 text-white p-4 rounded-full shadow-glow active:scale-90 z-10"><Plus className="w-6 h-6" /></button>
      </div>

      {pantryOpen && <Pantry onClose={() => setPantryOpen(false)} />}
      {adding && (
        <Sheet title="Aggiungi prodotto" onClose={() => setAdding(false)}>
          <div className="p-5 space-y-4">
            <input className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-brand-500" placeholder="Es. Latte di avena" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Nome prodotto" />
            <div className="flex gap-3">
              <input type="number" inputMode="decimal" className="flex-1 p-3 bg-slate-50 rounded-xl border-none" placeholder="Quantità" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} aria-label="Quantità" />
              <select className="w-1/3 p-3 bg-slate-50 rounded-xl border-none" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} aria-label="Unità">{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
            </div>
            <button onClick={addExtra} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl active:scale-95">Aggiungi alla lista</button>
            {extras.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Aggiunti a mano</h4>
                {extras.map((e) => (
                  <div key={e.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-sm">
                    <span className="font-medium text-slate-700">{e.name}</span>
                    <div className="flex items-center gap-1"><span className="text-slate-500 text-xs">{e.qty ? `${e.qty} ${e.unit}` : ''}</span><button onClick={() => deleteDoc(doc(db, 'households', hid, 'shoppingExtras', e.id))} aria-label={`Rimuovi ${e.name}`} className="text-red-400 p-3 rounded-full"><Trash2 className="w-5 h-5" /></button></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}
