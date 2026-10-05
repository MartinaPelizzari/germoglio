import React from 'react';
import { SEED_RECIPES } from '../../src/data/seed.js';
import { generateWeek } from '../../src/lib/planGen.js';
import { MEMBER_COLORS, MEMBER_EMOJIS } from '../../src/lib/people.js';

export { MEMBER_COLORS, MEMBER_EMOJIS };
export const Ctx = React.createContext(null);
export const useData = () => React.useContext(Ctx);
export const newProfile = (uid, name, diet, index = 0) => ({ id: uid, name, diet, avoid: '', intolerances: [], goals: [], emoji: '🙂', color: MEMBER_COLORS[index % 8], meals: {}, createdAt: '' });

const recipes = SEED_RECIPES.map((r) => ({ ...r, own: false }));
const members = [
  { id: 'u1', name: 'Martina', diet: 'vegetarian', emoji: '👩', color: '#10b981', intolerances: [], goals: [{ id: 'g', food: 'legumi', times: 3, mode: 'min' }], meals: {}, createdAt: '1' },
  { id: 'u2', name: 'Mamma', diet: 'omnivore', emoji: '👵', color: '#f97316', intolerances: [], goals: [], meals: {}, createdAt: '2' },
  { id: 'u3', name: 'Sorella', diet: 'omnivore', emoji: '😎', color: '#6366f1', intolerances: ['glutine'], goals: [], meals: {}, createdAt: '3' },
];
const rules = [{ id: 'r', label: "Pranzo d'asporto in settimana", slots: ['Pranzo'], days: [0, 1, 2, 3, 4], dietCap: 'vegetarian', takeaway: true, batch: 2 }];
const store = { plan: { days: generateWeek(recipes, { members, rules }) }, listeners: new Set(), favorites: [], pantry: [], extras: [] };
const emit = () => store.listeners.forEach((l) => l());
const useStore = () => { const [, f] = React.useReducer((x) => x + 1, 0); React.useEffect(() => { store.listeners.add(f); return () => store.listeners.delete(f); }, []); };

export function useWeekPlan() {
  useStore();
  return {
    plan: store.plan,
    saveSlot: (d, slot, data) => { store.plan = { days: { ...store.plan.days, [d]: { ...(store.plan.days[d] || {}), [slot]: { ...(store.plan.days[d]?.[slot] || {}), ...data } } } }; emit(); },
    replaceAll: (days) => { store.plan = { days }; emit(); },
  };
}

export function DataProvider({ children }) {
  useStore();
  const value = React.useMemo(() => ({
    uid: 'u1', user: { uid: 'u1', displayName: 'Martina' }, hid: 'h1', household: { members, rules }, me: members[0], recipes, recipeMap: new Map(recipes.map((r) => [r.id, r])),
    userRecipes: [], prefs: { favorites: store.favorites }, favorites: new Set(store.favorites), pantry: store.pantry, plans: [], lastUse: new Map(), memberCount: 3,
    saveProfile() {}, saveRules() {}, saveRecipe() {}, deleteRecipe() {}, toggleFavorite: (id) => { store.favorites = store.favorites.includes(id) ? store.favorites.filter((x) => x !== id) : [...store.favorites, id]; emit(); },
    savePantryItem: (i) => { store.pantry = [...store.pantry, { ...i, id: String(Math.random()) }]; emit(); }, deletePantryItem: (id) => { store.pantry = store.pantry.filter((p) => p.id !== id); emit(); },
    createInvite: async () => 'ABCD2345', joinHousehold: async () => {}, leaveHousehold: async () => {},
  }), [store.favorites.length, store.pantry.length]); // eslint-disable-line
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
