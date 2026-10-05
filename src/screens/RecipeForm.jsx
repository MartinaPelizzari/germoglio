import React from 'react';
import { Camera, Plus, Trash2, X, Pencil } from 'lucide-react';
import { CATEGORIES, FOOD_EMOJIS, getCategoryEmoji } from '../lib/format.js';
import { GROUPS, UNITS, guessGroup } from '../lib/groups.js';
import { compressImage } from '../lib/image.js';

export const emptyRecipe = () => ({
  id: null, own: true, title: '', category: 'Pranzo', time: 'media', minutes: '', diet: 'vegan', takeaway: false, emoji: null, photo: null,
  ingredients: [{ name: '', qty: '', unit: 'g', group: 'other' }], stepsText: '', notes: '', source: null,
});

// Da ricetta salvata a dati del modulo
export const toDraft = (r) => ({
  ...emptyRecipe(),
  ...r,
  minutes: r.minutes || '',
  stepsText: r.stepsText ?? (r.steps || []).join('\n'),
  ingredients: (r.ingredients?.length ? r.ingredients : emptyRecipe().ingredients).map((i) => ({ ...i, qty: i.qty ? String(i.qty) : '' })),
});

// Da dati del modulo a ricetta da salvare
export const fromDraft = (d) => {
  const { stepsText, ...rest } = d;
  return {
    ...rest,
    title: d.title.trim(),
    minutes: Number(d.minutes) || null,
    steps: stepsText.split('\n').map((s) => s.trim()).filter(Boolean),
    ingredients: d.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), qty: i.unit === 'q.b.' ? 0 : Number(String(i.qty).replace(',', '.')) || 0, unit: i.unit, group: i.group })),
  };
};

