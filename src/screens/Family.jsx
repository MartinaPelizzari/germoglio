import React from 'react';
import { Briefcase, ChevronRight, UserPlus } from 'lucide-react';
import { useData, canEditProfile, isFreeProfile } from '../hooks/data.jsx';
import { Avatar, Block, Confirm, Tabs } from '../components/ui.jsx';
import AppliancePicker from '../components/AppliancePicker.jsx';
import ProfileEditor from './ProfileEditor.jsx';
import RuleEditor from '../components/RuleEditor.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import { SLOTS, mealOf } from '../lib/scale.js';
import { dietLabel, sharedSlotsOf } from '../lib/diet.js';
import { DAYS } from '../lib/dates.js';

export default function Family() {
  const { uid, household, recipes, me, saveProfile, saveRules, saveSettings, addManagedProfile, claimProfile, releaseProfile, deleteProfile } = useData();
  const [confirmClaim, setConfirmClaim] = React.useState(false);
  const [tab, setTab] = React.useState('people');
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
      <h2 className="font-display font-extrabold text-2xl text-slate-900">Famiglia</h2>
      <Tabs tabs={[{ id: 'people', label: 'Persone' }, { id: 'home', label: 'Casa e regole' }]} value={tab} onChange={setTab} label="Famiglia" />
      {tab === 'people' && <p className="text-sm text-slate-500">Ognuno ha il proprio profilo (dieta, piano alimentare, intolleranze). Chi non usa l'app lo crei tu: lo modificate tutti finché non lo reclama dal suo account.</p>}
      {tab === 'people' && household.members.map((m) => {
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
      {tab === 'people' && <button onClick={() => setEditId(addManagedProfile())} className="w-full py-3 bg-white text-brand-700 rounded-2xl font-bold text-sm shadow-soft flex items-center justify-center gap-2 active:scale-[0.98]"><UserPlus className="w-4 h-4" /> Aggiungi una persona senza app</button>}
      {tab === 'home' && (
        <div className="space-y-6">
          <Block title="Pasti condivisi" hint="I pasti scelti qui sono uguali per tutta la famiglia (con menu separati solo per chi segue una dieta diversa), gli altri sono individuali. Per un singolo giorno si cambia dal Planner.">
            <div className="bg-white rounded-2xl p-4 shadow-soft"><SlotPicker allowEmpty value={sharedSlotsOf(household)} onChange={(v) => saveSettings({ sharedSlots: v })} /></div>
          </Block>
          <Block title="Cucina" hint="Le ricette che richiedono ciò che non hai non vengono proposte.">
            <div className="bg-white rounded-2xl p-4 shadow-soft"><AppliancePicker recipes={recipes} value={household.appliances} onChange={(v) => saveSettings({ appliances: v ?? null })} /></div>
          </Block>
          <Block title="Regole condivise" hint="Valgono per tutto il nucleo. Con una regola si cucina un solo piatto per tutti: ad esempio il pranzo in settimana è vegetariano e d'asporto anche per chi di solito mangia carne.">
            {rules.length === 0 && <p className="text-xs text-slate-400 bg-white rounded-2xl p-4">Nessuna regola.</p>}
            <div className="space-y-2">
              {rules.map((r) => (
                <button key={r.id} onClick={() => setRuleId(r.id)} className="w-full bg-white p-4 rounded-2xl shadow-soft flex items-center gap-3 text-left active:scale-[0.99]">
                  <Briefcase className="w-5 h-5 text-brand-500" />
                  <div className="flex-1 min-w-0"><h3 className="font-bold text-slate-800 truncate">{r.label || 'Regola'}</h3><p className="text-xs text-slate-400 truncate">{r.slots.join(', ')} · {r.days.map((d) => DAYS[d]).join(' ')}{r.dietCap ? ` · max ${dietLabel(r.dietCap).toLowerCase()}` : ''}{r.takeaway ? ' · asporto' : ''}{(r.batch || 1) > 1 ? ` · stesso piatto ${r.batch} giorni` : ''}</p></div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              ))}
            </div>
            <button onClick={addRule} className="w-full py-3 bg-white text-brand-700 rounded-2xl font-bold text-sm shadow-soft active:scale-[0.98]">+ Aggiungi una regola</button>
          </Block>
        </div>
      )}
      {editingRule && <RuleEditor rule={editingRule} onClose={() => setRuleId(null)} onChange={(r) => saveRules(rules.map((x) => (x.id === r.id ? r : x)))} onDelete={() => { saveRules(rules.filter((x) => x.id !== editingRule.id)); setRuleId(null); }} />}
      {confirmClaim && editing && (
        <Confirm
          title="Sei tu questa persona?"
          msg={me?.claimedBy === uid
            ? `Adesso risulti ${me.name || 'un\'altra persona'}. Se confermi, ${me.name || 'quel profilo'} torna libero (con tutti i suoi dati) e tu diventi ${editing.name || 'questa persona'}.`
            : `Il tuo profilo attuale (${me?.name || 'senza nome'}) verrà eliminato e al suo posto userai quello di ${editing.name || 'questa persona'}, con i suoi dati. Un account è una sola persona.`}
          confirmLabel="Sì, sono io"
          onCancel={() => setConfirmClaim(false)}
          onConfirm={() => { claimProfile(editing.id); setConfirmClaim(false); setEditId(null); }}
        />
      )}
      {editing && (
        <ProfileEditor
          member={editing}
          mine={editing.id === me?.id}
          onChange={saveProfile}
          onClose={() => setEditId(null)}
          onClaim={() => (me ? setConfirmClaim(true) : (claimProfile(editing.id), setEditId(null)))}
          onRelease={editing.claimedBy === uid && editing.id !== me?.id ? () => { releaseProfile(editing.id); setEditId(null); } : undefined}
          onDelete={() => { deleteProfile(editing.id); setEditId(null); }}
        />
      )}
    </div>
  );
}
