import React from 'react';
import { ChevronDown } from 'lucide-react';
import { describeOption, optionLimits } from '../lib/dietPlan.js';
import { SLOTS, mealOf } from '../lib/scale.js';

// Il piano di una persona, da leggere: un riquadro per pasto, un gruppo per riga, le alternative una accanto all'altra.
export default function PlanView({ member }) {
  const [open, setOpen] = React.useState(null);
  const eaten = SLOTS.filter((s) => mealOf(member, s).eats);
  if (!eaten.length) return <p className="text-sm text-slate-400 bg-slate-50 rounded-2xl p-4">Nessun pasto previsto: scegli quali vedere in "Opzioni del piano".</p>;
  return (
    <div className="space-y-2">
      {eaten.map((slot) => {
        const meal = mealOf(member, slot);
        const isOpen = open === slot;
        const summary = meal.plan.length ? `${meal.plan.length} ${meal.plan.length === 1 ? 'gruppo' : 'gruppi'}` : meal.mult !== 1 ? `porzione x ${String(meal.mult).replace('.', ',')}` : 'porzioni standard';
        return (
          <div key={slot} className="border border-slate-100 rounded-2xl bg-white overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : slot)} aria-expanded={isOpen} className="w-full flex items-center gap-3 p-3.5 text-left">
              <span className="flex-1 font-display font-bold text-slate-800">{slot}</span>
              <span className="text-xs text-slate-400">{summary}</span>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-3.5 pb-3.5 border-t border-slate-50 pt-3">
                {meal.plan.length > 0 ? (
                  <ul className="space-y-2.5">
                    {meal.plan.map((g, gi) => (
                      <li key={gi} className="flex flex-wrap items-center gap-1.5">
                        {g.options.map((o, oi) => (
                          <React.Fragment key={oi}>
                            {oi > 0 && <span className="text-[10px] font-bold text-slate-300 uppercase">oppure</span>}
                            <span className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 text-xs font-semibold" title={optionLimits(o) || undefined}>{describeOption(o)}</span>
                          </React.Fragment>
                        ))}
                        {optionLimits(g.options[0]) && <span className="text-[10px] text-slate-400 w-full">{optionLimits(g.options[0])}</span>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-slate-400">Nessun gruppo scritto per questo pasto: le ricette usano le porzioni standard.</p>}
                {meal.note && <p className="text-[11px] text-slate-500 mt-2">{meal.note}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
