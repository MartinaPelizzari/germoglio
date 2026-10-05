import React from 'react';
import { Heart, Search, SlidersHorizontal } from 'lucide-react';
import { useData } from '../hooks/data.jsx';
import { DietBadge, RecipeThumb } from '../components/ui.jsx';
import RecipeDetail from './RecipeDetail.jsx';
import { CATEGORIES, timeLabel } from '../lib/format.js';
import { ALLERGENS, recipeAllergens } from '../lib/allergens.js';

export default function RecipeBook({ filters, setFilters, onEdit, onDuplicate, onDelete }) {
  const { recipes, favorites, toggleFavorite } = useData();
  const [sel, setSel] = React.useState(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const { cat, time, diet, origin, q } = filters;
  const free = filters.free || [];
  const set = (patch) => setFilters({ ...filters, ...patch });

  const list = recipes.filter((r) => {
    if (cat !== 'Tutte' && r.category !== cat) return false;
    if (time !== 'Tutte' && r.time !== time) return false;
    if (diet === 'asporto') { if (!r.takeaway) return false; }
    else if (diet !== 'Tutte' && (r.diet || 'omnivore') !== diet) return false;
    if (origin === 'mie' && !r.own) return false;
    if (origin === 'preferite' && !favorites.has(r.id)) return false;
    if (free.some((a) => recipeAllergens(r).has(a))) return false;
    if (origin === 'base' && r.own) return false;
    const lq = q.toLowerCase();
    return !lq || r.title.toLowerCase().includes(lq) || (r.ingredients || []).some((i) => i.name.toLowerCase().includes(lq));
  });

  const pill = (active) => `px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${active ? 'bg-brand-600 text-white shadow-glow' : 'bg-white text-slate-500 shadow-sm'}`;

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 bg-surface-ground z-10 py-2 space-y-3 mb-3">
        <div className="flex gap-2 px-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl shadow-soft border-none focus:ring-2 focus:ring-brand-500" placeholder="Cerca ricetta o ingrediente" value={q} onChange={(e) => set({ q: e.target.value })} aria-label="Cerca" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} aria-label="Filtri" className={`p-3 rounded-2xl ${showFilters ? 'bg-brand-500 text-white' : 'bg-white text-slate-400 shadow-soft'}`}><SlidersHorizontal className="w-6 h-6" /></button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
          {['Tutte', ...CATEGORIES].map((c) => <button key={c} onClick={() => set({ cat: c })} className={pill(cat === c)}>{c}</button>)}
        </div>
        {showFilters && (
          <div className="space-y-2 px-1 animate-fade-in">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[['Tutte', 'Ogni tempo'], ['breve', 'Breve'], ['media', 'Media'], ['lunga', 'Lunga']].map(([v, l]) => <button key={v} onClick={() => set({ time: v })} className={pill(time === v)}>{l}</button>)}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[['Tutte', 'Ogni dieta'], ['vegan', 'Vegane'], ['vegetarian', 'Vegetariane'], ['pescetarian', 'Pescetariane'], ['omnivore', 'Onnivore'], ['asporto', 'Asporto']].map(([v, l]) => <button key={v} onClick={() => set({ diet: v })} className={pill(diet === v)}>{l}</button>)}
              {[['tutte', 'Ovunque'], ['preferite', 'Preferite'], ['mie', 'Le mie'], ['base', 'Precaricate']].map(([v, l]) => <button key={v} onClick={() => set({ origin: v })} className={pill(origin === v)}>{l}</button>)}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Senza</span>
              {ALLERGENS.map((a) => <button key={a.id} onClick={() => set({ free: free.includes(a.id) ? free.filter((x) => x !== a.id) : [...free, a.id] })} className={pill(free.includes(a.id))}>{a.label}</button>)}
            </div>
            {free.length > 0 && <p className="text-[11px] text-slate-400">Stima automatica dagli ingredienti: controlla sempre le etichette.</p>}
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
                <span className="uppercase">{r.category}</span><span>•</span><span>{timeLabel(r)}</span><DietBadge diet={r.diet} />
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-slate-400 py-12">Nessuna ricetta trovata</p>}
      </div>

      {sel && (
        <RecipeDetail recipe={sel} onClose={() => setSel(null)}
          onEdit={() => { const r = sel; setSel(null); onEdit(r); }}
          onDuplicate={() => { const r = sel; setSel(null); onDuplicate(r); }}
          onDelete={() => { const r = sel; setSel(null); onDelete(r); }} />
      )}
    </div>
  );
}
