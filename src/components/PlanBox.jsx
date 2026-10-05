import React from 'react';
import { describeOption, optionLimits, parseSlotPlan } from '../lib/dietPlan.js';

const PLACEHOLDER = '150 g yogurt oppure 30 g pane\n\n1 frutto';

// Piano scritto di un pasto: testo libero (modificabile) + anteprima di come l'app lo ha letto
export default function PlanBox({ text, onText, rows = 5 }) {
  const groups = React.useMemo(() => parseSlotPlan(text), [text]);
  return (
    <div className="space-y-2">
      <textarea className="w-full p-3 bg-white rounded-xl text-sm border-none focus:ring-2 focus:ring-brand-500" rows={rows} placeholder={PLACEHOLDER} value={text} onChange={(e) => onText(e.target.value)} aria-label="Piano del pasto" />
      {groups.length > 0 ? (
        <div className="bg-white rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Ho capito</p>
          {groups.map((g, i) => (
            <div key={i} className="text-xs text-slate-600">
              <b className="text-slate-400">Gruppo {i + 1}</b>{g.options.length > 1 ? ' (una di queste)' : ''}
              <ul className="mt-0.5 space-y-0.5">
                {g.options.map((o, k) => (
                  <li key={k}>• {describeOption(o)}{optionLimits(o) ? <span className="text-amber-700"> · {optionLimits(o)}</span> : null}{o.avoid ? <span className="text-slate-400"> · evita {o.avoid.join(', ')}</span> : null}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400">Un'alternativa per riga (o separate da "oppure"). Una riga vuota separa ciò che si mangia insieme.</p>
      )}
    </div>
  );
}
