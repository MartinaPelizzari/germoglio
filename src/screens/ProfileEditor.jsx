import React from 'react';
import { Camera, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import PlanSource from '../components/PlanSource.jsx';
import { MEMBER_COLORS, MEMBER_EMOJIS, isFreeProfile } from '../hooks/data.jsx';
import { Confirm, Sheet, Avatar } from '../components/ui.jsx';
import { SLOTS, mealOf } from '../lib/scale.js';
import { DIETS } from '../lib/diet.js';
import { ALLERGENS } from '../lib/allergens.js';
import { FOOD_TYPES, GOAL_MODES } from '../lib/goals.js';
import { parseSlotPlan } from '../lib/dietPlan.js';
import PlanBox from '../components/PlanBox.jsx';
import { VisibleSlots } from '../components/SlotPicker.jsx';
import BalanceMode from '../components/BalanceMode.jsx';
import PlanImport, { mealsFromTexts } from '../components/PlanImport.jsx';
import { compressImage } from '../lib/image.js';

const MULTS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Importa il piano da PDF o testo e lo applica ai pasti dopo la verifica
function PlanImportBlock({ member, onChange }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mb-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full py-3 bg-brand-50 text-brand-700 font-bold rounded-xl active:scale-95">Carica il PDF del piano o incolla il testo</button>
      ) : (
        <PlanImport applyLabel="Applica ai pasti" onApply={(texts) => { onChange({ ...member, meals: mealsFromTexts(texts, member.meals) }); setOpen(false); }} onSkip={() => setOpen(false)} />
      )}
    </div>
  );
}

