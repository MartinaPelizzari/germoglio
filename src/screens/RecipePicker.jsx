import React from 'react';
import { Heart, Plus, Search } from 'lucide-react';
import { useData } from '../hooks/data.jsx';
import { Sheet, RecipeThumb, DietBadge } from '../components/ui.jsx';
import { timeLabel } from '../lib/format.js';
import { coveredGroups } from '../lib/planGen.js';
import { fits } from '../lib/diet.js';
import { GROUP_LABEL } from '../lib/groups.js';
import { agoLabel } from '../lib/usage.js';

// categories: categorie proponibili; constraints: vincoli del pasto (per mostrare solo piatti adatti a chi mangia)
export default function RecipePicker({ title, categories, group, constraints, recipes, onSelect, onClose }) {
  const { favorites, lastUse } = useData();
  const [q, setQ] = React.useState('');
  const [onlyFit, setOnlyFit] = React.useState(Boolean(constraints));
  const [cat, setCat] = React.useState('Tutte');
  const list = recipes.filter((r) =>
    categories.includes(r.category) && (cat === 'Tutte' || r.category === cat) &&
    (!group || coveredGroups([r]).has(group)) &&
    (!onlyFit || fits(r, constraints)) &&
    (r.title.toLowerCase().includes(q.toLowerCase()) || (r.ingredients || []).some((i) => i.name.toLowerCase().includes(q.toLowerCase())))
  ).sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)) || (lastUse.get(b.id) ?? 99) - (lastUse.get(a.id) ?? 99));
  return (
    <Sheet title={title} onClose={onClose} full z={80}>
      <div className="p-4 bg-surface-subtle border-b border-slate-100 sticky top-0 z-10 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-brand-500" placeholder="Cerca ricetta o ingrediente" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['Tutte', ...categories].map((c) => <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${cat === c ? 'bg-brand-600 text-white' : 'bg-white text-slate-500'}`}>{c}</button>)}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500">
          {group ? <span>Per completare: <b>{GROUP_LABEL[group]}</b></span> : <span />}
          {constraints && (
            <label className="flex items-center gap-2 font-semibold"><input type="checkbox" className="accent-emerald-500" checked={onlyFit} onChange={(e) => setOnlyFit(e.target.checked)} /> Solo adatte a chi mangia{constraints.takeaway ? ' (asporto)' : ''}</label>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3 bg-surface-ground min-h-full">
        {list.length === 0 && <p className="text-center text-slate-400 py-12">Nessuna ricetta trovata</p>}
        {list.map((r) => (
          <button key={r.id} onClick={() => onSelect(r)} className="w-full p-3 bg-white rounded-2xl flex items-center gap-4 text-left shadow-soft active:scale-[0.98]">
            <RecipeThumb recipe={r} />
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-slate-800 truncate">{r.title}</h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap"><span className="text-xs text-slate-400">{r.category} · {timeLabel(r)}{lastUse.has(r.id) ? ` · fatta ${agoLabel(lastUse.get(r.id))}` : ''}</span><DietBadge diet={r.diet} /></div>
            </div>
            {favorites.has(r.id) && <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />}<Plus className="w-5 h-5 text-brand-600" />
          </button>
        ))}
      </div>
    </Sheet>
  );
}
