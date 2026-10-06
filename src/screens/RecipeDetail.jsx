import React from 'react';
import { Clock, ExternalLink, Pencil, Copy, Trash2, ChevronLeft, ShoppingCart, Heart } from 'lucide-react';
import { useData } from '../hooks/data.jsx';
import { DietBadge, Portal, useBackClose } from '../components/ui.jsx';
import { DEFAULT_EMOJI, timeLabel } from '../lib/format.js';
import { recipeKind } from '../lib/meals.js';
import { formatQty, mealOfItem, scaleRecipe, sumIngredients } from '../lib/scale.js';
import { allergenLabel, recipeAllergens } from '../lib/allergens.js';
import { agoLabel } from '../lib/usage.js';
import { planReport } from '../lib/adapt.js';

// context (facoltativo): { slot, eaters: [member] } quando si apre da un pasto pianificato
export default function RecipeDetail({ recipe, context, onClose, onEdit, onDuplicate, onDelete }) {
  useBackClose(onClose);
  const { household, favorites, toggleFavorite, lastUse, restoreRecipe } = useData();
  const fav = favorites.has(recipe.id);
  const allergens = [...recipeAllergens(recipe)];
  const ago = lastUse.get(recipe.id);
  const members = context?.eaters?.length ? context.eaters : household.members;
  const kind = recipeKind(recipe);
  const slot = context?.slot || (kind === 'colazione' ? 'Colazione' : kind === 'spuntino' ? 'Spuntino 1' : 'Pranzo');
  const [view, setView] = React.useState(context ? 'all' : 'base');

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const doses = React.useMemo(() => {
    if (view === 'base') return { list: recipe.ingredients, note: 'Dosi di una porzione standard.' };
    if (view === 'all') {
      const per = members.map((m) => scaleRecipe(recipe, mealOfItem(m, slot, context?.item)));
      return { list: sumIngredients(per), note: `Totale per ${members.map((m) => m.name).join(', ') || 'nessuno'}.` };
    }
    const m = members.find((x) => x.id === view) || household.members.find((x) => x.id === view);
    const meal = mealOfItem(m, slot, context?.item);
    const why = meal.plan.length ? `Dosi dal piano alimentare di ${m.name} (${slot.toLowerCase()}) per gli ingredienti che corrispondono.` : meal.mult !== 1 ? `Porzione di ${m.name} x ${String(meal.mult).replace('.', ',')}.` : `Porzione standard di ${m.name}.`;
    return { list: scaleRecipe(recipe, meal), note: why };
  }, [view, recipe, members, slot, household]);

  const tint = 'bg-brand-50';
  // Per ogni persona con un piano scritto: la ricetta lo rispetta? Se no, perché
  const reports = context ? members.filter((m) => mealOfItem(m, slot, context.item).plan.length).map((m) => ({ m, r: planReport(recipe, mealOfItem(m, slot, context.item).plan, slot) })) : [];
  const modes = [{ id: context ? 'all' : 'base', label: context ? 'Tutti' : 'Base' }, ...members.map((m) => ({ id: m.id, label: m.name }))];

  return (
    <Portal><div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md h-full bg-white flex flex-col relative animate-slide-up overflow-hidden shadow-2xl">
        <div className="overflow-y-auto flex-1">
          <div className={`relative h-64 ${tint} flex items-center justify-center`}>
            {recipe.photo ? <img src={recipe.photo} alt={recipe.title} className="w-full h-full object-cover" /> : <span style={{ fontSize: '7rem' }}>{recipe.emoji || DEFAULT_EMOJI}</span>}
            <button onClick={onClose} aria-label="Chiudi" className="absolute top-5 left-5 mt-[var(--safe-top)] p-3 bg-white/70 backdrop-blur-md rounded-full active:scale-95"><ChevronLeft className="w-6 h-6 text-slate-800" /></button>
            <div className="absolute top-5 right-5 mt-[var(--safe-top)] flex gap-2">
              <button onClick={() => toggleFavorite(recipe.id)} aria-label={fav ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'} aria-pressed={fav} className="p-3 bg-white/70 backdrop-blur-md rounded-full active:scale-95"><Heart className={`w-5 h-5 ${fav ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} /></button>
              {!recipe.isFood && <button onClick={onDuplicate} aria-label="Salva una copia" title="Salva una copia" className="p-3 bg-white/70 backdrop-blur-md rounded-full text-slate-600 active:scale-95"><Copy className="w-5 h-5" /></button>}
              <button onClick={onEdit} aria-label="Modifica ricetta" className="p-3 bg-white/70 backdrop-blur-md rounded-full text-brand-700 active:scale-95"><Pencil className="w-5 h-5" /></button>
              <button onClick={onDelete} aria-label="Elimina ricetta" className="p-3 bg-white/70 backdrop-blur-md rounded-full text-red-500 active:scale-95"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="px-6 pt-6 pb-32 -mt-6 relative bg-white rounded-t-[32px]">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <DietBadge diet={recipe.diet} />
              <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold"><Clock className="w-3.5 h-3.5" /> {timeLabel(recipe)}</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl text-slate-900 mb-2 leading-tight">{recipe.title}</h1>
            {recipe.overridden && <button onClick={() => { restoreRecipe(recipe.id); onClose(); }} className="text-xs font-bold text-brand-700 underline mb-2 block">Questa ricetta è stata modificata: ripristina l'originale</button>}
            {ago !== undefined && <p className="text-xs text-slate-400 mb-1">Ultima volta in menù: {agoLabel(ago)}</p>}
            {allergens.length > 0 && <p className="text-xs text-slate-500 mb-2">Contiene (stima dagli ingredienti): {allergens.map((a) => allergenLabel(a).toLowerCase()).join(', ')}</p>}
            {recipe.source?.url && (
              <a href={recipe.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-400 mb-4 underline">
                Ispirata a {recipe.source.name || 'la fonte'} <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {reports.some(({ r }) => r.issues.length) && (
              <div className="mt-3 mb-2 bg-amber-50 text-amber-900 rounded-2xl p-4 space-y-3">
                <p className="font-display font-bold">Rispetto al piano alimentare</p>
                {reports.filter(({ r }) => r.issues.length).map(({ m, r }) => (
                  <div key={m.id} className="space-y-1">
                    <p className="text-sm font-bold">{m.name}</p>
                    {r.issues.map((i) => <p key={i.index} className="text-xs"><b>{i.why}</b> {i.hint}</p>)}
                    {context.onAdapt && <button onClick={() => context.onAdapt(m)} className="text-xs font-bold underline">Adatta la ricetta al piano di {m.name}</button>}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-4 mb-2">
              <h3 className="font-display font-bold text-xl text-slate-800 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-brand-500" /> Ingredienti</h3>
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar bg-slate-100 p-1 rounded-xl mb-2">
              {modes.map((m) => (
                <button key={m.id} onClick={() => setView(m.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${view === m.id ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`}>{m.label}</button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mb-3">{doses.note}</p>
            <ul className="space-y-2 mb-8">
              {doses.list.map((i, x) => (
                <li key={x} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl gap-3">
                  <span className="font-medium text-slate-700">{i.name}</span>
                  <span className="font-mono text-brand-600 bg-brand-50 px-2 py-1 rounded-lg text-sm whitespace-nowrap">{formatQty(i.qty, i.unit)}</span>
                </li>
              ))}
            </ul>

            <h3 className="font-display font-bold text-xl text-slate-800 mb-3">Procedimento</h3>
            <ol className="space-y-3">
              {(recipe.steps || []).map((s, i) => (
                <li key={i} className="flex gap-3 text-slate-600 leading-relaxed">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            {recipe.notes && <p className="mt-6 text-sm text-slate-500 bg-slate-50 p-4 rounded-2xl">{recipe.notes}</p>}
          </div>
        </div>
      </div>
    </div></Portal>
  );
}
