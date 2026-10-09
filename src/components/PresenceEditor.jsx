import React from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Sheet } from './ui.jsx';
import { DAYS } from '../lib/dates.js';
import { SLOTS } from '../lib/scale.js';

// Giorni in forma leggibile: "lun-ven", "sab e dom", "lun, mer"
export const daysLabel = (days = []) => {
  const d = [...days].sort((a, b) => a - b);
  if (d.length === 7) return 'ogni giorno';
  if (d.join() === '0,1,2,3,4') return 'lun-ven';
  if (d.join() === '5,6') return 'sab e dom';
  return d.map((x) => DAYS[x].toLowerCase()).join(', ');
};

// Schemi ricorrenti di presenza ai pasti: "questo pasto non lo mangio in questi giorni".
// Salvati nel profilo (member.away); il singolo giorno si corregge dal Planner.
export default function PresenceEditor({ member, onChange }) {
  const rules = member.away || [];
  const [edit, setEdit] = React.useState(null); // regola in modifica
  const save = (r) => {
    const exists = rules.some((x) => x.id === r.id);
    onChange({ ...member, away: exists ? rules.map((x) => (x.id === r.id ? r : x)) : [...rules, r] });
    setEdit(null);
  };
  const chip = (on) => `px-3 py-2 rounded-xl text-xs font-bold active:scale-95 ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`;
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-display font-bold text-lg text-slate-800">Presenza ai pasti</h4>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Se in certi giorni salti un pasto (per esempio pranzi con la famiglia solo nel weekend), segnalo qui: quel pasto non viene pianificato per {member.name || 'questa persona'}, non conta nelle quantità, nella spesa e negli obiettivi settimanali. Il singolo giorno si cambia dal Planner.</p>
      </div>
      {rules.length === 0 && <p className="text-xs text-slate-400 bg-slate-50 rounded-2xl p-4">Nessuno schema: {member.name || 'questa persona'} è presente a tutti i pasti previsti.</p>}
      <div className="space-y-2">
        {rules.map((r) => (
          <button key={r.id} onClick={() => setEdit(r)} className="w-full bg-slate-50 p-3.5 rounded-2xl flex items-center gap-3 text-left active:scale-[0.99]">
            <div className="flex-1 min-w-0"><p className="font-bold text-slate-800">Non mangia: {r.slots.map((s) => s.toLowerCase()).join(', ')}</p><p className="text-xs text-slate-400">{daysLabel(r.days)}</p></div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
        ))}
      </div>
      <button onClick={() => setEdit({ id: crypto.randomUUID(), slots: ['Pranzo'], days: [0, 1, 2, 3, 4] })} className="w-full py-3 bg-white border border-dashed border-slate-300 rounded-2xl text-sm font-bold text-slate-600 flex items-center justify-center gap-1.5 active:scale-[0.98]"><Plus className="w-4 h-4" /> Aggiungi uno schema</button>
      {edit && (
        <Sheet title="Pasti che salti" onClose={() => setEdit(null)} z={85}>
          <div className="p-5 space-y-5">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Quali pasti non mangi</p>
              <div className="flex flex-wrap gap-2">{SLOTS.map((s) => { const on = edit.slots.includes(s); return <button key={s} aria-pressed={on} onClick={() => setEdit({ ...edit, slots: on ? edit.slots.filter((x) => x !== s) : SLOTS.filter((x) => x === s || edit.slots.includes(x)) })} className={chip(on)}>{s}</button>; })}</div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">In quali giorni</p>
              <div className="flex gap-1.5">{DAYS.map((d, i) => { const on = edit.days.includes(i); return <button key={d} aria-pressed={on} onClick={() => setEdit({ ...edit, days: on ? edit.days.filter((x) => x !== i) : [...edit.days, i].sort() })} className={`flex-1 py-2.5 rounded-xl text-xs font-bold active:scale-95 ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{d}</button>; })}</div>
              <div className="flex gap-2 mt-2">
                {[['Lun-Ven', [0, 1, 2, 3, 4]], ['Sab e Dom', [5, 6]], ['Ogni giorno', [0, 1, 2, 3, 4, 5, 6]]].map(([l, v]) => <button key={l} onClick={() => setEdit({ ...edit, days: v })} className="px-3 py-1.5 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 active:scale-95">{l}</button>)}
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-2xl p-3">{edit.slots.length && edit.days.length ? `Non mangia ${edit.slots.map((s) => s.toLowerCase()).join(', ')}: ${daysLabel(edit.days)}.` : 'Scegli almeno un pasto e un giorno.'}</p>
            <div className="grid grid-cols-2 gap-2">
              {rules.some((x) => x.id === edit.id) ? <button onClick={() => { onChange({ ...member, away: rules.filter((x) => x.id !== edit.id) }); setEdit(null); }} className="py-3 bg-red-50 text-red-600 font-bold rounded-2xl active:scale-95">Elimina</button> : <button onClick={() => setEdit(null)} className="py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-95">Annulla</button>}
              <button disabled={!edit.slots.length || !edit.days.length} onClick={() => save(edit)} className="py-3 bg-brand-600 text-white font-bold rounded-2xl disabled:opacity-40 active:scale-95">Salva</button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
