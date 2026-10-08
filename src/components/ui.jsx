import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { DEFAULT_EMOJI } from '../lib/format.js';
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
      className={`${size} rounded-full flex items-center justify-center shrink-0 overflow-hidden transition-all ${active ? 'ring-2 ring-offset-1' : 'opacity-30 grayscale'} ${onClick ? 'active:scale-90' : ''}`}
      style={{ background: `${member.color}22`, '--tw-ring-color': member.color }}
    >
      {member.photo ? <img src={member.photo} alt="" className="w-full h-full object-cover" /> : member.emoji}
    </Tag>
  );
};

// Foto del piatto, oppure emoji su sfondo colorato
export const RecipeThumb = ({ recipe, className = 'w-14 h-14 rounded-xl text-2xl' }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden shrink-0 ${recipe.photo ? '' : 'bg-brand-50'}`}>
    {recipe.photo ? <img src={recipe.photo} alt="" className="w-full h-full object-cover" /> : <span>{recipe.emoji || DEFAULT_EMOJI}</span>}
  </div>
);

const DIET_STYLE = {
  vegan: ['bg-brand-100 text-brand-700', 'Vegana'],
  vegetarian: ['bg-amber-100 text-amber-700', 'Vegetariana'],
  pescetarian: ['bg-sky-100 text-sky-700', 'Con pesce'],
  omnivore: ['bg-rose-100 text-rose-700', 'Con carne'],
};
export const DietBadge = ({ diet }) => {
  const [cls, label] = DIET_STYLE[diet] || DIET_STYLE.omnivore;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cls}`}>{label}</span>;
};

// Schede a segmenti: un solo gruppo di scelte alla volta, per non mostrare tutto insieme
export function Tabs({ tabs, value, onChange, label = 'Sezioni', className = '' }) {
  return (
    <div role="tablist" aria-label={label} className={`flex gap-1 bg-slate-100 rounded-2xl p-1 ${className}`}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)} className={`flex-1 min-w-0 py-2 rounded-xl text-sm font-bold truncate transition-colors ${value === t.id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>{t.label}</button>
      ))}
    </div>
  );
}

// Blocco con titolo e spiegazione breve: stesso aspetto in tutte le impostazioni
export const Block = ({ title, hint, children, className = '' }) => (
  <section className={`space-y-3 ${className}`}>
    {(title || hint) && (
      <div>
        {title && <h4 className="font-display font-bold text-base text-slate-800">{title}</h4>}
        {hint && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
    )}
    {children}
  </section>
);

// Interruttore (sì/no) con testo
export const Toggle = ({ on, onChange, label, hint, disabled }) => (
  <button role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)} className="w-full flex items-center gap-3 text-left py-1 disabled:opacity-50">
    <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-slate-700">{label}</span>{hint && <span className="block text-[11px] text-slate-400">{hint}</span>}</span>
    <span className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${on ? 'bg-brand-500' : 'bg-slate-200'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} /></span>
  </button>
);
