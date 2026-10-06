import React from 'react';
import { HeartPulse, Copy, Check } from 'lucide-react';
import { Confirm, Sheet } from './ui.jsx';
import { useData } from '../hooks/data.jsx';
import { autoPlanFor } from './PlanSource.jsx';
import { mealsFromTexts } from './PlanImport.jsx';
import {
  ADJUSTMENTS, CHECKIN_ANSWERS, CHECKIN_QUESTIONS, DAY, RED_FLAGS, SYMPTOMS, applyAdjustment, assess, checkinDue, followUpDue, summaryText,
} from '../lib/wellbeing.js';

const chip = (on) => `px-3 py-2.5 rounded-xl text-sm font-bold active:scale-95 ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-600'}`;
const WEEKS = [{ v: 0, l: 'Da pochi giorni' }, { v: 1, l: '1-2 settimane' }, { v: 3, l: 'Più di 3 settimane' }];
const TONE = { emergency: 'bg-red-50 text-red-800', urgent: 'bg-red-50 text-red-800', support: 'bg-amber-50 text-amber-900', doctor: 'bg-amber-50 text-amber-900', ok: 'bg-brand-50 text-brand-900' };

// "Ho una segnalazione da fare": sintomo, segnali d'allarme, da quanto tempo; poi consigli e, se è il caso, un ritocco al piano
export function ReportSheet({ symptom: initial, onClose }) {
  const { me, saveProfile } = useData();
  const [symptom, setSymptom] = React.useState(initial || null);
  const [flags, setFlags] = React.useState([]);
  const [weeks, setWeeks] = React.useState(0);
  const [note, setNote] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [ask, setAsk] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [applied, setApplied] = React.useState(false);
  if (!me) return null;

  const toggle = (id) => setFlags(flags.includes(id) ? flags.filter((x) => x !== id) : [...flags, id]);
  const evaluate = () => {
    const r = assess(me, symptom, flags, weeks);
    setResult(r);
    // registro delle segnalazioni, le ultime 20
    const entry = { date: new Date().toISOString(), symptom, level: r.level };
    saveProfile({ ...me, reports: [...(me.reports || []), entry].slice(-20) });
  };
  const apply = () => {
    const updated = applyAdjustment(me, result.adjustment);
    const { texts } = autoPlanFor(updated);
    if (!texts) return;
    saveProfile({ ...updated, meals: mealsFromTexts(texts, updated.meals), reports: me.reports || [] });
    setApplied(true);
    setAsk(false);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(summaryText(me, symptom, flags, weeks, note)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* il testo resta selezionabile */ }
  };

  return (
    <Sheet title="Una segnalazione" onClose={onClose} full>
      <div className="p-5 space-y-5">
        {!symptom && (
          <>
            <p className="text-sm text-slate-600">Dimmi cosa non va: guardo se c'è qualcosa da controllare con un medico e, se il piano lo permette, provo a ritoccarlo.</p>
            <div className="space-y-2">{SYMPTOMS.map((s) => <button key={s.id} onClick={() => setSymptom(s.id)} className={`w-full text-left ${chip(false)}`}>{s.label}</button>)}</div>
          </>
        )}
        {symptom && !result && (
          <>
            <p className="font-display font-bold text-lg text-slate-900">{SYMPTOMS.find((s) => s.id === symptom)?.label}</p>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Da quanto tempo</p>
              <div className="flex gap-2">{WEEKS.map((w) => <button key={w.v} onClick={() => setWeeks(w.v)} aria-pressed={weeks === w.v} className={`flex-1 ${chip(weeks === w.v)}`}>{w.l}</button>)}</div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Ti è successo anche qualcosa di questo?</p>
              <div className="space-y-2">
                {RED_FLAGS.map((f) => (
                  <label key={f.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-700">
                    <input type="checkbox" className="w-5 h-5 mt-0.5 accent-emerald-500 shrink-0" checked={flags.includes(f.id)} onChange={() => toggle(f.id)} />{f.text}
                  </label>
                ))}
              </div>
            </div>
            <textarea className="w-full p-3 bg-slate-50 rounded-xl text-sm min-h-[70px] border-none focus:ring-2 focus:ring-brand-500" placeholder="Vuoi aggiungere qualcosa? (facoltativo)" value={note} onChange={(e) => setNote(e.target.value)} />
            <button onClick={evaluate} className="w-full py-3.5 bg-brand-600 text-white font-display font-bold rounded-2xl shadow-glow active:scale-95">Vedi cosa posso fare</button>
          </>
        )}
        {result && (
          <>
            <p className={`text-sm rounded-2xl p-4 ${TONE[result.level]}`}>{result.message}</p>
            {result.tips.length > 0 && (
              <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">{result.tips.map((t) => <li key={t}>{t}</li>)}</ul>
            )}
            {result.adjustment && !applied && (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <p className="font-bold text-slate-800">{ADJUSTMENTS[result.adjustment.kind].label}</p>
                <p className="text-sm text-slate-500">{ADJUSTMENTS[result.adjustment.kind].detail} Un cambio alla volta: fra due settimane ti chiedo com'è andata.</p>
                <button onClick={() => setAsk(true)} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl active:scale-95">Ritocca il mio piano</button>
              </div>
            )}
            {applied && <p className="text-sm text-brand-800 bg-brand-50 rounded-2xl p-4">Fatto: ho aggiornato i pasti del tuo piano. Le settimane già pianificate restano come sono; quelle nuove usano il piano ritoccato.</p>}
            {result.share && (
              <button onClick={copy} className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copiato' : 'Copia il riepilogo per chi ha preparato il tuo piano'}</button>
            )}
            <p className="text-[11px] text-slate-400">Queste indicazioni sono generali e non sostituiscono il parere di un medico o di un dietista.</p>
            <button onClick={onClose} className="w-full py-3 text-slate-600 font-bold bg-slate-50 rounded-2xl active:scale-95">Chiudi</button>
          </>
        )}
      </div>
      {ask && <Confirm title="Ritoccare il piano?" msg="I piani dei pasti vengono rigenerati: le modifiche fatte a mano ai pasti si perdono." confirmLabel="Ritocca" onCancel={() => setAsk(false)} onConfirm={apply} />}
    </Sheet>
  );
}

// Domanda breve settimanale ("Come ti senti?") e, dopo un ritocco, "com'è andata?"
export function CheckInCard({ onReport }) {
  const { me, saveProfile } = useData();
  const [answers, setAnswers] = React.useState({});
  if (!me) return null;
  const follow = followUpDue(me);
  if (!follow && !checkinDue(me)) return null;
  const later = () => saveProfile({ ...me, checkinSnooze: new Date(Date.now() + 7 * DAY).toISOString() });
  const save = () => {
    const entry = { date: new Date().toISOString(), answers };
    const bad = CHECKIN_QUESTIONS.find((q) => answers[q.id] === 'bad');
    saveProfile({ ...me, lastCheckin: entry.date, checkins: [...(me.checkins || []), entry].slice(-12) });
    if (bad) onReport(bad.symptom);
  };
  if (follow) {
    const done = (a) => { saveProfile({ ...me, followUpDone: me.lastAdjust }); if (a === 'worse') onReport(null); };
    return (
      <div className="bg-white rounded-3xl p-4 shadow-soft mb-4 space-y-3">
        <p className="font-bold text-slate-800 flex items-center gap-2"><HeartPulse className="w-5 h-5 text-brand-600" /> Com'è andata dopo il ritocco al piano?</p>
        <div className="flex gap-2">{[['better', 'Meglio'], ['same', 'Uguale'], ['worse', 'Peggio']].map(([id, l]) => <button key={id} onClick={() => done(id)} className={`flex-1 ${chip(false)}`}>{l}</button>)}</div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-3xl p-4 shadow-soft mb-4 space-y-3">
      <p className="font-bold text-slate-800 flex items-center gap-2"><HeartPulse className="w-5 h-5 text-brand-600" /> Come ti senti questa settimana?</p>
      {CHECKIN_QUESTIONS.map((q) => (
        <div key={q.id}>
          <p className="text-xs text-slate-500 mb-1.5">{q.label}</p>
          <div className="flex gap-2">{CHECKIN_ANSWERS.map((a) => <button key={a.id} onClick={() => setAnswers({ ...answers, [q.id]: a.id })} aria-pressed={answers[q.id] === a.id} className={`flex-1 ${chip(answers[q.id] === a.id)}`}>{a.label}</button>)}</div>
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={later} className="flex-1 py-2.5 text-slate-500 font-bold bg-slate-50 rounded-xl active:scale-95">Non ora</button>
        <button disabled={Object.keys(answers).length < CHECKIN_QUESTIONS.length} onClick={save} className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl disabled:opacity-40 active:scale-95">Fatto</button>
      </div>
    </div>
  );
}
