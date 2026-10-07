import React from 'react';
import { isDayBalanced } from '../lib/day.js';

// Come rispettare le quantità del piano alimentare: pasto per pasto oppure nell'arco della giornata
export default function BalanceMode({ member, onChange }) {
  const day = isDayBalanced(member);
  const btn = (on) => `flex-1 py-2.5 rounded-xl text-xs font-bold active:scale-95 ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`;
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Come rispettare le quantità del piano</p>
      <div className="flex gap-2">
        <button onClick={() => onChange({ ...member, balance: 'meal' })} aria-pressed={!day} className={btn(!day)}>Per ogni pasto</button>
        <button onClick={() => onChange({ ...member, balance: 'day' })} aria-pressed={day} className={btn(day)}>Nell'arco della giornata</button>
      </div>
      <p className="text-[11px] text-slate-400 mt-2">
        {day
          ? 'Le quantità di tutti i pasti formano un unico budget del giorno: puoi mangiare, per esempio, un frutto a colazione al posto di quello dello spuntino, oppure spostare il pane di colazione a pranzo. I pasti si regolano di conseguenza.'
          : 'Ogni pasto rispetta le quantità scritte per quel pasto, senza spostamenti fra un pasto e l\'altro.'}
      </p>
    </div>
  );
}
