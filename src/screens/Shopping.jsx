import React from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { db } from '../firebase.js';
import { useData, useWeekPlan } from '../hooks/data.jsx';
import { Sheet } from '../components/ui.jsx';
import Pantry from './Pantry.jsx';
import { applyPantry, setStock } from '../lib/pantry.js';
import { addWeeks, getWeekId, weekRangeLabel } from '../lib/dates.js';
import { GROUPS, UNITS } from '../lib/groups.js';
import { buildShoppingList } from '../lib/shopping.js';
import { packNeed } from '../lib/packs.js';
import { formatQty, ingredientKey, normalizeIngredient, sumIngredients } from '../lib/scale.js';

const DAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Shopping({ weekDate, setWeekDate, days, setDays }) {
  const { hid, household, me, recipeMap, pantry, savePantryItem, deletePantryItem } = useData();
  const personal = false; // la spesa è sempre per tutto il nucleo, anche per i pasti individuali di ognuno
  const weekId = getWeekId(weekDate);
  const { plan } = useWeekPlan(hid, weekId);
  const [checked, setChecked] = React.useState({});
  const [extras, setExtras] = React.useState([]);
  const [adding, setAdding] = React.useState(false);
  const [pantryOpen, setPantryOpen] = React.useState(false);
  const [showCovered, setShowCovered] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', qty: '', unit: 'g' });
  const [haveFor, setHaveFor] = React.useState(null); // voce di cui si indica quanto se ne ha già
  const [haveQty, setHaveQty] = React.useState('');
  const applyHave = (item, qty) => {
    if (item.unit === 'q.b.') { savePantryItem({ name: item.name, always: true, qty: 0, unit: 'q.b.' }); setHaveFor(null); return; }
    const { save, remove } = setStock(pantry, item, qty);
    remove.forEach((id) => deletePantryItem(id));
    if (save) savePantryItem(save);
    setHaveFor(null);
  };

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
  const sections = [...GROUPS, { id: 'extra', label: 'Altro da comprare', emoji: '🛒' }]
    .map((g) => ({ ...g, items: needed.filter((i) => i.group === g.id).sort((a, b) => a.name.localeCompare(b.name, 'it')) }))
    .filter((s) => s.items.length);

  const toggle = (key) => setDoc(doc(db, 'households', hid, 'shopping', weekId), { [key.replace(/[./]/g, '_')]: !checked[key.replace(/[./]/g, '_')] }, { merge: true }).catch(console.error);
  const isChecked = (key) => !!checked[key.replace(/[./]/g, '_')];

  const addExtra = () => {
    if (!form.name.trim()) return;
    addDoc(collection(db, 'households', hid, 'shoppingExtras'), { weekId, name: form.name.trim(), qty: Number(form.qty) || 0, unit: Number(form.qty) > 0 ? form.unit : 'q.b.', createdAt: new Date().toISOString() }).catch(console.error);
    setForm({ name: '', qty: '', unit: form.unit });
  };

  const toggleDay = (d) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());

  return (
    <div className="flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display font-extrabold text-2xl text-slate-900">Spesa</h2>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
          <button onClick={() => setWeekDate(addWeeks(weekDate, -1))} aria-label="Settimana precedente"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
          <span className="text-xs font-bold text-slate-600">{weekRangeLabel(weekDate)}</span>
          <button onClick={() => setWeekDate(addWeeks(weekDate, 1))} aria-label="Settimana successiva"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button onClick={() => setAdding(true)} className="py-3 bg-brand-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-glow active:scale-95"><Plus className="w-4 h-4" /> Aggiungi alla lista</button>
        <button onClick={() => setPantryOpen(true)} className="py-3 bg-white text-slate-600 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95"><Package className="w-4 h-4" /> Cosa ho in casa</button>
      </div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">Giorni compresi nella spesa</p>
      <div className="flex justify-between mb-4 px-1" role="group" aria-label="Giorni da includere">
        {DAY_LABELS.map((d, idx) => <button key={idx} onClick={() => toggleDay(idx)} aria-pressed={days.includes(idx)} className={`w-10 h-10 rounded-full font-bold text-xs active:scale-95 ${days.includes(idx) ? 'bg-brand-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>{d}</button>)}
      </div>

      <div className="bg-white rounded-[32px] shadow-soft p-3 pb-8 relative min-h-[50vh]">
        {sections.length === 0 ? (
          <div className="text-center text-slate-300 mt-16"><ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" /><p>Niente da comprare</p><p className="text-xs mt-1">{covered.length ? 'Hai già tutto in dispensa' : 'Pianifica dei pasti o aggiungi un prodotto'}</p></div>
        ) : sections.map((s) => (
          <div key={s.id} className="mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-1">{s.emoji} {s.label}</h3>
            {s.items.map((i) => (
              <label key={i.key} className="flex items-center p-3 rounded-2xl cursor-pointer active:bg-slate-50">
                <input type="checkbox" className="w-6 h-6 rounded-lg mr-4 accent-emerald-500" checked={isChecked(i.key)} onChange={() => toggle(i.key)} />
                <span className={`flex-1 font-medium ${isChecked(i.key) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{cap(i.name)}
                  {(() => { const pk = !isChecked(i.key) && packNeed(i.name, i.qty, i.unit); return pk && (pk.count > 1 || pk.size >= 2 * i.qty) ? <span className="block text-[10px] font-normal text-slate-400">≈ {pk.count} {pk.count === 1 ? 'confezione' : 'confezioni'} da {pk.size} {pk.unit === 'pz' ? 'pezzi' : pk.unit}{pk.left > 0 && pk.left >= pk.size * 0.3 ? ` · avanzano circa ${pk.left} ${pk.unit === 'pz' ? 'pezzi' : pk.unit}, usali nei prossimi ${pk.shelf} giorni` : ''}</span> : null; })()}
                  {i.group !== 'extra' && <button onClick={(e) => { e.preventDefault(); setHaveFor(i); setHaveQty(i.have ? String(i.have) : ''); }} className="block mt-0.5 text-[11px] font-semibold text-brand-700 underline decoration-dotted underline-offset-2 active:opacity-60">{i.have ? 'Ne hai già ' + formatQty(i.have, i.unit) + ' · modifica' : 'Ne ho già…'}</button>}
                </span>
                {i.unit !== 'q.b.' && <span className={`font-bold px-3 py-1 rounded-lg text-sm ${isChecked(i.key) ? 'bg-slate-100 text-slate-400' : 'bg-brand-50 text-brand-600'}`}>{formatQty(i.qty, i.unit)}</span>}
              </label>
            ))}
          </div>
        ))}
        {covered.length > 0 && (
          <div className="mt-2 border-t border-slate-100 pt-3 px-3">
            <button onClick={() => setShowCovered(!showCovered)} className="text-xs font-bold text-slate-400">{showCovered ? 'Nascondi' : 'Mostra'} {covered.length} già in dispensa</button>
            {showCovered && covered.map((i) => (
              <div key={i.key} className="text-sm text-slate-400 py-1.5 flex justify-between items-center gap-2"><span className="min-w-0 truncate">{cap(i.name)}</span>
                {i.why === 'In dispensa' ? <button onClick={() => { setHaveFor({ ...i, qty: 0, have: i.qty }); setHaveQty(String(i.qty)); }} className="text-xs font-semibold text-brand-700 underline decoration-dotted shrink-0">Ne hai {formatQty(i.qty, i.unit)} · modifica</button> : <span className="text-xs shrink-0">{i.why}</span>}</div>
            ))}
          </div>
        )}
      </div>

      {haveFor && (() => {
        const total = haveFor.qty + (haveFor.have || 0);
        const qb = haveFor.unit === 'q.b.';
        return (
          <Sheet title={`${cap(haveFor.name)}: quanto ne hai?`} onClose={() => setHaveFor(null)}>
            <div className="p-5 space-y-4">
              {!qb && <p className="text-sm text-slate-500">Per questa settimana servono <b className="text-slate-700">{formatQty(total, haveFor.unit)}</b>. Scrivi quanto ne hai già in casa: la lista si aggiorna e ti dice cosa manca.</p>}
              {qb ? (
                <button onClick={() => applyHave(haveFor, 1)} className="w-full py-3 bg-brand-600 text-white font-bold rounded-2xl active:scale-95">Ce l'ho già</button>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <input autoFocus type="number" inputMode="decimal" min="0" className="flex-1 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-brand-500 text-lg font-bold" placeholder="Quantità" value={haveQty} onChange={(e) => setHaveQty(e.target.value)} aria-label={`Quantità di ${haveFor.name} che hai già`} />
                    <span className="text-slate-500 font-semibold text-sm shrink-0">{haveFor.unit}</span>
                  </div>
                  {Number(haveQty) > 0 && <p className="text-sm font-semibold text-brand-700">{Number(haveQty) >= total ? 'Hai già tutto: lo tolgo dalla lista.' : `Ti mancano ${formatQty(total - Number(haveQty), haveFor.unit)}.`}</p>}
                  <button disabled={haveQty === '' || Number(haveQty) < 0} onClick={() => applyHave(haveFor, Number(haveQty))} className="w-full py-3 bg-brand-600 text-white font-bold rounded-2xl disabled:opacity-40 active:scale-95">Salva</button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => applyHave(haveFor, total)} className="py-2.5 bg-slate-50 text-slate-600 text-sm font-bold rounded-xl active:scale-95">Ne ho abbastanza</button>
                    {haveFor.have ? <button onClick={() => applyHave(haveFor, 0)} className="py-2.5 bg-slate-50 text-red-500 text-sm font-bold rounded-xl active:scale-95">Non ne ho più</button> : <span />}
                  </div>
                </>
              )}
            </div>
          </Sheet>
        );
      })()}
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
