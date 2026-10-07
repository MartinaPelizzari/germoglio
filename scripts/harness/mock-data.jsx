import React from 'react';
import { SEED_RECIPES } from '../../src/data/seed.js';
import { generateWeek } from '../../src/lib/planGen.js';
import { parseSlotPlan } from '../../src/lib/dietPlan.js';
import { MEMBER_COLORS, MEMBER_EMOJIS } from '../../src/lib/people.js';

export { MEMBER_COLORS, MEMBER_EMOJIS };
export const Ctx = React.createContext(null);
export const useData = () => React.useContext(Ctx);
export const PlansCtx = React.createContext({ plans: [], plansLoaded: false, lastUse: new Map() });
export const usePlans = () => React.useContext(PlansCtx);
export const canEditProfile = (p, uid) => p.id === uid || p.claimedBy === uid || (p.managed && !p.claimedBy);
export const isFreeProfile = (p) => Boolean(p.managed && !p.claimedBy);
export const newProfile = (uid, name, diet, index = 0) => ({ id: uid, name, diet, avoid: '', intolerances: [], goals: [], emoji: '🙂', color: MEMBER_COLORS[index % 8], meals: {}, createdAt: '' });

const recipes = SEED_RECIPES.map((r) => ({ ...r, own: false }));
const members = [
  { id: 'u1', name: 'Martina', diet: 'vegetarian', balance: 'day', emoji: '👩', color: '#10b981', intolerances: [], goals: [{ id: 'g', food: 'legumi', times: 3, mode: 'min' }], meals: { Colazione: { planText: '150 g yogurt oppure 30 g pane\n\n1 frutto', plan: parseSlotPlan('150 g yogurt oppure 30 g pane\n\n1 frutto') }, Pranzo: { planText: '80 g pasta\n\n200 g verdure', plan: parseSlotPlan('80 g pasta\n\n200 g verdure') }, 'Spuntino 1': { plan: parseSlotPlan('250 g frutta fresca\n\n10 g frutta secca') }, 'Spuntino 2': { plan: parseSlotPlan('250 g frutta fresca\n\n20 g cioccolato fondente') } }, createdAt: '1' },
  { id: 'u2', name: 'Mamma', diet: 'omnivore', emoji: '👵', color: '#f97316', intolerances: [], goals: [], meals: {}, createdAt: '2' },
  { id: 'p-9', name: 'Papà', diet: 'omnivore', emoji: '👨', color: '#8b5cf6', managed: true, intolerances: [], goals: [], meals: {}, createdAt: '4' },
  { id: 'u3', name: 'Sorella', diet: 'omnivore', emoji: '😎', color: '#6366f1', intolerances: ['glutine'], goals: [], meals: {}, createdAt: '3' },
];
const rules = [];
const store = { members, plan: { days: generateWeek(recipes, { members, rules }) }, listeners: new Set(), favorites: [], pantry: [], extras: [], plans: [] };
window.__store = store; window.__creates = 0;
const emit = () => store.listeners.forEach((l) => l());
const useStore = () => { const [, f] = React.useReducer((x) => x + 1, 0); React.useEffect(() => { store.listeners.add(f); return () => store.listeners.delete(f); }, []); };

export function useWeekPlan() {
  useStore();
  return {
    plan: store.plan,
    saveSlot: (d, slot, data) => { store.plan = { days: { ...store.plan.days, [d]: { ...(store.plan.days[d] || {}), [slot]: { ...(store.plan.days[d]?.[slot] || {}), ...data } } } }; emit(); },
  };
}

export function DataProvider({ children }) {
  useStore();
  const value = React.useMemo(() => ({
    uid: 'u1', user: { uid: 'u1', displayName: 'Martina' }, hid: 'h1', household: { members: store.members.slice(), rules, sharedSlots: ['Pranzo', 'Cena'] }, me: store.members[0], recipes, recipeMap: new Map(recipes.map((r) => [r.id, r])),
    userRecipes: [], prefs: { favorites: store.favorites }, favorites: new Set(store.favorites), pantry: store.pantry, writeWeek: async (id, days, sig) => { store.plans = [...store.plans.filter((p) => p.id !== id), { id, days, auto: true, sig }]; if (id === store.currentWeek) store.plan = { days }; emit(); },
    createWeek: async (id, days, sig) => { window.__creates++; const cur = store.plans.find((p) => p.id === id); if (!cur) store.plans = [...store.plans, { id, days, auto: true, sig }]; else if (cur.auto === true && cur.sig !== sig) store.plans = store.plans.map((p) => (p.id === id ? { id, days, auto: true, sig } : p)); emit(); }, memberCount: 3,
    saveProfile: (p) => { store.members = store.members.map((m) => (m.id === p.id ? { ...m, ...p } : m)); emit(); }, saveRules() {}, saveSettings() {}, saveRecipe() {}, deleteRecipe() {}, toggleFavorite: (id) => { store.favorites = store.favorites.includes(id) ? store.favorites.filter((x) => x !== id) : [...store.favorites, id]; emit(); },
    savePantryItem: (i) => { store.pantry = [...store.pantry, { ...i, id: String(Math.random()) }]; emit(); }, deletePantryItem: (id) => { store.pantry = store.pantry.filter((p) => p.id !== id); emit(); },
    uid2: 1, overrideIds: [], restoreAllSeeds() {}, restoreRecipe() {}, addManagedProfile: () => { const id = 'p-' + Math.random().toString(36).slice(2, 7); store.members = [...store.members, { id, name: '', diet: 'omnivore', emoji: '🙂', color: '#10b981', managed: true, intolerances: [], goals: [], meals: {}, createdAt: String(Date.now()) }]; emit(); return id; }, claimProfile() {}, deleteProfile() {}, createInvite: async () => 'ABCD2345', joinHousehold: async () => {}, leaveHousehold: async () => {},
  }), [store.favorites.length, store.pantry.length, store.members]); // eslint-disable-line
  const plansValue = React.useMemo(() => ({ plans: store.plans, plansLoaded: true, synced: true, lastUse: new Map() }), [store.plans]);
  return <Ctx.Provider value={value}><PlansCtx.Provider value={plansValue}>{children}</PlansCtx.Provider></Ctx.Provider>;
}
