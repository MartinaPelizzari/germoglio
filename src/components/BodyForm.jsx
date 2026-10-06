import React from 'react';

const WORK = [
  { id: 'sedentary', label: 'Seduto', hint: 'ufficio, studio, guida' },
  { id: 'light', label: 'In piedi o in movimento', hint: 'negozio, scuola, giri in casa' },
  { id: 'active', label: 'Faticoso', hint: 'cantiere, magazzino, assistenza fisica' },
];
const GOALS = [
  { id: 'maintain', label: 'Mantenere il peso' },
  { id: 'lose', label: 'Perdere peso gradualmente' },
  { id: 'gain', label: 'Aumentare di peso o massa muscolare' },
];
const INTENSITY = [
  { id: 'light', label: 'Leggero', hint: 'camminata, yoga' },
  { id: 'moderate', label: 'Moderato', hint: 'corsa lenta, bici, palestra' },
  { id: 'intense', label: 'Intenso', hint: 'sport di squadra, HIIT, gare' },
];

// Domande per proporre una dieta equilibrata a chi non ha un piano scritto da un nutrizionista
export default function BodyForm({ body, onChange }) {
  const set = (patch) => onChange({ ...body, ...patch });
  const chip = (on) => `px-3 py-2.5 rounded-xl text-sm font-bold active:scale-95 ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-600'}`;
  const label = 'block text-[10px] font-bold text-slate-400 uppercase mb-2';
  const input = 'w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-brand-500 font-bold';
  return (
    <div className="space-y-5">
      <div>
        <p className={label}>Sesso (serve per i calcoli)</p>
        <div className="flex gap-2">{[['F', 'Donna'], ['M', 'Uomo']].map(([v, l]) => <button key={v} onClick={() => set({ sex: v })} aria-pressed={body.sex === v} className={`flex-1 ${chip(body.sex === v)}`}>{l}</button>)}</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={label} htmlFor="b-age">Età</label><input id="b-age" type="number" inputMode="numeric" min="14" max="99" className={input} value={body.age ?? ''} onChange={(e) => set({ age: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="anni" /></div>
        <div><label className={label} htmlFor="b-h">Altezza</label><input id="b-h" type="number" inputMode="numeric" min="120" max="220" className={input} value={body.height ?? ''} onChange={(e) => set({ height: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="cm" /></div>
        <div><label className={label} htmlFor="b-w">Peso</label><input id="b-w" type="number" inputMode="decimal" min="30" max="250" className={input} value={body.weight ?? ''} onChange={(e) => set({ weight: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="kg" /></div>
      </div>
      <div>
        <p className={label}>Com'è la tua giornata di lavoro o di studio?</p>
        <div className="space-y-2">{WORK.map((w) => <button key={w.id} onClick={() => set({ work: w.id })} aria-pressed={body.work === w.id} className={`w-full text-left ${chip(body.work === w.id)}`}>{w.label}<span className="block text-[11px] font-normal opacity-70">{w.hint}</span></button>)}</div>
      </div>
      <div>
        <p className={label}>Allenamenti a settimana</p>
        <div className="flex gap-1.5">{[0, 1, 2, 3, 4, 5, 6].map((n) => <button key={n} onClick={() => set({ workouts: n })} aria-pressed={body.workouts === n} className={`flex-1 ${chip(body.workouts === n)}`}>{n}</button>)}</div>
        {body.workouts > 0 && (
          <div className="mt-3 space-y-3">
            <div>
              <p className={label}>Durata media di un allenamento</p>
              <div className="flex gap-2">{[30, 45, 60, 90].map((m) => <button key={m} onClick={() => set({ minutes: m })} aria-pressed={body.minutes === m} className={`flex-1 ${chip(body.minutes === m)}`}>{m}'</button>)}</div>
            </div>
            <div>
              <p className={label}>Intensità</p>
              <div className="space-y-2">{INTENSITY.map((i) => <button key={i.id} onClick={() => set({ intensity: i.id })} aria-pressed={body.intensity === i.id} className={`w-full text-left ${chip(body.intensity === i.id)}`}>{i.label}<span className="block text-[11px] font-normal opacity-70">{i.hint}</span></button>)}</div>
            </div>
          </div>
        )}
      </div>
      <div>
        <p className={label}>Il tuo obiettivo</p>
        <div className="space-y-2">{GOALS.map((g) => <button key={g.id} onClick={() => set({ goal: g.id })} aria-pressed={body.goal === g.id} className={`w-full text-left ${chip(body.goal === g.id)}`}>{g.label}</button>)}</div>
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs text-slate-500">Per la tua sicurezza (facoltativo ma importante):</p>
        <label className="flex items-start gap-3 text-sm text-slate-700"><input type="checkbox" className="w-5 h-5 mt-0.5 accent-emerald-500" checked={!!body.pregnant} onChange={(e) => set({ pregnant: e.target.checked })} /> Sono in gravidanza o allatto</label>
        <label className="flex items-start gap-3 text-sm text-slate-700"><input type="checkbox" className="w-5 h-5 mt-0.5 accent-emerald-500" checked={!!body.condition} onChange={(e) => set({ condition: e.target.checked })} /> Ho una patologia che richiede una dieta specifica (es. diabete, celiachia, malattie renali)</label>
        <label className="flex items-start gap-3 text-sm text-slate-700"><input type="checkbox" className="w-5 h-5 mt-0.5 accent-emerald-500" checked={!!body.edHistory} onChange={(e) => set({ edHistory: e.target.checked })} /> Ho avuto, o ho, difficoltà nel rapporto con il cibo</label>
      </div>
    </div>
  );
}

export const bodyComplete = (b = {}) => ['F', 'M'].includes(b.sex) && b.age >= 14 && b.height >= 120 && b.weight >= 30 && b.work && b.workouts !== undefined && b.goal && (b.workouts === 0 || (b.minutes && b.intensity));
