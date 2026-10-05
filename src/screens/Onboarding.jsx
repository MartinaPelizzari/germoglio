import React from 'react';
import { newProfile } from '../hooks/data.jsx';
import { Avatar } from '../components/ui.jsx';

import { DIETS } from '../lib/diet.js';

export default function Onboarding({ user, index = 0, freeProfiles = [], onClaim, onDone }) {
  const [name, setName] = React.useState((user.displayName || '').split(' ')[0] || '');
  const [diet, setDiet] = React.useState('vegetarian');
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 bg-surface-ground pt-safe pb-safe">
      <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-soft space-y-5 animate-fade-in">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900">Ciao!</h1>
          <p className="text-sm text-slate-500 mt-1">Per configurare il tuo profilo personale mi servono il tuo nome e la dieta che segui.</p>
        </div>
        {freeProfiles.length > 0 && (
          <div className="bg-brand-50 rounded-2xl p-4 space-y-2">
            <p className="text-sm text-brand-800 font-semibold">Qualcuno ha già creato un profilo per te? Toccalo e diventa tuo.</p>
            {freeProfiles.map((p) => (
              <button key={p.id} onClick={() => onClaim(p.id)} className="w-full bg-white rounded-xl p-2.5 flex items-center gap-3 text-left active:scale-95">
                <Avatar member={p} size="w-9 h-9 text-lg" /><span className="font-bold text-slate-700">{p.name || 'Senza nome'}</span>
              </button>
            ))}
            <p className="text-xs text-slate-500">Altrimenti crea un nuovo profilo qui sotto.</p>
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Come ti chiami?</label>
          <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500 font-bold" value={name} onChange={(e) => setName(e.target.value)} placeholder="Il tuo nome" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Che dieta segui?</label>
          <div className="space-y-2">
            {DIETS.map((d) => (
              <button key={d.id} onClick={() => setDiet(d.id)} className={`w-full p-3 rounded-xl text-left font-semibold ${diet === d.id ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-600'}`}>{d.label}</button>
            ))}
          </div>
        </div>
        <button disabled={!name.trim()} onClick={() => onDone(newProfile(user.uid, name.trim(), diet, index))} className="w-full py-4 bg-brand-600 text-white font-display font-bold rounded-2xl shadow-glow active:scale-95 disabled:opacity-50">
          Inizia
        </button>
      </div>
    </div>
  );
}
