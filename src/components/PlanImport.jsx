import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import PlanBox from './PlanBox.jsx';
import { SLOTS } from '../lib/scale.js';
import { parseSlotPlan, splitFullPlan } from '../lib/dietPlan.js';
import { readPlanFile } from '../lib/pdfLoad.js';

// Carica il piano da un PDF (o incollando il testo), lo legge e lo mostra pasto per pasto da controllare e correggere.
// Quando l'utente conferma, onApply riceve { pasto: testo }.
export default function PlanImport({ initial = {}, onApply, applyLabel = 'Usa questo piano', onSkip }) {
  const [texts, setTexts] = React.useState(initial);
  const [paste, setPaste] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const fileRef = React.useRef(null);
  const found = SLOTS.filter((s) => texts[s]);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true);
    setMsg('');
    try {
      const t = await readPlanFile(f);
      if (!Object.keys(t).length) setMsg('Non ho trovato i pasti in questo PDF (Colazione, Pranzo, Cena...). Puoi incollare il testo qui sotto.');
      else { setTexts(t); setMsg(`Ho letto il piano: ${SLOTS.filter((s) => t[s]).join(', ')}. Controlla ogni pasto e correggi quello che non torna.`); }
    } catch {
      setMsg('Non riesco a leggere questo PDF (potrebbe essere una scansione, cioè un\'immagine). Puoi incollare il testo qui sotto.');
    }
    setBusy(false);
  };

  const readPaste = () => {
    const t = splitFullPlan(paste);
    if (!Object.keys(t).length) return setMsg('Non ho trovato i titoli dei pasti (Colazione, Pranzo, Cena...). Scrivi ogni pasto su una riga a sé.');
    setTexts({ ...texts, ...t });
    setMsg(`Piano letto per: ${SLOTS.filter((s) => t[s]).join(', ')}. Controlla ogni pasto qui sotto.`);
    setPaste('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"><FileText className="w-5 h-5" /> {busy ? 'Leggo il PDF...' : 'Carica il PDF del piano'}</button>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFile} />
        <p className="text-[11px] text-slate-400 flex items-start gap-1.5"><ShieldCheck className="w-4 h-4 shrink-0 text-brand-600" /> Il PDF viene letto sul tuo telefono e non viene inviato a nessuno. Se il file è una scansione (un'immagine) non si può leggere: incolla il testo.</p>
        <details className="text-sm">
          <summary className="font-semibold text-slate-600 cursor-pointer">Oppure incolla il testo del piano</summary>
          <div className="mt-2 space-y-2">
            <textarea className="w-full p-3 bg-white rounded-xl text-sm min-h-[110px] border-none focus:ring-2 focus:ring-brand-500" placeholder={'Colazione\n150 g yogurt oppure 30 g pane\n\nPranzo\n90 g pasta\n...'} value={paste} onChange={(e) => setPaste(e.target.value)} aria-label="Testo del piano" />
            <button disabled={!paste.trim()} onClick={readPaste} className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm disabled:opacity-40 active:scale-95">Leggi il testo</button>
          </div>
        </details>
        {msg && <p className="text-xs text-brand-700">{msg}</p>}
      </div>

      {found.length > 0 && (
        <div className="space-y-3">
          {found.map((slot) => (
            <div key={slot} className="border border-slate-100 rounded-2xl p-3 bg-slate-50/60">
              <p className="text-xs font-bold text-brand-600 uppercase mb-2">{slot}</p>
              <PlanBox text={texts[slot]} onText={(t) => setTexts({ ...texts, [slot]: t })} />
            </div>
          ))}
          <button onClick={() => onApply(Object.fromEntries(found.map((s) => [s, texts[s]])))} className="w-full py-3.5 bg-brand-600 text-white font-display font-bold rounded-2xl shadow-glow active:scale-95">{applyLabel}</button>
        </div>
      )}
      {onSkip && <button onClick={onSkip} className="w-full py-2 text-sm font-semibold text-slate-400">{found.length ? 'Salta, lo faccio dopo' : 'Salta per ora'}</button>}
    </div>
  );
}

// Dai testi dei pasti ai pasti del profilo (testo e piano letto)
export const mealsFromTexts = (texts, previous = {}) => {
  const meals = { ...previous };
  for (const [slot, t] of Object.entries(texts)) meals[slot] = { ...(meals[slot] || {}), planText: t, plan: parseSlotPlan(t) };
  return meals;
};
