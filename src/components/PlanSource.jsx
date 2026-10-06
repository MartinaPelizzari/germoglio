import React from 'react';
import BodyForm, { bodyComplete } from './BodyForm.jsx';
import { Confirm } from './ui.jsx';
import { computeNeeds } from '../lib/needs.js';
import { buildAutoPlan } from '../lib/autoPlan.js';
import { SLOTS } from '../lib/meals.js';
import { mealOf } from '../lib/scale.js';
import { mealsFromTexts } from './PlanImport.jsx';
import { useData } from '../hooks/data.jsx';

// Riepilogo di fabbisogni e avvertenze, usato in onboarding e nel profilo
export function NeedsSummary({ needs, estKcal }) {
  const gap = estKcal && Math.abs(estKcal - needs.kcal) > needs.kcal * 0.08;
  return (
    <div className="space-y-2">
      {!needs.hideNumbers && (
        <div className="bg-brand-50 rounded-2xl p-4 text-sm text-brand-900 space-y-1">
          <p><b>Energia stimata:</b> circa {needs.kcal} kcal al giorno (metabolismo basale {needs.bmr}, attività {String(needs.pal).replace('.', ',')}{needs.workout ? `, allenamenti +${needs.workout}` : ''}).</p>
          <p><b>Proteine:</b> circa {needs.protein} g · <b>fibra:</b> almeno {needs.fiber} g · carboidrati 45-60% e grassi 20-35% dell'energia.</p>
          {gap && <p className="text-xs">Il piano copre circa {estKcal} kcal: per arrivare al tuo fabbisogno aggiungi uno spuntino o aumenta le porzioni.</p>}
        </div>
      )}
      {needs.notes.map((n) => <p key={n} className="text-xs text-slate-500">{n}</p>)}
      {needs.watch.length > 0 && <p className="text-xs text-slate-500">Con la tua dieta conviene tenere d'occhio: {needs.watch.join(', ')}. Prima di prendere integratori parlane con il medico o con un dietista.</p>}
    </div>
  );
}

// Piano e parametri per la dieta equilibrata (testi e piano già letto) a partire dal profilo
export const autoPlanFor = (member) => {
  const needs = computeNeeds({ ...member.body, diet: member.diet });
  if (needs.blocked) return { needs };
  const eaten = SLOTS.filter((s) => mealOf(member, s).eats);
  const plan = buildAutoPlan({ diet: member.diet, intolerances: member.intolerances || [], kcal: needs.kcal, protein: needs.protein, eaten, tweaks: member.tweaks });
  return { needs, ...plan };
};

// "Hai un piano alimentare o vuoi che creiamo insieme la dieta giusta per te?"
// Con il piano della nutrizionista non si fanno domande: il piano è già fatto su misura.
export default function PlanSource({ member, onChange }) {
  const { refreshFutureWeeks } = useData();
  const source = member.planSource || '';
  const [ask, setAsk] = React.useState(false);
  const body = member.body || { workouts: 0 };
  const result = React.useMemo(() => (source === 'auto' && bodyComplete(body) ? autoPlanFor({ ...member, body }) : null), [source, member.body, member.tweaks, member.diet, member.intolerances, member.visibleSlots]);
  const btn = (on) => `w-full p-3.5 rounded-2xl text-left active:scale-95 ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-600'}`;
  const apply = () => {
    if (!result?.texts) return;
    onChange({ ...member, body, autoPlan: true, meals: mealsFromTexts(result.texts, member.meals) });
    refreshFutureWeeks();
    setAsk(false);
  };
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-800">Hai un piano alimentare o vuoi che creiamo insieme la dieta giusta per te?</p>
      <div className="space-y-2">
        <button aria-pressed={source === 'nutritionist'} onClick={() => onChange({ ...member, planSource: 'nutritionist', autoPlan: false })} className={btn(source === 'nutritionist')}>
          <b className="block">Ho il piano di una nutrizionista</b><span className="text-xs opacity-80">Lo seguo alla lettera: non ti faccio domande e non lo modifico.</span>
        </button>
        <button aria-pressed={source === 'auto'} onClick={() => onChange({ ...member, planSource: 'auto' })} className={btn(source === 'auto')}>
          <b className="block">Creiamo insieme la dieta giusta per me</b><span className="text-xs opacity-80">Ti chiedo peso, altezza e abitudini e preparo un piano equilibrato.</span>
        </button>
      </div>
      {source === 'auto' && (
        <div className="space-y-4 pt-2">
          <BodyForm body={body} onChange={(b) => onChange({ ...member, body: b })} />
          {result?.needs?.blocked && <p className="text-sm text-amber-800 bg-amber-50 rounded-2xl p-4">{result.needs.blocked.text}</p>}
          {result?.texts && (
            <>
              <NeedsSummary needs={result.needs} estKcal={result.estKcal} />
              <button onClick={() => (member.autoPlan ? setAsk(true) : apply())} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl active:scale-95">{member.autoPlan ? 'Ricalcola il piano' : 'Crea il piano'}</button>
              <p className="text-[11px] text-slate-400">Sono stime generali, non una prescrizione medica o dietetica. Dopo averlo creato puoi modificare ogni pasto qui sotto.</p>
            </>
          )}
        </div>
      )}
      {ask && <Confirm title="Ricalcolare il piano?" msg="I piani dei pasti vengono sostituiti con quelli nuovi: le modifiche fatte a mano a mano si perdono." confirmLabel="Ricalcola" onCancel={() => setAsk(false)} onConfirm={apply} />}
    </div>
  );
}
