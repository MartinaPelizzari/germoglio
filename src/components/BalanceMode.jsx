import React from 'react';
import { isDayBalanced } from '../lib/day.js';

// Come rispettare le quantità del piano alimentare: pasto per pasto oppure nell'arco della giornata
export default function BalanceMode({ member, onChange }) {
  const day = isDayBalanced(member);
  const btn = (on) => `flex-1 py-2.5 rounded-xl text-xs font-bold active:scale-95 ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`;
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Aderenza al piano</p>
      <div className="flex gap-2">
        <button onClick={() => onChange({ ...member, balance: 'meal' })} aria-pressed={!day} className={btn(!day)}>Esatta per pasto</button>
        <button onClick={() => onChange({ ...member, balance: 'day' })} aria-pressed={day} className={btn(day)}>Giornaliera</button>
      </div>
      <p className="text-[11px] text-slate-400 mt-2">
        {day
          ? 'Conta il totale del giorno: i gruppi si possono spostare fra i pasti (per esempio il frutto dello spuntino a colazione) e il totale deve tornare esattamente con il piano. Se nessuna combinazione lo permette, l\'app lo segnala invece di proporre un menu che sfora.'
          : 'Ogni pasto rispetta esattamente i gruppi e le quantità scritti per quel pasto, senza spostamenti.'}
      </p>
    </div>
  );
}
