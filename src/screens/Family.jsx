import React from 'react';
import { Briefcase, ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useData, MEMBER_COLORS as DEFAULT_MEMBER_COLORS } from '../hooks/data.jsx';
import { Avatar, Confirm, Sheet } from '../components/ui.jsx';
import { SLOTS, mealOf } from '../lib/scale.js';
import { DIETS, dietLabel } from '../lib/diet.js';
import { DAYS } from '../lib/dates.js';
import { ALLERGENS } from '../lib/allergens.js';
import { FOOD_TYPES, GOAL_MODES, foodLabel } from '../lib/goals.js';
import { TARGET_GROUPS } from '../lib/groups.js';

const EMOJIS = ['🙂', '😎', '🧒', '👧', '👦', '👩', '👨', '👵', '👴', '🐻', '🦊', '🐱'];
const MULTS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function MemberEditor({ member, onChange, onDelete, canDelete, onClose }) {
  const [openSlot, setOpenSlot] = React.useState(null);
  const [confirm, setConfirm] = React.useState(false);
  const patchGoal = (id, patch) => onChange({ ...member, goals: member.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
  const patchMeal = (slot, patch) => onChange({ ...member, meals: { ...member.meals, [slot]: { ...(member.meals?.[slot] || {}), ...patch } } });
  const patchTarget = (slot, group, v) => {
    const targets = { ...(member.meals?.[slot]?.targets || {}) };
    if (v === '' || Number(v) <= 0) delete targets[group]; else targets[group] = Number(v);
    patchMeal(slot, { targets });
  };

  return (
    <Sheet title={member.name || 'Persona'} onClose={onClose} full>
      <div className="p-5 space-y-6">
        <div className="space-y-3">
          <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500 font-bold" value={member.name} onChange={(e) => onChange({ ...member, name: e.target.value })} placeholder="Nome" aria-label="Nome" />
          <div className="flex flex-wrap gap-2">{EMOJIS.map((e) => <button key={e} onClick={() => onChange({ ...member, emoji: e })} className={`text-2xl w-11 h-11 rounded-xl ${member.emoji === e ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-slate-50'}`}>{e}</button>)}</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Dieta</p>
            <div className="grid grid-cols-2 gap-2">{DIETS.map((d) => <button key={d.id} onClick={() => onChange({ ...member, diet: d.id })} className={`py-2.5 rounded-xl text-sm font-bold ${member.diet === d.id ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{d.label}</button>)}</div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Da evitare (allergie, cibi che non mangia)</p>
            <input className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="Es. glutine, arachidi, funghi (separati da virgola)" value={member.avoid || ''} onChange={(e) => onChange({ ...member, avoid: e.target.value })} aria-label="Ingredienti da evitare" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Intolleranze e allergie</p>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => {
                const on = (member.intolerances || []).includes(a.id);
                return <button key={a.id} onClick={() => onChange({ ...member, intolerances: on ? member.intolerances.filter((x) => x !== a.id) : [...(member.intolerances || []), a.id] })} className={`px-3 py-2 rounded-xl text-xs font-bold ${on ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-500'}`}>Senza {a.label.toLowerCase()}</button>;
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Il riconoscimento è una stima dai nomi degli ingredienti: controlla sempre le etichette, soprattutto per allergie.</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Frequenze settimanali (dalla nutrizionista)</p>
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
          <div className="flex gap-2">{DEFAULT_MEMBER_COLORS.map((c) => <button key={c} aria-label={`Colore ${c}`} onClick={() => onChange({ ...member, color: c })} className={`w-8 h-8 rounded-full ${member.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} style={{ background: c }} />)}</div>
        </div>

        <div>
          <h4 className="font-display font-bold text-lg text-slate-800 mb-1">Indicazioni della nutrizionista, pasto per pasto</h4>
          <p className="text-xs text-slate-400 mb-3">Per ogni pasto scegli se mangia e quanto. Puoi usare un moltiplicatore della porzione oppure indicare i grammi di ogni componente: l'app adatterà le dosi di ogni ricetta a quei valori.</p>
          <div className="space-y-2">
            {SLOTS.map((slot) => {
              const meal = mealOf(member, slot);
              const open = openSlot === slot;
              const nTargets = Object.keys(meal.targets).length;
              return (
                <div key={slot} className="border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="flex items-center p-3 gap-3">
                    <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={meal.eats} onChange={(e) => patchMeal(slot, { eats: e.target.checked })} aria-label={`Mangia a ${slot}`} />
                    <span className={`flex-1 font-bold ${meal.eats ? 'text-slate-700' : 'text-slate-300'}`}>{slot}</span>
                    {meal.eats && <span className="text-xs text-slate-400">{nTargets ? `${nTargets} dosi` : meal.mult !== 1 ? `x ${String(meal.mult).replace('.', ',')}` : 'standard'}</span>}
                    {meal.eats && <button onClick={() => setOpenSlot(open ? null : slot)} aria-label={`Dettagli ${slot}`} className="p-1"><ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} /></button>}
                  </div>
                  {open && meal.eats && (
                    <div className="px-3 pb-4 space-y-4 bg-slate-50/60 border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Porzione (se non indichi i grammi)</p>
                        <div className="flex gap-1.5 flex-wrap">{MULTS.map((m) => <button key={m} onClick={() => patchMeal(slot, { mult: m })} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${meal.mult === m ? 'bg-brand-500 text-white' : 'bg-white text-slate-500'}`}>x {String(m).replace('.', ',')}</button>)}</div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Dose per componente (grammi, facoltativa)</p>
                        <div className="grid grid-cols-2 gap-2">
                          {TARGET_GROUPS.map((g) => (
                            <label key={g.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                              <span>{g.emoji}</span><span className="text-xs text-slate-500 flex-1">{g.label}</span>
                              <input type="number" inputMode="numeric" min="0" className="w-14 text-right bg-slate-50 rounded-md p-1 text-sm" placeholder="-" value={meal.targets[g.id] ?? ''} onChange={(e) => patchTarget(slot, g.id, e.target.value)} aria-label={`${g.label} a ${slot}, grammi`} />
                            </label>
                          ))}
                        </div>
                      </div>
                      <input className="w-full p-2.5 bg-white rounded-xl text-sm" placeholder="Nota (es. indicazioni del nutrizionista)" value={meal.note} onChange={(e) => patchMeal(slot, { note: e.target.value })} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {canDelete && <button onClick={() => setConfirm(true)} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-2xl flex items-center justify-center gap-2 active:scale-95"><Trash2 className="w-4 h-4" /> Rimuovi dalla famiglia</button>}
      </div>
      {confirm && <Confirm title={`Rimuovere ${member.name}?`} msg="Le dosi dei pasti pianificati verranno ricalcolate senza questa persona." onConfirm={onDelete} onCancel={() => setConfirm(false)} />}
    </Sheet>
  );
}


const CAPS = [{ id: null, label: 'Nessun limite' }, ...DIETS.slice(0, 3).map((d) => ({ id: d.id, label: `Tutti ${d.label.toLowerCase().replace(/a$/, 'i')}` }))];

function RuleEditor({ rule, onChange, onDelete, onClose }) {
  const toggle = (key, v) => onChange({ ...rule, [key]: rule[key].includes(v) ? rule[key].filter((x) => x !== v) : [...rule[key], v].sort() });
  return (
    <Sheet title="Regola condivisa" onClose={onClose}>
      <div className="p-5 space-y-5">
        <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500 font-bold" value={rule.label} onChange={(e) => onChange({ ...rule, label: e.target.value })} placeholder="Nome (es. Pranzo d'asporto in settimana)" aria-label="Nome regola" />
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Pasti</p>
          <div className="flex gap-2 flex-wrap">{SLOTS.map((s) => <button key={s} onClick={() => toggle('slots', s)} className={`px-3 py-2 rounded-xl text-xs font-bold ${rule.slots.includes(s) ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{s}</button>)}</div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Giorni</p>
          <div className="flex gap-1.5">{DAYS.map((d, i) => <button key={d} onClick={() => toggle('days', i)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${rule.days.includes(i) ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{d}</button>)}</div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">In questi pasti mangiano</p>
          <div className="space-y-2">{CAPS.map((c) => <button key={String(c.id)} onClick={() => onChange({ ...rule, dietCap: c.id })} className={`w-full p-3 rounded-xl text-left font-semibold ${rule.dietCap === c.id ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-600'}`}>{c.label}</button>)}</div>
          <p className="text-xs text-slate-400 mt-2">Chi segue una dieta più ampia si adegua a quella scelta, così si cucina un solo piatto per tutti.</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cucina una volta, mangia più volte</p>
          <div className="flex gap-2">{[1, 2, 3].map((n) => <button key={n} onClick={() => onChange({ ...rule, batch: n })} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${(rule.batch || 1) === n ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{n === 1 ? 'Ogni giorno diverso' : `Stesso piatto per ${n} giorni`}</button>)}</div>
          <p className="text-xs text-slate-400 mt-2">Con "Proponi" il piatto torna come avanzo nei giorni successivi della regola.</p>
        </div>
        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl font-semibold text-slate-700"><input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={rule.takeaway} onChange={(e) => onChange({ ...rule, takeaway: e.target.checked })} /> Piatti d'asporto (da portare in contenitore)</label>
        <button onClick={onDelete} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-2xl flex items-center justify-center gap-2 active:scale-95"><Trash2 className="w-4 h-4" /> Elimina regola</button>
      </div>
    </Sheet>
  );
}

export default function Family() {
  const { household, me, saveProfile, saveRules } = useData();
  const [editing, setEditing] = React.useState(false);
  const [ruleId, setRuleId] = React.useState(null);
  const rules = household.rules || [];
  const editingRule = rules.find((r) => r.id === ruleId);
  const addRule = () => {
    const r = { id: crypto.randomUUID(), label: "Pranzo d'asporto in settimana", slots: ['Pranzo'], days: [0, 1, 2, 3, 4], dietCap: 'vegetarian', takeaway: true, batch: 1 };
    saveRules([...rules, r]);
    setRuleId(r.id);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      <h2 className="font-display font-extrabold text-2xl text-slate-900">Famiglia</h2>
      <p className="text-sm text-slate-500">Ognuno ha il proprio profilo (dieta, intolleranze, dosi per pasto) e lo modifica dal proprio account. L'app dosa ogni ricetta su chi mangia e somma tutto nella spesa. Per aggiungere qualcuno al nucleo, crea un codice in Impostazioni.</p>
      {household.members.map((m) => {
        const mine = m.id === me?.id;
        const meals = SLOTS.filter((s) => mealOf(m, s).eats);
        const Tag = mine ? 'button' : 'div';
        return (
          <Tag key={m.id} onClick={mine ? () => setEditing(true) : undefined} className={`w-full bg-white p-4 rounded-3xl shadow-soft flex items-center gap-4 text-left ${mine ? 'active:scale-[0.99] ring-2 ring-brand-100' : ''}`}>
            <Avatar member={m} size="w-12 h-12 text-2xl" />
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-lg text-slate-800">{m.name || 'Senza nome'}{mine ? ' (tu)' : ''}</h3>
              <p className="text-xs text-slate-400 truncate">{dietLabel(m.diet)}{(m.intolerances || []).length ? ` · senza ${m.intolerances.join(', ')}` : ''} · {meals.length ? meals.join(', ') : 'nessun pasto'}</p>
              {!mine && <p className="text-[11px] text-slate-300 mt-0.5">Lo modifica {m.name || 'lei'} dal suo account</p>}
            </div>
            {mine && <ChevronRight className="w-5 h-5 text-slate-300" />}
          </Tag>
        );
      })}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display font-bold text-xl text-slate-900">Regole condivise</h2>
          <button onClick={addRule} className="px-3 py-2 bg-white text-brand-700 rounded-xl font-bold text-sm shadow-soft active:scale-95">+ Regola</button>
        </div>
        <p className="text-sm text-slate-500 mb-3">Valgono per tutto il nucleo. Per cucinare un solo piatto per tutti: ad esempio il pranzo in settimana è vegetariano e d'asporto anche per chi di solito mangia carne.</p>
        {rules.length === 0 && <p className="text-xs text-slate-400 bg-white rounded-2xl p-4">Nessuna regola. Tocca "+ Regola" per partire dall'esempio del pranzo d'asporto.</p>}
        <div className="space-y-2">
          {rules.map((r) => (
            <button key={r.id} onClick={() => setRuleId(r.id)} className="w-full bg-white p-4 rounded-2xl shadow-soft flex items-center gap-3 text-left active:scale-[0.99]">
              <Briefcase className="w-5 h-5 text-brand-500" />
              <div className="flex-1 min-w-0"><h3 className="font-bold text-slate-800 truncate">{r.label || 'Regola'}</h3><p className="text-xs text-slate-400 truncate">{r.slots.join(', ')} · {r.days.map((d) => DAYS[d]).join(' ')}{r.dietCap ? ` · max ${dietLabel(r.dietCap).toLowerCase()}` : ''}{r.takeaway ? ' · asporto' : ''}{(r.batch || 1) > 1 ? ` · stesso piatto ${r.batch} giorni` : ''}</p></div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          ))}
        </div>
      </div>
      {editingRule && <RuleEditor rule={editingRule} onClose={() => setRuleId(null)} onChange={(r) => saveRules(rules.map((x) => (x.id === r.id ? r : x)))} onDelete={() => { saveRules(rules.filter((x) => x.id !== editingRule.id)); setRuleId(null); }} />}
      {editing && me && <MemberEditor member={me} onChange={saveProfile} onClose={() => setEditing(false)} canDelete={false} onDelete={() => {}} />}
    </div>
  );
}
