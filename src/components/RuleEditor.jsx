import React from 'react';
import { Trash2 } from 'lucide-react';
import { Sheet } from './ui.jsx';
import { SLOTS } from '../lib/scale.js';
import { DIETS } from '../lib/diet.js';
import { DAYS } from '../lib/dates.js';

const CAPS = [{ id: null, label: 'Nessun limite' }, ...DIETS.slice(0, 3).map((d) => ({ id: d.id, label: `Tutti ${d.label.toLowerCase().replace(/a$/, 'i')}` }))];

export default function RuleEditor({ rule, onChange, onDelete, onClose, personal = false }) {
  const toggle = (key, v) => onChange({ ...rule, [key]: rule[key].includes(v) ? rule[key].filter((x) => x !== v) : [...rule[key], v].sort() });
  return (
    <Sheet title={personal ? 'Regola personale' : 'Regola condivisa'} onClose={onClose}>
      <div className="p-5 space-y-5">
        <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500 font-bold" value={rule.label} onChange={(e) => onChange({ ...rule, label: e.target.value })} placeholder="Nome (es. Pranzo d'asporto in settimana)" aria-label="Nome regola" />
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Pasti</p>
          <div className="flex gap-2 flex-wrap">{SLOTS.map((s) => <button key={s} onClick={() => toggle('slots', s)} className={`px-3 py-2 rounded-xl text-xs font-bold ${rule.slots.includes(s) ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{s}</button>)}</div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Giorni</p>
          <div className="flex gap-1.5">{DAYS.map((d, i) => <button key={d} onClick={() => toggle('days', i)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${rule.days.includes(i) ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{d}</button>)}</div>
        </div>
        {!personal && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">In questi pasti mangiano</p>
          <div className="space-y-2">{CAPS.map((c) => <button key={String(c.id)} onClick={() => onChange({ ...rule, dietCap: c.id })} className={`w-full p-3 rounded-xl text-left font-semibold ${rule.dietCap === c.id ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-600'}`}>{c.label}</button>)}</div>
          <p className="text-xs text-slate-400 mt-2">Chi segue una dieta più ampia si adegua a quella scelta, così si cucina un solo piatto per tutti.</p>
        </div>
        )}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cucina una volta, mangia più volte</p>
          <div className="flex gap-2">{(personal ? [1, 2, 3, 5, 7] : [1, 2, 3]).map((n) => <button key={n} onClick={() => onChange({ ...rule, batch: n })} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${(rule.batch || 1) === n ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{n === 1 ? 'Ogni giorno diverso' : n === 7 ? 'Sempre lo stesso' : `Stesso per ${n} giorni`}</button>)}</div>
          <p className="text-xs text-slate-400 mt-2">Con "Proponi" il piatto torna come avanzo nei giorni successivi della regola.</p>
        </div>
        {rule.slots.includes('Pranzo') && (
          <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl font-semibold text-slate-700"><input type="checkbox" className="w-5 h-5 mt-0.5 accent-emerald-500" checked={!!rule.leftoverDinner} onChange={(e) => onChange({ ...rule, leftoverDinner: e.target.checked })} /> <span>Pranzo con gli avanzi della cena di ieri<span className="block text-xs font-normal text-slate-400">La cena viene scelta adatta al pranzo del giorno dopo (anche d'asporto, se la regola lo chiede).</span></span></label>
        )}
        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl font-semibold text-slate-700"><input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={rule.takeaway} onChange={(e) => onChange({ ...rule, takeaway: e.target.checked })} /> Piatti d'asporto (da portare in contenitore)</label>
        <button onClick={onDelete} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-2xl flex items-center justify-center gap-2 active:scale-95"><Trash2 className="w-4 h-4" /> Elimina regola</button>
      </div>
    </Sheet>
  );
}


