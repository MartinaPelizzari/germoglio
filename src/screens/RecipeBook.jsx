import React from 'react';
import { Heart, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useData } from '../hooks/data.jsx';
import { DietBadge, RecipeThumb, Sheet } from '../components/ui.jsx';
import RecipeDetail from './RecipeDetail.jsx';
import { timeLabel } from '../lib/format.js';
import { ALLERGENS, recipeAllergens } from '../lib/allergens.js';
import { DIETS, recipeLevel } from '../lib/diet.js';
import { FOOD_TYPES, recipeFoods } from '../lib/goals.js';

const TIME_LABEL = { breve: 'Breve', media: 'Media', lunga: 'Lunga' };
const DIET_FILTER_LABEL = { vegan: 'Per vegani', vegetarian: 'Per vegetariani', pescetarian: 'Per pescetariani', omnivore: 'Per onnivori', asporto: 'D\'asporto' };
const ORIGIN_LABEL = { preferite: 'Preferite', mie: 'Create da me', base: 'Precaricate' };

export default function RecipeBook({ filters, setFilters, onNew, onEdit, onDuplicate, onDelete }) {
  const { recipes, favorites, toggleFavorite } = useData();
  const [sel, setSel] = React.useState(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const { time, diet, origin, q } = filters;
  const free = filters.free || [];
  const contains = filters.contains || [];
  const set = (patch) => setFilters({ ...filters, ...patch });

  const list = recipes.filter((r) => {
    if (time !== 'Tutte' && r.time !== time) return false;
    // "Adatte a": una ricetta con pesce va bene a pescetariani e onnivori, una vegana a tutti
    if (diet === 'asporto') { if (!r.takeaway) return false; }
    else if (diet !== 'Tutte' && recipeLevel(r) > DIETS.find((d) => d.id === diet).level) return false;
    if (contains.some((f) => !recipeFoods(r).has(f))) return false;
    if (origin === 'mie' && !r.own) return false;
    if (origin === 'preferite' && !favorites.has(r.id)) return false;
    if (free.some((a) => recipeAllergens(r).has(a))) return false;
    if (origin === 'base' && r.own) return false;
    const lq = q.toLowerCase();
    return !lq || r.title.toLowerCase().includes(lq) || (r.ingredients || []).some((i) => i.name.toLowerCase().includes(lq));
  });

  const activeCount = (time !== 'Tutte') + (diet !== 'Tutte') + (origin !== 'tutte') + contains.length + free.length;
  const reset = () => set({ time: 'Tutte', diet: 'Tutte', origin: 'tutte', free: [], contains: [] });
  const tag = 'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-brand-50 text-brand-700 active:scale-95';
  const fl = 'block text-[10px] font-bold text-slate-400 uppercase mb-2';
  const selCls = 'w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-700';
  const pill = (active) => `px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${active ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-500'}`;

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 -mx-4 px-4 -mt-4 pt-4 pb-2 bg-surface-ground z-10 space-y-3 mb-3">
        <div className="flex gap-2 px-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl shadow-soft border-none focus:ring-2 focus:ring-brand-500" placeholder="Cerca ricetta o ingrediente" value={q} onChange={(e) => set({ q: e.target.value })} aria-label="Cerca" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} aria-label={`Filtri${activeCount ? `, ${activeCount} attivi` : ''}`} aria-expanded={showFilters} className={`relative p-3 rounded-2xl ${showFilters ? 'bg-brand-500 text-white' : 'bg-white text-slate-400 shadow-soft'}`}><SlidersHorizontal className="w-6 h-6" />{activeCount > 0 && <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center">{activeCount}</span>}</button>
          {onNew && <button onClick={onNew} aria-label="Nuova ricetta" className="px-3.5 rounded-2xl bg-brand-600 text-white font-bold text-sm flex items-center gap-1 shadow-glow active:scale-95"><Plus className="w-5 h-5" /> <span className="hidden min-[380px]:inline">Nuova</span></button>}
        </div>
        {activeCount > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-1" aria-label="Filtri attivi">
            {time !== 'Tutte' && <button onClick={() => set({ time: 'Tutte' })} className={tag}>{TIME_LABEL[time]} ✕</button>}
            {diet !== 'Tutte' && <button onClick={() => set({ diet: 'Tutte' })} className={tag}>{DIET_FILTER_LABEL[diet]} ✕</button>}
            {origin !== 'tutte' && <button onClick={() => set({ origin: 'tutte' })} className={tag}>{ORIGIN_LABEL[origin]} ✕</button>}
            {contains.map((f) => <button key={f} onClick={() => set({ contains: contains.filter((x) => x !== f) })} className={tag}>Con {FOOD_TYPES.find((t) => t.id === f)?.label.toLowerCase()} ✕</button>)}
            {free.map((a) => <button key={a} onClick={() => set({ free: free.filter((x) => x !== a) })} className={tag}>Senza {ALLERGENS.find((t) => t.id === a)?.label.toLowerCase()} ✕</button>)}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 px-1 mb-2">{list.length} ricette</p>
      <div className="grid grid-cols-1 gap-3">
        {list.map((r) => (
          <div key={r.id} onClick={() => setSel(r)} className="bg-white p-2.5 rounded-[24px] shadow-soft flex items-center gap-4 cursor-pointer active:scale-[0.99]">
            <RecipeThumb recipe={r} className="w-20 h-20 rounded-2xl text-4xl" />
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(r.id); }} aria-label={favorites.has(r.id) ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'} aria-pressed={favorites.has(r.id)} className="order-last p-2 self-start"><Heart className={`w-5 h-5 ${favorites.has(r.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`} /></button>
            <div className="flex-1 py-1 min-w-0">
              <h3 className="font-display font-bold text-base text-slate-800 leading-tight mb-1.5 line-clamp-2">{r.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
                <span>{timeLabel(r)}</span><DietBadge diet={r.diet} />
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-slate-400 py-12">Nessuna ricetta trovata</p>}
      </div>

      {showFilters && (
        <Sheet title="Filtri" onClose={() => setShowFilters(false)}>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <label className="block"><span className={fl}>Tempo</span>
                <select className={selCls} value={time} onChange={(e) => set({ time: e.target.value })}>{Object.entries({ Tutte: 'Qualsiasi', ...TIME_LABEL }).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className="block"><span className={fl}>Adatte a</span>
                <select className={selCls} value={diet} onChange={(e) => set({ diet: e.target.value })}>{Object.entries({ Tutte: 'Tutte le diete', ...DIET_FILTER_LABEL }).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className="block"><span className={fl}>Quali ricette</span>
                <select className={selCls} value={origin} onChange={(e) => set({ origin: e.target.value })}>{Object.entries({ tutte: 'Tutte', ...ORIGIN_LABEL }).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            </div>
            <div>
              <p className={fl}>Con (anche più di uno)</p>
              <div className="flex flex-wrap gap-2">{FOOD_TYPES.filter((f) => ['legumi', 'pesce', 'carne-bianca', 'carne-rossa', 'salumi', 'uova', 'formaggi', 'frutta-secca'].includes(f.id)).map((f) => <button key={f.id} aria-pressed={contains.includes(f.id)} onClick={() => set({ contains: contains.includes(f.id) ? contains.filter((x) => x !== f.id) : [...contains, f.id] })} className={pill(contains.includes(f.id))}>{f.label}</button>)}</div>
            </div>
            <div>
              <p className={fl}>Senza</p>
              <div className="flex flex-wrap gap-2">{ALLERGENS.map((a) => <button key={a.id} aria-pressed={free.includes(a.id)} onClick={() => set({ free: free.includes(a.id) ? free.filter((x) => x !== a.id) : [...free, a.id] })} className={pill(free.includes(a.id))}>{a.label}</button>)}</div>
              {free.length > 0 && <p className="text-[11px] text-slate-400 mt-2">Stima automatica dagli ingredienti: controlla sempre le etichette.</p>}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={reset} disabled={!activeCount} className="py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl disabled:opacity-40 active:scale-95">Azzera</button>
              <button onClick={() => setShowFilters(false)} className="py-3 bg-brand-600 text-white font-bold rounded-2xl active:scale-95">Mostra {list.length} ricette</button>
            </div>
          </div>
        </Sheet>
      )}
      {sel && (
        <RecipeDetail recipe={sel} onClose={() => setSel(null)}
          onEdit={() => { const r = sel; setSel(null); onEdit(r); }}
          onDuplicate={() => { const r = sel; setSel(null); onDuplicate(r); }}
          onDelete={() => { const r = sel; setSel(null); onDelete(r); }} />
      )}
    </div>
  );
}
