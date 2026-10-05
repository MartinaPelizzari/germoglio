import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getCategoryEmoji, categoryTint } from '../lib/format.js';
import { pushOverlay } from '../lib/backstack.js';

// Le schermate sovrapposte vanno disegnate a livello della pagina intera: dentro la pagina le animazioni creano
// livelli che le farebbero finire sotto intestazione e barra di navigazione.
export const Portal = ({ children }) => (typeof document === 'undefined' ? children : createPortal(children, document.body));

// Chiude la schermata con il gesto indietro del telefono
export const useBackClose = (onClose) => {
  const ref = React.useRef(onClose);
  ref.current = onClose;
  React.useEffect(() => pushOverlay(() => ref.current()), []);
};

export const Spinner = () => (
  <div className="flex justify-center items-center h-full py-10">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" />
  </div>
);

// Pannello a comparsa dal basso con scroll interno e blocco dello scroll della pagina
export function Sheet({ title, onClose, children, full = false, z = 70 }) {
  useBackClose(onClose);
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <Portal><div role="dialog" aria-modal="true" className="fixed inset-0 flex items-end justify-center sm:items-center" style={{ zIndex: z }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`bg-white w-full max-w-md ${full ? 'h-[92dvh]' : 'max-h-[88dvh]'} rounded-t-[32px] sm:rounded-3xl flex flex-col shadow-2xl animate-slide-up overflow-hidden relative`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <h3 className="font-display font-bold text-xl text-slate-800">{title}</h3>
          <button onClick={onClose} aria-label="Chiudi" className="p-2 bg-slate-100 rounded-full text-slate-500 active:scale-95"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 pb-safe">{children}</div>
      </div>
    </div></Portal>
  );
}

export function Confirm({ title, msg, confirmLabel = 'Sì', onConfirm, onCancel }) {
  useBackClose(onCancel);
  return (
    <Portal><div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display font-bold text-xl text-slate-900 mb-2">{title}</h3>
        {msg && <p className="text-sm text-slate-500 mb-6 leading-relaxed">{msg}</p>}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl active:scale-95">No</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl active:scale-95">{confirmLabel}</button>
        </div>
      </div>
    </div></Portal>
  );
}

export const Avatar = ({ member, size = 'w-8 h-8 text-base', active = true, onClick, title }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      title={title || member.name}
      aria-label={member.name}
      aria-pressed={onClick ? active : undefined}
      className={`${size} rounded-full flex items-center justify-center shrink-0 transition-all ${active ? 'ring-2 ring-offset-1' : 'opacity-30 grayscale'} ${onClick ? 'active:scale-90' : ''}`}
      style={{ background: `${member.color}22`, '--tw-ring-color': member.color }}
    >
      {member.emoji}
    </Tag>
  );
};

// Foto del piatto, oppure emoji su sfondo colorato
export const RecipeThumb = ({ recipe, className = 'w-14 h-14 rounded-xl text-2xl' }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden shrink-0 ${recipe.photo ? '' : categoryTint(recipe.category)}`}>
    {recipe.photo ? <img src={recipe.photo} alt="" className="w-full h-full object-cover" /> : <span>{recipe.emoji || getCategoryEmoji(recipe.category)}</span>}
  </div>
);

const DIET_STYLE = {
  vegan: ['bg-brand-100 text-brand-700', 'Vegana'],
  vegetarian: ['bg-amber-100 text-amber-700', 'Vegetariana'],
  pescetarian: ['bg-sky-100 text-sky-700', 'Pescetariana'],
  omnivore: ['bg-rose-100 text-rose-700', 'Onnivora'],
};
export const DietBadge = ({ diet }) => {
  const [cls, label] = DIET_STYLE[diet] || DIET_STYLE.omnivore;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cls}`}>{label}</span>;
};
