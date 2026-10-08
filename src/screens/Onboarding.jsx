import React from 'react';
import { newProfile, useData } from '../hooks/data.jsx';
import AppliancePicker from '../components/AppliancePicker.jsx';
import { Avatar } from '../components/ui.jsx';
import PlanImport, { mealsFromTexts } from '../components/PlanImport.jsx';
import BodyForm, { bodyComplete } from '../components/BodyForm.jsx';
import { NeedsSummary } from '../components/PlanSource.jsx';
import { DIETS } from '../lib/diet.js';
import { ALLERGENS } from '../lib/allergens.js';
import { computeNeeds } from '../lib/needs.js';
import { buildAutoPlan } from '../lib/autoPlan.js';
import { useNutrition } from '../hooks/useNutrition.js';
import { SLOTS } from '../lib/meals.js';
import { mealOf } from '../lib/scale.js';

export default function Onboarding({ user, index = 0, joined = false, freeProfiles = [], onJoin, onClaim, onDone }) {
  const [name, setName] = React.useState((user.displayName || '').split(' ')[0] || '');
  const [diet, setDiet] = React.useState('vegetarian');
  // Prima domanda: il nucleo usa già l'app? Dopo essere entrati in un nucleo si sceglie chi si è tra i profili già creati.
  const [step, setStep] = React.useState(joined ? (freeProfiles.length ? 'who' : 1) : 'ask');
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const nutritionReady = useNutrition();
  const [body, setBody] = React.useState({ workouts: 0 });
  const [intol, setIntol] = React.useState([]);
  const { recipes } = useData();
  const [appliances, setAppliances] = React.useState(undefined); // undefined = in casa c'è tutto
  const finish = (texts, extra = {}) => onDone({ ...newProfile(user.uid, name.trim(), diet, index), intolerances: intol, ...extra, meals: texts ? mealsFromTexts(texts) : {} }, appliances === undefined ? undefined : { appliances });
  const needs = React.useMemo(() => (bodyComplete(body) ? computeNeeds({ ...body, diet }) : null), [body, diet]);
  // pasti che la persona mangia: nel profilo appena creato sono tutti
  const eaten = SLOTS.filter((s) => mealOf({}, s).eats);
  const auto = React.useMemo(() => (needs && !needs.blocked ? buildAutoPlan({ diet, intolerances: intol, kcal: needs.kcal, protein: needs.protein, eaten }) : null), [needs, diet, intol, nutritionReady]);

  const join = async () => {
    setBusy(true);
    setErr('');
    try { await onJoin(code); } catch (e) { setErr(e.message || 'Non è stato possibile entrare nel nucleo.'); }
    setBusy(false);
  };

  if (step === 'ask') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 bg-surface-ground pt-safe pb-safe">
        <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-soft space-y-5 animate-fade-in">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900">Ciao!</h1>
            <p className="text-lg font-display font-bold text-slate-800 mt-3">Il tuo nucleo familiare usa già Germoglio?</p>
            <p className="text-sm text-slate-500 mt-1">Se sì, fatti dare il codice d'invito da chi lo usa già: lo trova in Impostazioni, sotto "Nucleo condiviso".</p>
          </div>
          <div className="space-y-2">
            <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500 font-mono text-lg tracking-widest uppercase text-center" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODICE" aria-label="Codice d'invito" autoCapitalize="characters" autoComplete="off" />
            {err && <p className="text-sm text-red-500">{err}</p>}
            <button disabled={!code.trim() || busy} onClick={join} className="w-full py-4 bg-brand-600 text-white font-display font-bold rounded-2xl shadow-glow active:scale-95 disabled:opacity-50">{busy ? 'Un attimo...' : 'Entra nel nucleo'}</button>
          </div>
          <button onClick={() => setStep(1)} className="w-full py-3 text-slate-600 font-bold bg-slate-50 rounded-2xl active:scale-95">No, comincio da zero</button>
        </div>
      </div>
    );
  }

  if (step === 'who') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 bg-surface-ground pt-safe pb-safe">
        <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-soft space-y-5 animate-fade-in">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900">Sei nel nucleo!</h1>
            <p className="text-sm text-slate-500 mt-1">Queste persone sono già state aggiunte. Se uno di questi profili è il tuo, toccalo: diventa tuo e potrai controllare che le informazioni siano giuste.</p>
          </div>
          <div className="space-y-2">
            {freeProfiles.map((p) => (
              <button key={p.id} onClick={() => onClaim(p.id)} className="w-full bg-slate-50 rounded-2xl p-3 flex items-center gap-3 text-left active:scale-95">
                <Avatar member={p} size="w-11 h-11 text-xl" />
                <span className="flex-1 min-w-0"><b className="block text-slate-800">{p.name || 'Senza nome'}</b><span className="text-xs text-slate-400">Tocca se sei tu</span></span>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="w-full py-3 text-slate-600 font-bold bg-white border border-slate-200 rounded-2xl active:scale-95">Nessuno di questi, creo il mio profilo</button>
        </div>
      </div>
    );
  }

  if (step === 'kitchen') {
    return (
      <div className="min-h-[100dvh] flex justify-center px-4 py-6 bg-surface-ground pt-safe pb-safe overflow-y-auto">
        <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-soft space-y-5 animate-fade-in h-fit">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900">Cosa hai in cucina?</h1>
            <p className="text-sm text-slate-500 mt-1">Non ti propongo ricette che richiedono ciò che non hai. Puoi cambiare tutto più tardi da Famiglia.</p>
          </div>
          <AppliancePicker recipes={recipes} value={appliances} onChange={setAppliances} />
          <button onClick={() => setStep('source')} className="w-full py-4 bg-brand-600 text-white font-display font-bold rounded-2xl shadow-glow active:scale-95">Avanti</button>
        </div>
      </div>
    );
  }

  if (step === 'source') {
    const opt = 'w-full p-4 rounded-2xl text-left bg-slate-50 active:scale-95';
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 bg-surface-ground pt-safe pb-safe">
        <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-soft space-y-5 animate-fade-in">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900">Come vuoi mangiare?</h1>
            <p className="text-sm text-slate-500 mt-1">Il piano alimentare serve a dosare le ricette per te.</p>
          </div>
          <div className="space-y-2">
            <button onClick={() => setStep(2)} className={opt}><b className="block text-slate-800">Ho il piano di una nutrizionista</b><span className="text-xs text-slate-500">Lo carichi in PDF o lo scrivi, e lo seguo alla lettera.</span></button>
            <button onClick={() => setStep('body')} className={opt}><b className="block text-slate-800">Non ho un piano: proponimi una dieta equilibrata</b><span className="text-xs text-slate-500">Ti chiedo peso, altezza e abitudini e calcolo le quantità adatte a te.</span></button>
            <button onClick={() => finish(null)} className={opt}><b className="block text-slate-800">Ci penso più tardi</b><span className="text-xs text-slate-500">Le ricette useranno le porzioni standard.</span></button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'body') {
    const blocked = needs?.blocked;
    return (
      <div className="min-h-[100dvh] flex justify-center px-4 py-6 bg-surface-ground pt-safe pb-safe overflow-y-auto">
        <div className="w-full max-w-sm bg-white p-5 rounded-3xl shadow-soft space-y-5 animate-fade-in h-fit">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900">Qualche dato su di te</h1>
            <p className="text-sm text-slate-500 mt-1">Servono per stimare quanta energia ti serve. Restano nel tuo profilo e non vengono condivisi con nessuno fuori dal nucleo.</p>
          </div>
          <BodyForm body={body} onChange={setBody} />
          <div>
            <p className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Intolleranze o allergie</p>
            <div className="flex gap-2 flex-wrap">{ALLERGENS.map((a) => { const on = intol.includes(a.id); return <button key={a.id} onClick={() => setIntol(on ? intol.filter((x) => x !== a.id) : [...intol, a.id])} aria-pressed={on} className={`px-3 py-2 rounded-xl text-xs font-bold ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{a.label}</button>; })}</div>
          </div>
          {blocked && <p className="text-sm text-amber-800 bg-amber-50 rounded-2xl p-4">{blocked.text}</p>}
          <button disabled={!needs || !!blocked} onClick={() => setStep('review')} className="w-full py-4 bg-brand-600 text-white font-display font-bold rounded-2xl shadow-glow active:scale-95 disabled:opacity-50">Calcola il mio piano</button>
          <button onClick={() => finish(null, { body, planSource: 'auto' })} className="w-full py-3 text-slate-600 font-bold bg-slate-50 rounded-2xl active:scale-95">Salta, userò le porzioni standard</button>
        </div>
      </div>
    );
  }

  if (step === 'review' && auto) {
    return (
      <div className="min-h-[100dvh] flex justify-center px-4 py-6 bg-surface-ground pt-safe pb-safe overflow-y-auto">
        <div className="w-full max-w-sm bg-white p-5 rounded-3xl shadow-soft space-y-4 animate-fade-in h-fit">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900">La tua dieta equilibrata</h1>
            <p className="text-sm text-slate-500 mt-1">Ho costruito un piano pasto per pasto con porzioni e frequenze delle linee guida italiane (CREA, LARN). Controllalo e cambia quello che non ti va: poi ti preparo la settimana.</p>
          </div>
          <NeedsSummary needs={needs} estKcal={auto.estKcal} />
          <PlanImport hideUpload skipLabel="Indietro" initial={auto.texts} applyLabel="Crea la settimana con questo piano" onApply={(t) => finish(t, { body, autoPlan: true, planSource: 'auto' })} onSkip={() => setStep('body')} />
          <p className="text-[11px] text-slate-400">Sono stime generali, non una prescrizione medica o dietetica. Se hai patologie o dubbi, rivolgiti a un professionista.</p>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-[100dvh] flex justify-center px-4 py-6 bg-surface-ground pt-safe pb-safe overflow-y-auto">
        <div className="w-full max-w-sm bg-white p-5 rounded-3xl shadow-soft space-y-4 animate-fade-in h-fit">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900">Il tuo piano alimentare</h1>
            <p className="text-sm text-slate-500 mt-1">Se hai il piano della nutrizionista in PDF, caricalo: lo leggo e lo controlli prima di salvarlo. Puoi anche saltare e scriverlo più tardi dal tuo profilo.</p>
          </div>
          <PlanImport applyLabel="Salva il profilo con questo piano" onApply={(t) => finish(t, { planSource: 'nutritionist' })} onSkip={() => finish(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 bg-surface-ground pt-safe pb-safe">
      <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-soft space-y-5 animate-fade-in">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900">Ciao!</h1>
          <p className="text-sm text-slate-500 mt-1">Per configurare il tuo profilo personale mi servono il tuo nome e la dieta che segui.</p>
        </div>
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
        <button disabled={!name.trim()} onClick={() => setStep(joined ? 'source' : 'kitchen')} className="w-full py-4 bg-brand-600 text-white font-display font-bold rounded-2xl shadow-glow active:scale-95 disabled:opacity-50">
          Avanti
        </button>
      </div>
    </div>
  );
}
