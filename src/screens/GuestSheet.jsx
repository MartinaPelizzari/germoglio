import React from 'react';
import { Sheet } from '../components/ui.jsx';
import { DIETS } from '../lib/diet.js';
import { ALLERGENS } from '../lib/allergens.js';

const MULTS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Ospite a un pasto: non ha un account, conta per dieta, intolleranze, dosi e spesa solo in quel pasto
export default function GuestSheet({ slot, onAdd, onClose }) {
  const [g, setG] = React.useState({ name: '', diet: 'omnivore', mult: 1, intolerances: [], avoid: '' });
  const chip = (on) => `px-3 py-2 rounded-xl text-xs font-bold ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`;
  return (
    <Sheet title={`Ospite a ${slot.toLowerCase()}`} onClose={onClose}>
      <div className="p-5 space-y-5">
        <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500 font-bold" placeholder="Nome (facoltativo)" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} aria-label="Nome ospite" />
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Dieta</p>
          <div className="grid grid-cols-2 gap-2">{DIETS.map((d) => <button key={d.id} onClick={() => setG({ ...g, diet: d.id })} className={chip(g.diet === d.id)}>{d.label}</button>)}</div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Porzione</p>
          <div className="flex gap-1.5 flex-wrap">{MULTS.map((m) => <button key={m} onClick={() => setG({ ...g, mult: m })} className={chip(g.mult === m)}>x {String(m).replace('.', ',')}</button>)}</div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Intolleranze</p>
          <div className="flex gap-2 flex-wrap">{ALLERGENS.map((a) => { const on = g.intolerances.includes(a.id); return <button key={a.id} onClick={() => setG({ ...g, intolerances: on ? g.intolerances.filter((x) => x !== a.id) : [...g.intolerances, a.id] })} className={`px-3 py-2 rounded-xl text-xs font-bold ${on ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-500'}`}>Senza {a.label.toLowerCase()}</button>; })}</div>
        </div>
        <input className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm" placeholder="Da evitare (separati da virgola)" value={g.avoid} onChange={(e) => setG({ ...g, avoid: e.target.value })} aria-label="Da evitare" />
        <button onClick={() => onAdd({ id: `g-${crypto.randomUUID()}`, name: g.name.trim() || 'Ospite', diet: g.diet, mult: g.mult, intolerances: g.intolerances, avoid: g.avoid, goals: [], emoji: '🙋', color: '#94a3b8', meals: {} })} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl active:scale-95">Aggiungi ospite</button>
      </div>
    </Sheet>
  );
}
