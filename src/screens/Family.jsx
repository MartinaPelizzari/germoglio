import React from 'react';
import { Briefcase, ChevronRight, Plus, Trash2, UserPlus } from 'lucide-react';
import { useData, canEditProfile, isFreeProfile } from '../hooks/data.jsx';
import { Avatar, Sheet } from '../components/ui.jsx';
import ProfileEditor from './ProfileEditor.jsx';
import { SLOTS, mealOf } from '../lib/scale.js';
import { DIETS, dietLabel } from '../lib/diet.js';
import { DAYS } from '../lib/dates.js';

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
  const { uid, household, me, saveProfile, saveRules, addManagedProfile, claimProfile, deleteProfile } = useData();
  const [editId, setEditId] = React.useState(null);
  const [ruleId, setRuleId] = React.useState(null);
  const rules = household.rules || [];
  const editingRule = rules.find((r) => r.id === ruleId);
  const editing = household.members.find((m) => m.id === editId);
  const addRule = () => {
    const r = { id: crypto.randomUUID(), label: "Pranzo d'asporto in settimana", slots: ['Pranzo'], days: [0, 1, 2, 3, 4], dietCap: 'vegetarian', takeaway: true, batch: 1 };
    saveRules([...rules, r]);
    setRuleId(r.id);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-extrabold text-2xl text-slate-900">Famiglia</h2>
        <button onClick={() => setEditId(addManagedProfile())} className="px-3 py-2.5 bg-brand-500 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-glow active:scale-95"><UserPlus className="w-4 h-4" /> Persona senza app</button>
      </div>
      <p className="text-sm text-slate-500">Ognuno ha il proprio profilo (dieta, piano alimentare, intolleranze) e lo modifica dal proprio account. Chi non usa l'app lo crei tu qui: lo modificate tutti finché quella persona non lo reclama dal suo account. Per far entrare qualcuno nel nucleo, crea un codice in Impostazioni.</p>
      {household.members.map((m) => {
        const editable = canEditProfile(m, uid);
        const free = isFreeProfile(m);
        const meals = SLOTS.filter((s) => mealOf(m, s).eats);
        const hasPlan = SLOTS.some((s) => mealOf(m, s).plan.length);
        return (
          <button key={m.id} onClick={editable || free ? () => setEditId(m.id) : undefined} className={`w-full bg-white p-4 rounded-3xl shadow-soft flex items-center gap-4 text-left ${m.id === me?.id ? 'ring-2 ring-brand-100' : ''} ${editable ? 'active:scale-[0.99]' : 'cursor-default'}`}>
            <Avatar member={m} size="w-12 h-12 text-2xl" />
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-lg text-slate-800">{m.name || 'Senza nome'}{m.id === me?.id ? ' (tu)' : ''}</h3>
              <p className="text-xs text-slate-400 truncate">{dietLabel(m.diet)}{(m.intolerances || []).length ? ` · senza ${m.intolerances.join(', ')}` : ''} · {hasPlan ? 'piano scritto' : meals.length ? meals.join(', ') : 'nessun pasto'}</p>
              {free && <p className="text-[11px] text-brand-700 mt-0.5">Senza app: modificabile da tutti</p>}
              {!editable && !free && <p className="text-[11px] text-slate-300 mt-0.5">Lo modifica {m.name || 'lei'} dal suo account</p>}
            </div>
            {(editable || free) && <ChevronRight className="w-5 h-5 text-slate-300" />}
          </button>
        );
      })}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display font-bold text-xl text-slate-900">Regole condivise</h2>
          <button onClick={addRule} className="px-3 py-2 bg-white text-brand-700 rounded-xl font-bold text-sm shadow-soft active:scale-95">+ Regola</button>
        </div>
        <p className="text-sm text-slate-500 mb-3">Valgono per tutto il nucleo. Se non c'è una regola, chi segue una dieta diversa ha il suo menu a pranzo e a cena. Con una regola si cucina un solo piatto per tutti: ad esempio il pranzo in settimana è vegetariano e d'asporto anche per chi di solito mangia carne.</p>
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
      {editing && (
        <ProfileEditor
          member={editing}
          mine={editing.id === me?.id}
          onChange={saveProfile}
          onClose={() => setEditId(null)}
          onClaim={() => { claimProfile(editing.id); setEditId(null); }}
          onDelete={() => { deleteProfile(editing.id); setEditId(null); }}
        />
      )}
    </div>
  );
}
