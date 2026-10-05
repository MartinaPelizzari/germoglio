import React from 'react';
import { SLOTS } from '../lib/scale.js';

// Scelta di uno o più pasti (chip). Se allowEmpty è falso, almeno un pasto resta selezionato.
export default function SlotPicker({ value, onChange, allowEmpty = false }) {
  const toggle = (slot) => {
    const next = value.includes(slot) ? value.filter((s) => s !== slot) : SLOTS.filter((s) => s === slot || value.includes(s));
    if (!allowEmpty && next.length === 0) return;
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {SLOTS.map((s) => (
        <button key={s} onClick={() => toggle(s)} aria-pressed={value.includes(s)} className={`px-3 py-2 rounded-xl text-xs font-bold active:scale-95 ${value.includes(s) ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{s}</button>
      ))}
    </div>
  );
}

// "Pasti che voglio vedere": quelli non scelti non vengono mostrati né pianificati per quella persona
export function VisibleSlots({ member, onChange }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Pasti che voglio vedere</p>
      <SlotPicker value={member.visibleSlots || SLOTS} onChange={(v) => onChange({ ...member, visibleSlots: v.length === SLOTS.length ? null : v })} />
      <p className="text-[11px] text-slate-400 mt-2">Gli altri pasti non compaiono nel Planner e non entrano nella tua spesa.</p>
    </div>
  );
}
