// Prova di rendering lato server delle schermate che non dipendono da Firestore, con dati finti
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', plugins: [] });
const load = (p) => server.ssrLoadModule(p);
const { Ctx } = await load('/src/hooks/data.jsx');
const { SEED_RECIPES } = await load('/src/data/seed.js');
const { default: Family } = await load('/src/screens/Family.jsx');
const { default: RecipeBook } = await load('/src/screens/RecipeBook.jsx');
const { default: RecipeDetail } = await load('/src/screens/RecipeDetail.jsx');
const { default: RecipePicker } = await load('/src/screens/RecipePicker.jsx');
const { default: RecipeForm, emptyRecipe, toDraft } = await load('/src/screens/RecipeForm.jsx');
const { default: GuestSheet } = await load('/src/screens/GuestSheet.jsx');
const { default: Pantry } = await load('/src/screens/Pantry.jsx');
const { default: Settings } = await load('/src/screens/Settings.jsx');
const { default: Onboarding } = await load('/src/screens/Onboarding.jsx');

const recipes = SEED_RECIPES.map((r) => ({ ...r, own: false }));
const household = {
  members: [
    { id: 'm', name: 'Martina', emoji: '🙂', color: '#10b981', diet: 'vegetarian', intolerances: ['glutine'], goals: [{ id: 'g', food: 'legumi', times: 3, mode: 'min' }], meals: {} },
    { id: 'a', name: 'Mamma', emoji: '👩', color: '#f97316', diet: 'omnivore', meals: {} },
  ],
  rules: [{ id: 'r', label: "Pranzo d'asporto", slots: ['Pranzo'], days: [0, 1, 2, 3, 4], dietCap: 'vegetarian', takeaway: true }],
};
const value = { uid: 'x', me: household.members[0], saveProfile() {}, saveRules() {}, user: { email: 'a@b.it' }, household, recipes, recipeMap: new Map(recipes.map((r) => [r.id, r])), userRecipes: [], favorites: new Set([recipes[20].id]), lastUse: new Map([[recipes[20].id, 2]]), toggleFavorite() {}, pantry: [{ id: 'p', name: 'Sale', always: true, qty: 0, unit: 'q.b.' }, { id: 'q', name: 'Ceci cotti', always: false, qty: 200, unit: 'g' }], savePantryItem() {}, deletePantryItem() {}, memberCount: 2, createInvite: async () => 'ABCD', joinHousehold: async () => {}, leaveHousehold: async () => {}, plans: [], saveHousehold() {}, saveRecipe() {}, deleteRecipe() {} };
const wrap = (el) => renderToString(React.createElement(Ctx.Provider, { value }, el));
const noop = () => {};
const checks = {
  Family: () => wrap(React.createElement(Family)),
  RecipeBook: () => wrap(React.createElement(RecipeBook, { filters: { cat: 'Tutte', time: 'Tutte', diet: 'Tutte', origin: 'tutte', q: '' }, setFilters: noop, onEdit: noop, onDuplicate: noop, onDelete: noop, })),
  RecipeDetail: () => wrap(React.createElement(RecipeDetail, { recipe: recipes[20], onClose: noop })),
  RecipeDetailCtx: () => wrap(React.createElement(RecipeDetail, { recipe: recipes[20], context: { slot: 'Pranzo', eaters: household.members }, onClose: noop })),
  RecipePicker: () => wrap(React.createElement(RecipePicker, { title: 't', categories: ['Pranzo', 'Contorno'], recipes, constraints: { maxLevel: 1, takeaway: true, avoid: [], required: [] }, onSelect: noop, onClose: noop })),
  RecipeForm: () => wrap(React.createElement(RecipeForm, { data: toDraft(recipes[3]), onChange: noop, onClose: noop, onSave: noop })),
  RecipeFormNew: () => wrap(React.createElement(RecipeForm, { data: emptyRecipe(), onChange: noop, onClose: noop, onSave: noop })),
  GuestSheet: () => wrap(React.createElement(GuestSheet, { slot: 'Cena', onAdd: noop, onClose: noop })),
  Pantry: () => wrap(React.createElement(Pantry, { onClose: noop })),
  Settings: () => wrap(React.createElement(Settings, { onClose: noop })),
  Onboarding: () => wrap(React.createElement(Onboarding, { user: { uid: 'x', displayName: 'Martina Rossi' }, onDone: noop })),
};
let bad = 0;
for (const [name, fn] of Object.entries(checks)) {
  try { const html = fn(); console.log('ok ', name, html.length, 'caratteri'); }
  catch (e) { bad++; console.log('KO ', name, e.message.split('\n')[0]); }
}
await server.close();
process.exit(bad ? 1 : 0);
