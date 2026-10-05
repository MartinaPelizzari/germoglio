import React from 'react';
import { AlertTriangle, Briefcase, User, Users, ChevronDown, ChevronLeft, ChevronRight, Clock, CopyPlus, Heart, MoreHorizontal, Plus, RotateCw, Search, Sparkles, Target, Trash2, UserPlus, Wand2 } from 'lucide-react';
import { useData, useWeekPlan } from '../hooks/data.jsx';
import { Avatar, Confirm, RecipeThumb, Sheet } from '../components/ui.jsx';
import RecipePicker from './RecipePicker.jsx';
import RecipeDetail from './RecipeDetail.jsx';
import GuestSheet from './GuestSheet.jsx';
import { DAYS, addWeeks, dayNumber, getWeekId, weekRangeLabel } from '../lib/dates.js';
import { SLOTS, eatersOf, formatQty, mealOf, scaleRecipe, slotPeople } from '../lib/scale.js';
import { coarseRequired, generateWeek, missingGroups, newState, pairLabel, proposeMenu, registerMeal, swapRecipe, uncoveredPairs } from '../lib/planGen.js';
import { goalStatus, foodLabel, weekCounts, weekSets } from '../lib/goals.js';
import { buildRecency } from '../lib/usage.js';
import { isSharedSlot, mealConstraints, menuClusters, problemsFor, rulesFor } from '../lib/diet.js';
import { resolveItem } from '../lib/items.js';
import { GROUPS } from '../lib/groups.js';
import { DEFAULT_EMOJI, timeLabel } from '../lib/format.js';

const GROUP_EMOJI = Object.fromEntries(GROUPS.map((g) => [g.id, g.emoji]));
const GROUP_NAME = Object.fromEntries(GROUPS.map((g) => [g.id, g.label.toLowerCase()]));

