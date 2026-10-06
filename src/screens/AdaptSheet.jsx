import React from 'react';
import { Sheet } from '../components/ui.jsx';
import { adaptRecipe, planReport } from '../lib/adapt.js';
import { describeOption } from '../lib/dietPlan.js';
import { mealOfItem } from '../lib/scale.js';

// "Perché non va bene per il piano" e "Adatta": per ogni ingrediente fuori piano si sceglie se toglierlo, sostituirlo
// con un'alternativa del piano o lasciarlo. Si crea una copia personale della ricetta; l'originale non cambia.
export default function AdaptSheet({ recipe, person, slot, item, onCreate, onClose }) {
  const report = React.useMemo(() => planReport(recipe, mealOfItem(person, slot, item).plan, slot), [recipe, person, slot, item]);
  const [choices, setChoices] = React.useState(() => Object.fromEntries(report.issues.map((i) => [i.index, i.options.length ? { action: 'replace', option: i.options[0] } : { action: 'remove' }])));
  const set = (index, c) => setChoices({ ...choices, [index]: c });
  const btn = (on) => `px-3 py-2 rounded-xl text-xs font-bold ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`;

  return (
    <Sheet title="Adatta al piano" onClose={onClose} full z={90}>
      <div className="p-5 space-y-5">
        <p className="text-sm text-slate-500"><b className="text-slate-700">{recipe.title}</b> non rispetta il piano di {person.name} per {slot.toLowerCase()}. Ecco perché e cosa puoi fare. Il procedimento della ricetta resta com'è: dopo l'adattamento rileggilo e correggilo a mano dove serve.</p>

        {report.issues.length === 0 && <p className="text-sm text-brand-700 bg-brand-50 rounded-2xl p-4">Non trovo ingredienti fuori piano: la ricetta va bene.</p>}

        {report.issues.map((it) => {
          const c = choices[it.index];
          return (
            <div key={it.index} className="border border-slate-100 rounded-2xl p-4 space-y-3">
              <div>
                <p className="font-bold text-slate-800">{it.why}</p>
                <p className="text-xs text-slate-500 mt-1">{it.hint}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => set(it.index, { action: 'remove' })} className={btn(c?.action === 'remove')}>Togli</button>
                {it.options.map((o) => (
                  <button key={o.text} onClick={() => set(it.index, { action: 'replace', option: o })} className={btn(c?.action === 'replace' && c.option.text === o.text)}>Sostituisci con {describeOption(o)}</button>
                ))}
                <button onClick={() => set(it.index, { action: 'keep' })} className={btn(c?.action === 'keep')}>Lascia</button>
              </div>
            </div>
          );
        })}

        {report.uncovered.length > 0 && (
          <div className="bg-amber-50 text-amber-800 text-sm rounded-2xl p-4">
            <p className="font-bold mb-1">Il piano prevede anche:</p>
            <ul className="list-disc pl-5 space-y-0.5">{report.uncovered.map((u) => <li key={u.gi}>{u.label}</li>)}</ul>
            <p className="text-xs mt-2">Dopo l'adattamento, "Proponi" o il pulsante "manca" nel Planner aggiungono l'alimento semplice.</p>
          </div>
        )}

        <button onClick={() => onCreate(adaptRecipe(recipe, report.issues, choices, slot))} className="w-full py-3.5 bg-brand-600 text-white font-display font-bold rounded-2xl shadow-glow active:scale-95">Crea la versione adattata</button>
      </div>
    </Sheet>
  );
}
