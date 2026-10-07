import React from 'react';
import { Heart, Plus, Search } from 'lucide-react';
import { useData, usePlans } from '../hooks/data.jsx';
import { Sheet, RecipeThumb, DietBadge } from '../components/ui.jsx';
import { timeLabel } from '../lib/format.js';
import { coveredGroups, pairLabel, planAllows } from '../lib/planGen.js';
import { fits } from '../lib/diet.js';
import { kindFits } from '../lib/meals.js';
import { describeOption, planMatches } from '../lib/dietPlan.js';
import { GROUP_LABEL } from '../lib/groups.js';
import { agoLabel } from '../lib/usage.js';

// slot e constraints: pasto e vincoli di chi mangia. pair: gruppo del piano da completare (con la persona).
// group: componente da completare (senza piano). onSelect riceve { recipe } oppure { food } (alimento semplice).
export default function RecipePicker({ title, slot, constraints, pair, group, recipes, dayState, onSelect, onClose }) {
  const { favorites } = useData();
  const { lastUse } = usePlans();
  const [q, setQ] = React.useState('');
  const [onlyFit, setOnlyFit] = React.useState(Boolean(constraints));
  const [onlySlot, setOnlySlot] = React.useState(Boolean(slot) && !pair);
  const lq = q.toLowerCase();
  const list = recipes.filter((r) =>
    (!onlySlot || kindFits(r, slot)) &&
    (!group || coveredGroups([r]).has(group)) &&
    (!pair || planMatches(r, [pair.group])[0]) &&
    (!onlyFit || (fits(r, constraints) && (!slot || planAllows(r, constraints.eaters || [], slot, dayState ? { day: dayState } : undefined)))) &&
    (r.title.toLowerCase().includes(lq) || (r.ingredients || []).some((i) => i.name.toLowerCase().includes(lq)))
  ).sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)) || (lastUse.get(b.id) ?? 99) - (lastUse.get(a.id) ?? 99));

  return (
    <Sheet title={title} onClose={onClose} full z={80}>
      <div className="p-4 bg-surface-subtle border-b border-slate-100 sticky top-0 z-10 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-brand-500" placeholder="Cerca ricetta o ingrediente" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {pair && <span>Per completare il piano di {pair.eater.name}: <b>{pairLabel(pair)}</b></span>}
          {group && <span>Per completare: <b>{GROUP_LABEL[group]}</b></span>}
          {slot && !pair && <label className="flex items-center gap-2 font-semibold"><input type="checkbox" className="accent-emerald-500" checked={onlySlot} onChange={(e) => setOnlySlot(e.target.checked)} /> Adatte a questo pasto</label>}
          {constraints && <label className="flex items-center gap-2 font-semibold"><input type="checkbox" className="accent-emerald-500" checked={onlyFit} onChange={(e) => setOnlyFit(e.target.checked)} /> Solo adatte a chi mangia e al suo piano{constraints.takeaway ? ' (asporto)' : ''}</label>}
        </div>
      </div>
      <div className="p-4 space-y-3 bg-surface-ground min-h-full">
        {pair && (
          <div className="bg-white rounded-2xl p-3 shadow-soft">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Solo l'alimento, senza ricetta</p>
            <div className="flex flex-wrap gap-2">
              {pair.group.options.map((o) => (
                <button key={o.text} onClick={() => onSelect({ food: { name: o.name, qty: o.qty, unit: o.unit, group: o.group } })} className="px-3 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-bold active:scale-95">{describeOption(o)}</button>
              ))}
            </div>
          </div>
        )}
        {list.length === 0 && <p className="text-center text-slate-400 py-12">Nessuna ricetta trovata</p>}
        {list.map((r) => (
          <button key={r.id} onClick={() => onSelect({ recipe: r })} className="w-full p-3 bg-white rounded-2xl flex items-center gap-4 text-left shadow-soft active:scale-[0.98]">
            <RecipeThumb recipe={r} />
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-slate-800 truncate">{r.title}</h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap"><span className="text-xs text-slate-400">{timeLabel(r)}{lastUse.has(r.id) ? ` · fatta ${agoLabel(lastUse.get(r.id))}` : ''}</span><DietBadge diet={r.diet} /></div>
            </div>
            {favorites.has(r.id) && <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />}<Plus className="w-5 h-5 text-brand-600" />
          </button>
        ))}
      </div>
    </Sheet>
  );
}