export default function Planner({ weekDate, setWeekDate, dayIndex, setDayIndex, viewMode, onEdit, onDuplicate, onDelete }) {
  const { hid, household, me, recipes, recipeMap, favorites, plans } = useData();
  const personal = viewMode === 'me' && me;
  const weekId = getWeekId(weekDate);
  const { plan, saveSlot, replaceAll } = useWeekPlan(hid, weekId);
  const [picker, setPicker] = React.useState(null); // { slot, action, index, pair, group }
  const [menu, setMenu] = React.useState(null);
  const [view, setView] = React.useState(null);
  const [confirm, setConfirm] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [goalsOpen, setGoalsOpen] = React.useState(false);
  const [leftover, setLeftover] = React.useState(null);
  const [guestFor, setGuestFor] = React.useState(null);
  const [joinFor, setJoinFor] = React.useState(null); // pasto individuale a cui aggiungere familiari
  const [modeFor, setModeFor] = React.useState(null); // { slot, mode }: cambio tra pasto condiviso e individuale
  const recency = React.useMemo(() => buildRecency(plans, weekId), [plans, weekId]);

  const data = (slot) => plan.days?.[dayIndex]?.[slot];
  const items = (slot) => data(slot)?.items || [];
  const people = (slot) => slotPeople(household, slot, data(slot));
  const resolve = (item) => resolveItem(item, recipeMap);
  const eatersFor = (item, slot) => eatersOf(item, household, slot, data(slot));
  const constraintsFor = (slot, eaters = people(slot)) => mealConstraints(household, dayIndex, slot, eaters.length ? eaters : household.members);
  const shared = (slot) => isSharedSlot(household, slot, data(slot));
  // Nei pasti individuali ognuno vede solo il proprio menu (e quello di chi ci ha aggiunto); i pasti condivisi li vedono tutti
  const mineOnly = (slot) => personal || !shared(slot);
  // Vista personale: solo i pasti e i piatti in cui ci sono io
  const iEat = (item, slot) => eatersFor(item, slot).some((m) => m.id === me?.id);
  const mySlots = me?.visibleSlots || SLOTS;
  const visibleSlots = SLOTS.filter((s) => mySlots.includes(s) && (mineOnly(s) ? (me && (people(s).some((m) => m.id === me.id) || items(s).some((it) => iEat(it, s)))) : (people(s).length || items(s).length)));
  const hasPlan = Object.keys(plan.days || {}).length > 0;
  const entry = (sel, eaters) => ({ instanceId: crypto.randomUUID(), ...(sel.food ? { food: sel.food } : { recipeId: sel.recipe.id }), ...(eaters ? { eaters } : {}) });
  const save = (slot, list) => saveSlot(dayIndex, slot, { items: list });
  // Nei pasti individuali un piatto aggiunto a mano è il mio (e di chi ho aggiunto al mio pasto)
  const defaultEaters = (slot) => (isSharedSlot(household, slot) || !me ? undefined : [me.id, ...(data(slot)?.joined?.[me.id] || [])]);
  // Aggiunge o toglie familiari al mio pasto individuale: il loro menu individuale di quel pasto viene sostituito dal mio
  const setJoined = (slot, ids) => {
    const prev = data(slot)?.joined?.[me.id] || [];
    const list = items(slot)
      .filter((it) => !(Array.isArray(it.eaters) && it.eaters.length === 1 && ids.includes(it.eaters[0]) && !prev.includes(it.eaters[0])))
      .map((it) => (Array.isArray(it.eaters) && it.eaters.includes(me.id) ? { ...it, eaters: [me.id, ...ids] } : it));
    saveSlot(dayIndex, slot, { items: list, joined: { ...(data(slot)?.joined || {}), [me.id]: ids } });
  };
  const setAbsent = (slot, id) => { const cur = data(slot)?.absent || []; saveSlot(dayIndex, slot, { items: items(slot), absent: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] }); };
  const setGuests = (slot, guests) => saveSlot(dayIndex, slot, { items: items(slot), guests });

  const generate = () => {
    if (!recipes.length) return;
    replaceAll(generateWeek(recipes, household, { favorites, recency, existing: plan.days }));
    setConfirm(false);
    setNotice('');
  };

  // Proposta per un pasto: un menu per ogni gruppo di persone con dieta diversa (se nessuna regola impone lo stesso piatto)
  const proposeSlot = (slot) => {
    const ppl = people(slot);
    const shared = isSharedSlot(household, slot, data(slot));
    const without = { days: { ...plan.days, [dayIndex]: { ...(plan.days?.[dayIndex] || {}), [slot]: undefined } } };
    const state = newState({ favorites, recency, counts: weekSets(without, household, recipeMap) });
    const out = [];
    let relaxed = false;
    const all = menuClusters(household, dayIndex, slot, ppl, data(slot));
    // pasto individuale: si rifà solo il mio menu, quello degli altri non si tocca
    const mine = shared || !me || !ppl.some((p) => p.id === me.id) ? all : all.filter((c) => c.eaters.some((e) => e.id === me.id));
    for (const cluster of mine) {
      const r = proposeMenu(recipes, constraintsFor(slot, cluster.eaters), slot, state, cluster);
      relaxed = relaxed || r.relaxed;
      registerMeal(state, r.items, cluster.eaters, dayIndex, slot, recipeMap, ppl);
      out.push(...r.items);
    }
    if (!out.length) return setNotice(`Nessuna proposta adatta per ${slot.toLowerCase()}. Controlla dieta, piano e regole in Famiglia.`);
    setNotice(relaxed ? "Non ho trovato ricette d'asporto adatte: ne ho proposta una normale." : '');
    const mineIds = new Set(mine.flatMap((c) => c.eaters.map((e) => e.id)));
    const keep = shared ? [] : items(slot).filter((it) => !eatersFor(it, slot).some((e) => mineIds.has(e.id)));
    save(slot, [...keep, ...out]);
  };

  // Passa un singolo pasto di questo giorno da condiviso a individuale (o viceversa) e ricalcola i menu di tutti
  const changeMode = (slot, mode) => {
    const d0 = data(slot) || {};
    const nd = { ...d0, mode, joined: undefined };
    const ppl = slotPeople(household, slot, d0);
    setModeFor(null);
    const state = newState({ favorites, recency, counts: {} });
    const out = [];
    for (const cluster of menuClusters(household, dayIndex, slot, ppl, nd)) {
      const r = proposeMenu(recipes, constraintsFor(slot, cluster.eaters), slot, state, cluster);
      registerMeal(state, r.items, cluster.eaters, dayIndex, slot, recipeMap, ppl);
      out.push(...r.items);
    }
    saveSlot(dayIndex, slot, { items: out, mode, joined: Object.fromEntries(Object.keys(d0.joined || {}).map((k) => [k, []])) });
  };

  const pick = (sel) => {
    const { slot, action, index, pair } = picker;
    setPicker(null);
    const list = items(slot);
    if (action === 'replace') save(slot, list.map((it, i) => (i === index ? { ...entry(sel), ...(it.eaters ? { eaters: it.eaters } : {}) } : it)));
    else save(slot, [...list, entry(sel, pair ? [pair.eater.id] : defaultEaters(slot))]);
  };

  const swap = (slot, index) => {
    const list = items(slot);
    const cur = resolve(list[index]);
    const next = swapRecipe(recipes, cur, constraintsFor(slot, eatersFor(list[index], slot)), { favorites, recency }, slot);
    if (!next) return setNotice('Non ci sono altre ricette adatte da proporre.');
    if (list[index].eaters) next.eaters = list[index].eaters;
    save(slot, list.map((it, i) => (i === index ? next : it)));
  };

  const addLeftovers = (item, targetDays, targetSlot) => {
    targetDays.forEach((d) => {
      const existing = plan.days?.[d]?.[targetSlot]?.items || [];
      saveSlot(d, targetSlot, { items: [...existing, { instanceId: crypto.randomUUID(), ...(item.food ? { food: item.food } : { recipeId: item.recipeId }), leftoverOf: item.instanceId, leftoverDay: dayIndex, ...(item.eaters ? { eaters: item.eaters } : {}) }] });
    });
    setLeftover(null);
  };

  const remove = (slot, index) => save(slot, items(slot).filter((_, i) => i !== index));

  const toggleEater = (slot, index, memberId) => {
    const list = items(slot);
    const current = eatersFor(list[index], slot).map((m) => m.id);
    const next = current.includes(memberId) ? current.filter((i) => i !== memberId) : [...current, memberId];
    save(slot, list.map((it, i) => (i === index ? { ...it, eaters: next } : it)));
  };

  // Cosa manca in un pasto: gruppi del piano della nutrizionista non coperti, oppure componenti (senza piano)
  const missingFor = (slot) => {
    const recs = items(slot).map((it) => ({ r: resolve(it), it })).filter((x) => x.r);
    const out = [];
    for (const p of people(slot)) {
      if (mineOnly(slot) && p.id !== me.id) continue;
      const mine = recs.filter(({ it }) => eatersFor(it, slot).some((e) => e.id === p.id)).map((x) => x.r);
      if (mealOf(p, slot).plan.length) uncoveredPairs(mine, [p], slot).forEach((pair) => out.push({ key: `${p.id}:${pair.gi}`, label: `${people(slot).length > 1 ? `${p.name}: ` : ''}${pairLabel(pair)}`, pair }));
    }
    const noPlan = people(slot).filter((p) => !mealOf(p, slot).plan.length && (!mineOnly(slot) || p.id === me.id));
    if (noPlan.length && recs.length) {
      const mine = recs.filter(({ it }) => eatersFor(it, slot).some((e) => noPlan.some((n) => n.id === e.id))).map((x) => x.r);
      missingGroups(coarseRequired(slot), mine).forEach((g) => out.push({ key: `g:${g}`, label: GROUP_NAME[g], group: g }));
    }
    return out;
  };

  const renderItem = (item, slot, index) => {
    const recipe = resolve(item);
    if (!recipe) {
      return (
        <div key={item.instanceId || index} className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between text-sm text-slate-400">
          Ricetta non più disponibile
          <button onClick={() => remove(slot, index)} aria-label="Rimuovi" className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
        </div>
      );
    }
    const eaters = eatersFor(item, slot);
    const problems = problemsFor(recipe, household, dayIndex, slot, eaters);
    const doses = recipe.isFood ? eaters.map((e) => { const q = scaleRecipe(recipe, mealOf(e, slot))[0]; return `${personal ? '' : `${e.name} `}${formatQty(q.qty, q.unit)}`.trim(); }) : [];
    return (
      <div key={item.instanceId || index} className="bg-brand-50 border border-brand-100 rounded-2xl p-3 flex flex-col gap-2 shadow-sm animate-fade-in">
        <div className={`flex items-center gap-3 ${recipe.isFood ? '' : 'cursor-pointer'}`} onClick={recipe.isFood ? undefined : () => setView({ recipe, slot, item })} role={recipe.isFood ? undefined : 'button'} aria-label={recipe.isFood ? undefined : `Dettagli: ${recipe.title}`}>
          <RecipeThumb recipe={recipe} className="w-14 h-14 rounded-xl text-2xl" />
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-slate-800 text-sm leading-snug line-clamp-2">{recipe.title}</h4>
            {recipe.isFood
              ? <span className="text-[11px] text-slate-500">Alimento dal piano: {doses.join(' · ')}</span>
              : <span className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5"><Clock className="w-3 h-3" /> {timeLabel(recipe)}{recipe.takeaway ? ' · asporto' : ''}</span>}
            {item.leftoverOf && <span className="inline-block mt-1 text-[10px] font-bold text-brand-700 bg-white rounded-full px-2 py-0.5">Avanzi di {DAYS[item.leftoverDay] ?? 'un altro giorno'}</span>}
            {favorites.has(recipe.id) && <Heart className="inline w-3 h-3 ml-1 fill-rose-500 text-rose-500" />}
          </div>
        </div>
        {problems.length > 0 && <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> Non adatta: {problems.join('; ')}</p>}
        <div className="flex justify-between items-center">
          <div className="flex gap-1.5" role="group" aria-label="Chi lo mangia">
            {[...household.members, ...(data(slot)?.guests || [])].filter((m) => people(slot).some((p) => p.id === m.id) || eaters.some((e) => e.id === m.id)).map((m) => {
              const on = eaters.some((e) => e.id === m.id);
              return <Avatar key={m.id} member={m} active={on} onClick={() => toggleEater(slot, index, m.id)} title={`${m.name}: ${on ? 'mangia' : 'non mangia'}`} />;
            })}
          </div>
          <button onClick={() => setMenu({ slot, index, recipe })} aria-label="Opzioni" className="text-slate-400 p-2 rounded-xl active:scale-90"><MoreHorizontal className="w-5 h-5" /></button>
        </div>
      </div>
    );
  };

  // Piatti del pasto raggruppati per chi li mangia: più gruppi = menu separati
  const menusOf = (slot) => {
    const groups = new Map();
    items(slot).forEach((it, i) => {
      if (mineOnly(slot) && !iEat(it, slot)) return;
      const eaters = eatersFor(it, slot);
      const key = eaters.map((e) => e.id).sort().join(',');
      if (!groups.has(key)) groups.set(key, { eaters, list: [] });
      groups.get(key).list.push([it, i]);
    });
    return [...groups.values()];
  };

  const counts = React.useMemo(() => weekCounts(plan, household, recipeMap), [plan, household, recipeMap]);
  const membersWithGoals = household.members.filter((m) => (m.goals || []).length && (!personal || m.id === me.id));
  const pickerSlot = picker?.slot;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-white p-4 rounded-3xl shadow-soft flex items-center justify-between">
        <button onClick={() => { setWeekDate(addWeeks(weekDate, -1)); setDayIndex(0); }} aria-label="Settimana precedente" className="p-2 rounded-full active:scale-90"><ChevronLeft className="text-slate-400" /></button>
        <div className="text-center"><p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Settimana</p><h2 className="text-lg font-display font-bold text-slate-800">{weekRangeLabel(weekDate)}</h2></div>
        <button onClick={() => { setWeekDate(addWeeks(weekDate, 1)); setDayIndex(0); }} aria-label="Settimana successiva" className="p-2 rounded-full active:scale-90"><ChevronRight className="text-slate-400" /></button>
      </div>

      <div className="flex gap-1.5 pb-2" role="tablist">
        {DAYS.map((day, idx) => (
          <button key={day} onClick={() => setDayIndex(idx)} role="tab" aria-selected={dayIndex === idx} className={`flex-1 min-w-0 h-[4.5rem] rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${dayIndex === idx ? 'bg-brand-500 text-white shadow-glow' : 'bg-white text-slate-400 shadow-sm'}`}>
            <span className="text-xs font-medium opacity-80">{day}</span>
            <span className="font-display font-bold text-lg">{dayNumber(weekDate, idx)}</span>
          </button>
        ))}
      </div>

      {membersWithGoals.length > 0 && (
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
          <button onClick={() => setGoalsOpen(!goalsOpen)} className="w-full p-4 flex items-center gap-2 text-left">
            <Target className="w-5 h-5 text-brand-600" />
            <span className="flex-1 font-display font-bold text-slate-800">Obiettivi della settimana</span>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${goalsOpen ? 'rotate-180' : ''}`} />
          </button>
          {goalsOpen && (
            <div className="px-4 pb-4 space-y-4">
              {membersWithGoals.map((m) => (
                <div key={m.id}>
                  <div className="flex items-center gap-2 mb-2"><Avatar member={m} size="w-6 h-6 text-sm" /><span className="text-sm font-bold text-slate-700">{m.name}</span></div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.goals.map((g) => {
                      const n = counts[m.id]?.[g.food] || 0;
                      const st = goalStatus(g, n);
                      return <span key={g.id} className={`text-xs font-semibold rounded-full px-2.5 py-1 ${st === 'ok' ? 'bg-brand-50 text-brand-700' : st === 'short' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{foodLabel(g.food)} {n}/{g.times}{g.mode === 'max' ? ' max' : g.mode === 'exact' ? ' esatti' : ''}</span>;
                    })}
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-slate-400">Conta i pasti della settimana in cui ognuno mangia quell'alimento. Con "Proponi" l'app cerca di rispettare gli obiettivi, ma non li garantisce: controlla qui.</p>
            </div>
          )}
        </div>
      )}

      <button onClick={() => (hasPlan ? setConfirm(true) : generate())} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-display font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95">
        <Wand2 className="w-5 h-5" /> Proponi la settimana
      </button>
      {notice && <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-2xl">{notice}</p>}

      <div className="space-y-4">
        {visibleSlots.map((slot) => {
          const rules = rulesFor(household, dayIndex, slot);
          const missing = items(slot).length ? missingFor(slot) : [];
          const menus = menusOf(slot);
          return (
            <div key={slot} className="bg-white rounded-[24px] p-4 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">{slot}</span>
                  <button onClick={() => setPicker({ slot, action: 'add' })} aria-label={`Aggiungi a ${slot}`} className="w-9 h-9 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center active:scale-90"><Plus className="w-5 h-5" /></button>
                </div>
                <button onClick={() => proposeSlot(slot)} aria-label={`Proponi ${slot}`} className="px-3 py-2 bg-slate-50 rounded-full text-slate-600 text-xs font-bold flex items-center gap-1.5 active:scale-95"><Sparkles className="w-4 h-4" /> Proponi</button>
              </div>
              <button onClick={() => setModeFor({ slot, mode: isSharedSlot(household, slot, data(slot)) ? 'individual' : 'shared' })} aria-label={`Pasto ${isSharedSlot(household, slot, data(slot)) ? 'condiviso' : 'individuale'}: tocca per cambiare`} className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 active:scale-95">
                {isSharedSlot(household, slot, data(slot)) ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                {isSharedSlot(household, slot, data(slot)) ? 'Condiviso con la famiglia' : 'Individuale'} · cambia
              </button>
              {isSharedSlot(household, slot, data(slot)) ? (!personal && (
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {household.members.filter((m) => mealOf(m, slot).eats).map((m) => {
                    const here = !(data(slot)?.absent || []).includes(m.id);
                    return <Avatar key={m.id} member={m} active={here} onClick={() => setAbsent(slot, m.id)} title={here ? `${m.name} c'è: tocca se non c'è` : `${m.name} non c'è`} />;
                  })}
                  {(data(slot)?.guests || []).map((g) => (
                    <button key={g.id} onClick={() => setGuests(slot, data(slot).guests.filter((x) => x.id !== g.id))} title={`Togli ${g.name}`} aria-label={`Togli ospite ${g.name}`} className="px-2 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 active:scale-95">{g.emoji} {g.name} ✕</button>
                  ))}
                  <button onClick={() => setGuestFor(slot)} aria-label="Aggiungi ospite" className="px-2.5 py-1.5 rounded-full bg-slate-50 text-[11px] font-bold text-slate-500 flex items-center gap-1 active:scale-95"><UserPlus className="w-3.5 h-3.5" /> Ospite</button>
                </div>
              )) : me && people(slot).some((p) => p.id === me.id) && (
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Pasto individuale</span>
                  {(data(slot)?.joined?.[me.id] || []).map((id) => { const m = household.members.find((x) => x.id === id); return m ? <Avatar key={id} member={m} title={`${m.name} mangia con te`} /> : null; })}
                  {household.members.some((m) => m.id !== me.id && mealOf(m, slot).eats) && (
                    <button onClick={() => setJoinFor(slot)} aria-label="Aggiungi un familiare al mio pasto" className="px-2.5 py-1.5 rounded-full bg-slate-50 text-[11px] font-bold text-slate-500 flex items-center gap-1 active:scale-95"><UserPlus className="w-3.5 h-3.5" /> Aggiungi persone</button>
                  )}
                </div>
              )}
              {rules.length > 0 && (
                <p className="text-[11px] text-brand-700 bg-brand-50 rounded-lg px-2 py-1 mb-2 flex items-center gap-1"><Briefcase className="w-3 h-3" /> {rules.map((r) => r.label).join(', ')}</p>
              )}
              {missing.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {missing.map((m) => <button key={m.key} onClick={() => setPicker({ slot, action: 'add', pair: m.pair, group: m.group })} className="text-[11px] font-semibold bg-amber-50 text-amber-700 rounded-full px-2 py-1 active:scale-95">{m.group ? `${GROUP_EMOJI[m.group]} ` : ''}manca: {m.label} +</button>)}
                </div>
              )}
              <div className="space-y-3">
                {items(slot).length === 0
                  ? <div onClick={() => proposeSlot(slot)} className="border-2 border-dashed border-slate-100 rounded-2xl p-4 text-center text-slate-400 text-xs font-medium cursor-pointer active:scale-[0.98]">Tocca per una proposta, o usa + per scegliere tu</div>
                  : menus.map((mn, k) => (
                    <div key={k} className="space-y-2">
                      {menus.length > 1 && !personal && (
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Menu per {mn.eaters.map((e) => e.name).join(', ')}
                        </div>
                      )}
                      {mn.list.map(([it, i]) => renderItem(it, slot, i))}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {picker && (
        <RecipePicker
          title={`Scegli per ${pickerSlot.toLowerCase()}`}
          slot={pickerSlot}
          pair={picker.pair}
          group={picker.group}
          constraints={constraintsFor(pickerSlot, picker.pair ? [picker.pair.eater] : people(pickerSlot))}
          recipes={recipes}
          onSelect={pick}
          onClose={() => setPicker(null)}
        />
      )}

      {menu && (
        <Sheet title={menu.recipe.title} onClose={() => setMenu(null)}>
          <div className="p-5 space-y-3">
            {!menu.recipe.isFood && <button onClick={() => { swap(menu.slot, menu.index); setMenu(null); }} className="w-full p-4 bg-brand-50 rounded-2xl flex items-center gap-4 text-brand-700 font-bold active:scale-[0.98]"><RotateCw className="w-6 h-6" /> Cambia a caso</button>}
            <button onClick={() => { setPicker({ slot: menu.slot, action: 'replace', index: menu.index }); setMenu(null); }} className="w-full p-4 bg-slate-50 rounded-2xl flex items-center gap-4 text-slate-700 font-bold active:scale-[0.98]"><Search className="w-6 h-6" /> Scegli tu</button>
            <button onClick={() => { setLeftover({ slot: menu.slot, item: items(menu.slot)[menu.index], targets: [], targetSlot: menu.slot }); setMenu(null); }} className="w-full p-4 bg-slate-50 rounded-2xl flex items-center gap-4 text-slate-700 font-bold active:scale-[0.98]"><CopyPlus className="w-6 h-6" /> Riporta come avanzo</button>
            <button onClick={() => { remove(menu.slot, menu.index); setMenu(null); }} className="w-full p-4 bg-red-50 rounded-2xl flex items-center gap-4 text-red-600 font-bold active:scale-[0.98]"><Trash2 className="w-6 h-6" /> Rimuovi dal piano</button>
          </div>
        </Sheet>
      )}

      {joinFor && (
        <Sheet title={`Mangia con te: ${joinFor.toLowerCase()}`} onClose={() => setJoinFor(null)}>
          <div className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Chi aggiungi mangia lo stesso menu del tuo (con le sue dosi). Il suo menu individuale di questo pasto viene sostituito.</p>
            {household.members.filter((m) => m.id !== me.id && mealOf(m, joinFor).eats).map((m) => {
              const on = (data(joinFor)?.joined?.[me.id] || []).includes(m.id);
              const ids = data(joinFor)?.joined?.[me.id] || [];
              return (
                <button key={m.id} onClick={() => setJoined(joinFor, on ? ids.filter((x) => x !== m.id) : [...ids, m.id])} className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left active:scale-[0.98] ${on ? 'bg-brand-50 ring-2 ring-brand-300' : 'bg-slate-50'}`}>
                  <Avatar member={m} size="w-10 h-10 text-xl" /><span className="flex-1 font-bold text-slate-700">{m.name}</span><span className="text-xs font-bold text-brand-700">{on ? 'Aggiunto' : 'Aggiungi'}</span>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
      {guestFor && <GuestSheet slot={guestFor} onClose={() => setGuestFor(null)} onAdd={(g) => { setGuests(guestFor, [...(data(guestFor)?.guests || []), g]); setGuestFor(null); }} />}
      {leftover && (
        <Sheet title="Riporta come avanzo" onClose={() => setLeftover(null)}>
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-500">Cucini una volta sola e lo ritrovi in questi giorni. La spesa conta comunque le dosi di chi lo mangia.</p>
            <div className="flex gap-1.5">
              {DAYS.map((d, i) => i === dayIndex ? <span key={d} className="flex-1 py-2 rounded-xl text-xs font-bold text-center bg-slate-100 text-slate-300">{d}</span> : (
                <button key={d} onClick={() => setLeftover({ ...leftover, targets: leftover.targets.includes(i) ? leftover.targets.filter((x) => x !== i) : [...leftover.targets, i] })} className={`flex-1 py-2 rounded-xl text-xs font-bold ${leftover.targets.includes(i) ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{d}</button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">{SLOTS.map((sl) => <button key={sl} onClick={() => setLeftover({ ...leftover, targetSlot: sl })} className={`px-3 py-2 rounded-xl text-xs font-bold ${leftover.targetSlot === sl ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{sl}</button>)}</div>
            <button disabled={!leftover.targets.length} onClick={() => addLeftovers(leftover.item, leftover.targets, leftover.targetSlot)} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl active:scale-95 disabled:opacity-50">Aggiungi</button>
          </div>
        </Sheet>
      )}
      {view && (
        <RecipeDetail
          recipe={view.recipe}
          context={{ slot: view.slot, eaters: personal ? eatersFor(view.item, view.slot).filter((m) => m.id === me.id) : eatersFor(view.item, view.slot) }}
          onClose={() => setView(null)}
          onEdit={() => { const r = view.recipe; setView(null); onEdit(r); }}
          onDuplicate={() => { const r = view.recipe; setView(null); onDuplicate(r); }}
          onDelete={() => { const r = view.recipe; setView(null); onDelete(r); }}
        />
      )}
      {modeFor && <Confirm title={modeFor.mode === 'shared' ? 'Rendere condiviso questo pasto?' : 'Rendere individuale questo pasto?'} msg={`Vale solo per ${DAYS[dayIndex]} ${dayNumber(weekDate, dayIndex)}, ${modeFor.slot.toLowerCase()}. I menu di questo pasto vengono ricalcolati per tutti.`} confirmLabel="Cambia" onConfirm={() => changeMode(modeFor.slot, modeFor.mode)} onCancel={() => setModeFor(null)} />}
      {confirm && <Confirm title="Rifare la settimana?" msg="Il menù attuale di questa settimana verrà sostituito da una nuova proposta." confirmLabel="Rifai" onConfirm={generate} onCancel={() => setConfirm(false)} />}
    </div>
  );
}
