import React from 'react';
import { APPLIANCES, applianceStats } from '../lib/appliances.js';
import { Toggle } from './ui.jsx';

// Cosa c'è in cucina: le ricette che richiedono ciò che manca non vengono proposte.
// Si mostrano solo gli elettrodomestici che almeno una ricetta richiede davvero. value: elenco di id posseduti, o undefined (= tutto).
export default function AppliancePicker({ recipes, value, onChange }) {
  const stats = React.useMemo(() => applianceStats(recipes), [recipes]);
  const list = APPLIANCES.filter((a) => stats[a.id]);
  const owned = value ?? list.map((a) => a.id);
  const set = (id, on) => {
    const next = on ? [...new Set([...owned, id])] : owned.filter((x) => x !== id);
    onChange(list.every((a) => next.includes(a.id)) ? undefined : next);
  };
  return (
    <div className="space-y-2">
      {list.map((a) => {
        const on = owned.includes(a.id);
        return <Toggle key={a.id} on={on} onChange={(v) => set(a.id, v)} label={a.label} hint={on ? a.hint : `Senza, escludo ${stats[a.id]} ${stats[a.id] === 1 ? 'ricetta' : 'ricette'}`} />;
      })}
      <p className="text-[11px] text-slate-400 pt-1">Fornelli e padelle li do per scontati. Una ricetta che propone un'alternativa (per esempio "in forno o in padella") resta valida.</p>
    </div>
  );
}