export default function RecipeForm({ data, onChange, onClose, onSave }) {
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const [photoBusy, setPhotoBusy] = React.useState(false);
  const fileRef = React.useRef(null);

  const setIng = (i, patch) => onChange({ ...data, ingredients: data.ingredients.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const input = 'w-full p-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500';
  const label = 'block text-xs font-bold text-slate-400 uppercase mb-2';

  const pickPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoBusy(true);
    try { onChange({ ...data, photo: await compressImage(f) }); } catch { alert('Non riesco a leggere questa foto.'); }
    setPhotoBusy(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-extrabold text-2xl text-slate-900">{data.id ? 'Modifica ricetta' : 'Nuova ricetta'}</h2>
        <button onClick={onClose} aria-label="Chiudi" className="p-2 bg-slate-100 rounded-full active:scale-95"><X className="w-6 h-6" /></button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-soft space-y-4">
        <div className="relative h-44 rounded-2xl overflow-hidden bg-brand-50 flex items-center justify-center">
          {data.photo ? <img src={data.photo} alt="" className="w-full h-full object-cover" /> : <button onClick={() => setEmojiOpen(!emojiOpen)} aria-label="Scegli emoji" className="text-7xl relative">{data.emoji || getCategoryEmoji(data.category)}<span className="absolute -bottom-1 -right-3 bg-white p-1.5 rounded-full shadow"><Pencil className="w-3.5 h-3.5 text-slate-500" /></span></button>}
          <div className="absolute bottom-3 right-3 flex gap-2">
            {data.photo && <button onClick={() => onChange({ ...data, photo: null })} className="px-3 py-2 bg-white/90 rounded-full text-xs font-bold text-red-500 active:scale-95">Togli foto</button>}
            <button onClick={() => fileRef.current?.click()} disabled={photoBusy} className="px-4 py-2 bg-white/90 rounded-full text-sm font-bold text-brand-700 flex items-center gap-2 active:scale-95"><Camera className="w-4 h-4" /> {photoBusy ? '...' : data.photo ? 'Cambia' : 'Foto del piatto'}</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        </div>
        {emojiOpen && !data.photo && (
          <div className="bg-slate-50 p-3 rounded-2xl grid grid-cols-8 gap-1 animate-scale-in">
            {FOOD_EMOJIS.map((e) => <button key={e} onClick={() => { onChange({ ...data, emoji: e }); setEmojiOpen(false); }} className="text-2xl p-1.5 rounded-lg active:scale-90">{e}</button>)}
          </div>
        )}
        <div><label className={label} htmlFor="r-title">Titolo</label><input id="r-title" className={`${input} font-display font-bold text-lg`} placeholder="Es. Pasta al pesto" value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Categoria</label><select className={input} value={data.category} onChange={(e) => onChange({ ...data, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className={label}>Tempo</label><select className={input} value={data.time} onChange={(e) => onChange({ ...data, time: e.target.value })}><option value="breve">Breve (fino a 20 min)</option><option value="media">Media (20-45 min)</option><option value="lunga">Lunga (oltre 45)</option></select></div>
        </div>
        <div>
          <label className={label}>Tipo</label>
          <div className="flex gap-2">
            {[['vegan', 'Vegana'], ['vegetarian', 'Vegetariana'], ['pescetarian', 'Pesce'], ['omnivore', 'Carne']].map(([v, l]) => (
              <button key={l} onClick={() => onChange({ ...data, diet: v })} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${(data.diet || 'omnivore') === v ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{l}</button>
            ))}
          </div>
          <label className="flex items-center gap-3 mt-3 text-sm font-semibold text-slate-600"><input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={!!data.takeaway} onChange={(e) => onChange({ ...data, takeaway: e.target.checked })} /> Adatta all'asporto</label>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-soft">
        <div className="flex justify-between items-center mb-1"><h3 className="font-display font-bold text-lg">Ingredienti</h3><button onClick={() => onChange({ ...data, ingredients: [...data.ingredients, { name: '', qty: '', unit: 'g', group: 'other' }] })} aria-label="Aggiungi ingrediente" className="text-brand-600 bg-brand-50 p-2 rounded-full active:scale-90"><Plus className="w-5 h-5" /></button></div>
        <p className="text-xs text-slate-400 mb-4">Quantità per una porzione. La componente (carboidrati, proteine...) serve a calcolare le dosi di ogni persona.</p>
        <div className="space-y-3">
          {data.ingredients.map((ing, i) => (
            <div key={i} className="p-3 border border-slate-100 rounded-2xl space-y-2">
              <div className="flex gap-2 items-center">
                <input className="flex-1 p-2 font-medium bg-transparent border-b border-slate-200 focus:border-brand-500 outline-none" placeholder="Ingrediente" aria-label={`Ingrediente ${i + 1}`} value={ing.name}
                  onChange={(e) => setIng(i, { name: e.target.value, ...(ing.groupTouched ? {} : { group: guessGroup(e.target.value) }) })} />
                <button onClick={() => onChange({ ...data, ingredients: data.ingredients.filter((_, k) => k !== i) })} aria-label="Elimina ingrediente" className="text-red-300 p-2 rounded-full"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2 text-sm">
                <input type="number" inputMode="decimal" min="0" className="w-20 bg-slate-50 rounded-lg p-2" placeholder="0" aria-label="Quantità" value={ing.qty} disabled={ing.unit === 'q.b.'} onChange={(e) => setIng(i, { qty: e.target.value })} />
                <select className="bg-slate-50 rounded-lg p-2 font-bold text-slate-600" value={ing.unit} onChange={(e) => setIng(i, { unit: e.target.value })} aria-label="Unità">{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
                <select className="flex-1 min-w-0 bg-slate-50 rounded-lg p-2 text-slate-600" value={ing.group} onChange={(e) => setIng(i, { group: e.target.value, groupTouched: true })} aria-label="Componente">{GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-soft">
        <h3 className="font-display font-bold text-lg mb-1">Procedimento</h3>
        <p className="text-xs text-slate-400 mb-3">Un passaggio per riga.</p>
        <textarea className={`${input} min-h-[140px]`} placeholder="Descrivi i passaggi..." value={data.stepsText} onChange={(e) => onChange({ ...data, stepsText: e.target.value })} aria-label="Procedimento" />
      </div>
      <button onClick={onSave} className="w-full py-4 bg-brand-600 text-white font-display font-bold text-lg rounded-2xl shadow-glow active:scale-95">{data.id ? 'Salva modifiche' : 'Aggiungi ricetta'}</button>
    </div>
  );
}