export default function ProfileEditor({ member, mine, title, intro, onChange, onClaim, onRelease, canClaim = true, onDelete, onClose }) {
  const [openSlot, setOpenSlot] = React.useState(null);
  const [confirm, setConfirm] = React.useState(false);
  const [photoBusy, setPhotoBusy] = React.useState(false);
  const fileRef = React.useRef(null);
  const free = isFreeProfile(member);

  const patchMeal = (slot, patch) => onChange({ ...member, meals: { ...member.meals, [slot]: { ...(member.meals?.[slot] || {}), ...patch } } });
  const setPlanText = (slot, text) => patchMeal(slot, { planText: text, plan: parseSlotPlan(text) });
  const patchGoal = (id, patch) => onChange({ ...member, goals: member.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) });

  const pickPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoBusy(true);
    try { onChange({ ...member, photo: await compressImage(f, 256, 0.8) }); } catch { alert('Non riesco a leggere questa foto.'); }
    setPhotoBusy(false);
    e.target.value = '';
  };

  const chip = (on) => `px-3 py-2 rounded-xl text-xs font-bold ${on ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`;
  const label = 'text-[10px] font-bold text-slate-400 uppercase mb-2';

  return (
    <Sheet title={title || member.name || 'Persona'} onClose={onClose} full>
      <div className="p-5 space-y-6">
        {intro && <p className="text-sm text-brand-800 bg-brand-50 rounded-2xl p-4">{intro}</p>}
        {onRelease && (
          <div className="bg-amber-50 rounded-2xl p-4 space-y-2">
            <p className="text-sm text-amber-800">Hai reclamato questo profilo, ma il tuo è un altro. Se non sei tu, rilascialo: tornerà modificabile da tutti.</p>
            <button onClick={onRelease} className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-xl active:scale-95">Non sono io: rilascia</button>
          </div>
        )}
        {free && !mine && canClaim && (
          <div className="bg-brand-50 rounded-2xl p-4 space-y-2">
            <p className="text-sm text-brand-800">Questa persona non ha un account: la modificate tutti. Se è il tuo profilo, reclamalo: da quel momento lo modifichi solo tu.</p>
            <button onClick={onClaim} className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl active:scale-95">Questo profilo sono io</button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button onClick={() => fileRef.current?.click()} aria-label="Cambia foto" className="relative shrink-0">
            <Avatar member={member} size="w-20 h-20 text-4xl" />
            <span className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow"><Camera className="w-4 h-4 text-slate-600" /></span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          <div className="flex-1 space-y-2">
            <input className="w-full p-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500 font-bold" value={member.name} onChange={(e) => onChange({ ...member, name: e.target.value })} placeholder="Nome" aria-label="Nome" />
            {member.photo && <button onClick={() => onChange({ ...member, photo: null })} className="text-xs font-bold text-red-500">Togli la foto</button>}
            {photoBusy && <p className="text-xs text-slate-400">Carico la foto...</p>}
          </div>
        </div>
        {!member.photo && (
          <div className="flex flex-wrap gap-2">{MEMBER_EMOJIS.map((e) => <button key={e} onClick={() => onChange({ ...member, emoji: e })} className={`text-2xl w-11 h-11 rounded-xl ${member.emoji === e ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-slate-50'}`}>{e}</button>)}</div>
        )}
        <div className="flex gap-2">{MEMBER_COLORS.map((c) => <button key={c} aria-label={`Colore ${c}`} onClick={() => onChange({ ...member, color: c })} className={`w-8 h-8 rounded-full ${member.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} style={{ background: c }} />)}</div>

        <div>
          <p className={label}>Dieta</p>
          <div className="grid grid-cols-2 gap-2">{DIETS.map((d) => <button key={d.id} onClick={() => onChange({ ...member, diet: d.id })} className={chip(member.diet === d.id)}>{d.label}</button>)}</div>
        </div>
        <VisibleSlots member={member} onChange={onChange} />
        <div>
          <p className={label}>Da evitare (allergie, cibi che non mangia)</p>
          <input className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="Es. glutine, arachidi, funghi (separati da virgola)" value={member.avoid || ''} onChange={(e) => onChange({ ...member, avoid: e.target.value })} aria-label="Ingredienti da evitare" />
        </div>
        <div>
          <p className={label}>Intolleranze e allergie</p>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => {
              const on = (member.intolerances || []).includes(a.id);
              return <button key={a.id} onClick={() => onChange({ ...member, intolerances: on ? member.intolerances.filter((x) => x !== a.id) : [...(member.intolerances || []), a.id] })} className={`px-3 py-2 rounded-xl text-xs font-bold ${on ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-500'}`}>Senza {a.label.toLowerCase()}</button>;
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Il riconoscimento è una stima dai nomi degli ingredienti: controlla sempre le etichette, soprattutto per le allergie.</p>
        </div>
        <div>
          <p className={label}>Frequenze settimanali (dalla nutrizionista)</p>
          <div className="space-y-2">
            {(member.goals || []).map((g) => (
              <div key={g.id} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
                <select className="bg-white rounded-lg p-2 text-xs font-bold text-slate-600" value={g.mode} onChange={(e) => patchGoal(g.id, { mode: e.target.value })} aria-label="Modalità">{GOAL_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
                <input type="number" inputMode="numeric" min="0" max="21" className="w-12 text-center bg-white rounded-lg p-2 text-sm" value={g.times} onChange={(e) => patchGoal(g.id, { times: Math.max(0, Number(e.target.value) || 0) })} aria-label="Volte a settimana" />
                <span className="text-xs text-slate-400">volte</span>
                <select className="flex-1 min-w-0 bg-white rounded-lg p-2 text-xs font-bold text-slate-600" value={g.food} onChange={(e) => patchGoal(g.id, { food: e.target.value })} aria-label="Alimento">{FOOD_TYPES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
                <button onClick={() => onChange({ ...member, goals: member.goals.filter((x) => x.id !== g.id) })} aria-label="Elimina" className="p-1.5 text-slate-300"><X className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => onChange({ ...member, goals: [...(member.goals || []), { id: crypto.randomUUID(), food: 'legumi', times: 3, mode: 'min' }] })} className="px-3 py-2 bg-white border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 flex items-center gap-1.5 active:scale-95"><Plus className="w-3.5 h-3.5" /> Aggiungi frequenza (es. legumi 3 volte)</button>
          </div>
        </div>

        <div>
          <h4 className="font-display font-bold text-lg text-slate-800 mb-3">Piano alimentare</h4>
          <div className="mb-5"><PlanSource member={member} onChange={onChange} /></div>
          {member.planSource && <label className="flex items-start gap-3 mb-5 text-sm text-slate-700"><input type="checkbox" className="w-5 h-5 mt-0.5 accent-emerald-500" checked={!member.checkinOff} onChange={(e) => onChange({ ...member, checkinOff: !e.target.checked })} /> Una domanda a settimana su come mi sento (la tolgo quando voglio)</label>}
          <div className="mb-4"><BalanceMode member={member} onChange={onChange} /></div>
          <p className="text-xs text-slate-400 mb-3">Scrivi cosa può mangiare in ogni pasto, come l'ha scritto la nutrizionista. L'app propone ricette che rispettano il piano e mette le dosi indicate. Esempio: "150 g yogurt oppure 30 g pane".</p>
          {member.planSource !== 'auto' && <PlanImportBlock member={member} onChange={onChange} />}

          <div className="space-y-2">
            {SLOTS.map((slot) => {
              const meal = mealOf(member, slot);
              const open = openSlot === slot;
              return (
                <div key={slot} className="border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="flex items-center p-3 gap-3">
                    <span className={`flex-1 font-bold ${meal.eats ? 'text-slate-700' : 'text-slate-300'}`}>{slot}</span>
                    {meal.eats && <span className="text-xs text-slate-400">{meal.plan.length ? `piano: ${meal.plan.length} ${meal.plan.length === 1 ? 'gruppo' : 'gruppi'}` : meal.mult !== 1 ? `x ${String(meal.mult).replace('.', ',')}` : 'standard'}</span>}
                    {meal.eats && <button onClick={() => setOpenSlot(open ? null : slot)} aria-label={`Dettagli ${slot}`} className="p-1"><ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} /></button>}
                  </div>
                  {open && meal.eats && (
                    <div className="px-3 pb-4 space-y-4 bg-slate-50/60 border-t border-slate-100 pt-3">
                      <div>
                        <p className={label}>Piano di questo pasto</p>
                        <PlanBox text={meal.planText} onText={(t) => setPlanText(slot, t)} />
                      </div>
                      <div>
                        <p className={label}>Porzione (per gli alimenti non indicati nel piano)</p>
                        <div className="flex gap-1.5 flex-wrap">{MULTS.map((m) => <button key={m} onClick={() => patchMeal(slot, { mult: m })} className={chip(meal.mult === m)}>x {String(m).replace('.', ',')}</button>)}</div>
                      </div>
                      <input className="w-full p-2.5 bg-white rounded-xl text-sm" placeholder="Nota (es. indicazioni aggiuntive)" value={meal.note} onChange={(e) => patchMeal(slot, { note: e.target.value })} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {onDelete && free && <button onClick={() => setConfirm(true)} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-2xl flex items-center justify-center gap-2 active:scale-95"><Trash2 className="w-4 h-4" /> Elimina questa persona</button>}
      </div>
      {confirm && <Confirm title={`Eliminare ${member.name || 'questa persona'}?`} msg="I menù già pianificati non la contano più." confirmLabel="Elimina" onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); onDelete(); }} />}
    </Sheet>
  );
}
