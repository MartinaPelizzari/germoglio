import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useData } from '../hooks/data.jsx';
import { Sheet } from '../components/ui.jsx';
import { STAPLES } from '../lib/pantry.js';
import { UNITS } from '../lib/groups.js';

// Dispensa: ciò che hai già in casa. La lista della spesa lo sottrae.
// "Ce l'ho sempre" (sale, olio...) copre qualunque quantità; le scorte con quantità vanno aggiornate a mano.
export default function Pantry({ onClose }) {
  const { pantry, savePantryItem, deletePantryItem } = useData();
  const [form, setForm] = React.useState({ name: '', qty: '', unit: 'g', always: false });
  const sorted = [...pantry].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  const have = new Set(pantry.filter((p) => p.always).map((p) => p.name.toLowerCase()));

  const add = () => {
    if (!form.name.trim()) return;
    savePantryItem({ name: form.name.trim(), always: form.always, qty: form.always ? 0 : Number(form.qty) || 0, unit: form.always ? 'q.b.' : form.unit });
    setForm({ name: '', qty: '', unit: form.unit, always: form.always });
  };

  return (
    <Sheet title="Dispensa" onClose={onClose} full>
      <div className="p-5 space-y-5">
        <p className="text-sm text-slate-500">Quello che segni qui viene tolto dalla lista della spesa. Non si aggiorna da solo quando cucini: correggi le quantità quando serve.</p>

        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
          <input className="w-full p-3 bg-white rounded-xl border-none focus:ring-2 focus:ring-brand-500" placeholder="Es. Ceci cotti" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Nome" />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={form.always} onChange={(e) => setForm({ ...form, always: e.target.checked })} /> Ce l'ho sempre (sale, olio, spezie...)</label>
          {!form.always && (
            <div className="flex gap-2">
              <input type="number" inputMode="decimal" className="flex-1 p-3 bg-white rounded-xl border-none" placeholder="Quantità" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} aria-label="Quantità" />
              <select className="w-1/3 p-3 bg-white rounded-xl border-none" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} aria-label="Unità">{UNITS.filter((u) => u !== 'q.b.').map((u) => <option key={u}>{u}</option>)}</select>
            </div>
          )}
          <button onClick={add} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl active:scale-95 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Aggiungi</button>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Scorte di base</p>
          <div className="flex flex-wrap gap-2">
            {STAPLES.filter((s) => !have.has(s.toLowerCase())).map((s) => (
              <button key={s} onClick={() => savePantryItem({ name: s, always: true, qty: 0, unit: 'q.b.' })} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 active:scale-95">+ {s}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {sorted.length === 0 && <p className="text-center text-slate-300 py-6">La dispensa è vuota</p>}
          {sorted.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl">
              <span className="flex-1 font-medium text-slate-700">{p.name}</span>
              {p.always
                ? <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-lg">Sempre</span>
                : (
                  <div className="flex items-center gap-1">
                    <input type="number" inputMode="decimal" className="w-20 text-right bg-slate-50 rounded-lg p-1.5 text-sm" value={p.qty} onChange={(e) => savePantryItem({ ...p, qty: Number(e.target.value) || 0 })} aria-label={`Quantità di ${p.name}`} />
                    <span className="text-xs text-slate-400 w-10">{p.unit}</span>
                  </div>
                )}
              <button onClick={() => deletePantryItem(p.id)} aria-label={`Elimina ${p.name}`} className="p-2 text-red-400 rounded-full"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
