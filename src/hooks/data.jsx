import React from 'react';
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, documentId, getDoc, onSnapshot, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase.js';
import { SEED_RECIPES } from '../data/seed.js';
import { addWeeks, getWeekId } from '../lib/dates.js';
import { weeksBetween } from '../lib/usage.js';

export const Ctx = React.createContext(null);
export const useData = () => React.useContext(Ctx);

export const MEMBER_COLORS = ['#10b981', '#f97316', '#6366f1', '#ec4899', '#eab308', '#06b6d4', '#8b5cf6', '#ef4444'];
export const MEMBER_EMOJIS = ['🙂', '😎', '🧒', '👧', '👦', '👩', '👨', '👵', '👴', '🐻', '🦊', '🐱'];

// Profilo personale: ogni account modifica solo il proprio
export const newProfile = (uid, name, diet, index = 0) => ({
  id: uid,
  name,
  diet,
  avoid: '',
  intolerances: [],
  goals: [],
  emoji: MEMBER_EMOJIS[(index + 5) % MEMBER_EMOJIS.length],
  color: MEMBER_COLORS[index % MEMBER_COLORS.length],
  meals: {},
  createdAt: new Date().toISOString(),
});

// Struttura su Firestore:
//   users/<uid>                         { householdId }          puntatore al nucleo dell'account
//   households/<hid>                    { memberUids: [...] }    account con accesso al nucleo
//   households/<hid>/profiles/<uid>     profilo di ogni account (dieta, pasti, obiettivi): lo modifica solo lui
//   households/<hid>/settings/household { rules }                regole condivise
//   households/<hid>/settings/prefs     { favorites }
//   households/<hid>/recipes, plans, shopping, shoppingExtras, pantry   dati condivisi del nucleo
//   invites/<codice>                    inviti (48 ore)

const stripId = ({ id, ...rest }) => rest;
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('');

export function DataProvider({ user, children }) {
  const uid = user.uid;
  const [hid, setHid] = React.useState(undefined);
  const [profiles, setProfiles] = React.useState(undefined); // undefined = in caricamento
  const [settings, setSettings] = React.useState({ rules: [] });
  const [prefs, setPrefs] = React.useState({ favorites: [] });
  const [userRecipes, setUserRecipes] = React.useState([]);
  const [pantry, setPantry] = React.useState([]);
  const [plans, setPlans] = React.useState([]);
  const [memberCount, setMemberCount] = React.useState(1);
  const creating = React.useRef(false);

  // Trova (o crea) il nucleo dell'account
  React.useEffect(() => onSnapshot(doc(db, 'users', uid), async (s) => {
    if (s.exists() && s.data().householdId) { setHid(s.data().householdId); return; }
    if (creating.current) return;
    creating.current = true;
    const ref = doc(collection(db, 'households'));
    await setDoc(ref, { memberUids: [uid], createdAt: new Date().toISOString() });
    await setDoc(doc(db, 'users', uid), { householdId: ref.id });
  }), [uid]);

  React.useEffect(() => {
    if (!hid) return undefined;
    setProfiles(undefined);
    const h = (...p) => [db, 'households', hid, ...p];
    const cutoff = getWeekId(addWeeks(new Date(), -10));
    const unsubs = [
      onSnapshot(doc(...h()), (s) => setMemberCount(s.exists() ? (s.data().memberUids || []).length : 1)),
      onSnapshot(collection(...h('profiles')), (s) => setProfiles(s.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')))),
      onSnapshot(doc(...h('settings', 'household')), (s) => setSettings({ rules: [], ...(s.exists() ? s.data() : {}) })),
      onSnapshot(doc(...h('settings', 'prefs')), (s) => setPrefs(s.exists() ? { favorites: [], ...s.data() } : { favorites: [] })),
      onSnapshot(collection(...h('recipes')), (s) => setUserRecipes(s.docs.map((d) => ({ ...d.data(), id: d.id, own: true })))),
      onSnapshot(collection(...h('pantry')), (s) => setPantry(s.docs.map((d) => ({ ...d.data(), id: d.id })))),
      // Piani delle ultime settimane e di quelle future: servono per lo storico
      onSnapshot(query(collection(...h('plans')), where(documentId(), '>=', cutoff)), (s) => setPlans(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsubs.forEach((u) => u());
  }, [hid]);

  const recipes = React.useMemo(() => [...userRecipes, ...SEED_RECIPES.map((r) => ({ ...r, own: false }))], [userRecipes]);
  const recipeMap = React.useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const favorites = React.useMemo(() => new Set(prefs.favorites || []), [prefs]);
  const me = profiles?.find((p) => p.id === uid) || null;
  // "household" è ciò che usa tutta la logica: persone del nucleo (i profili) e regole condivise
  const household = React.useMemo(() => (profiles ? { members: profiles, rules: settings.rules || [] } : undefined), [profiles, settings]);

  // recipeId -> settimane dall'ultima volta, contando fino alla settimana corrente
  const lastUse = React.useMemo(() => {
    const now = getWeekId(new Date());
    const map = new Map();
    for (const p of plans) {
      if (p.id > now) continue;
      const ago = weeksBetween(p.id, now);
      for (const slots of Object.values(p.days || {})) for (const data of Object.values(slots || {})) for (const it of data?.items || []) {
        if (it.leftoverOf) continue;
        if (!map.has(it.recipeId) || map.get(it.recipeId) > ago) map.set(it.recipeId, ago);
      }
    }
    return map;
  }, [plans]);

  const value = React.useMemo(() => {
    const ref = (...p) => doc(db, 'households', hid, ...p);
    const col = (...p) => collection(db, 'households', hid, ...p);
    const log = (e) => console.error(e);
    return {
      uid, user, hid, household, me, recipes, recipeMap, userRecipes, prefs, favorites, pantry, plans, lastUse, memberCount,
      // Le scritture non vengono attese: offline Firestore le mette in coda e le invia al ritorno della rete
      saveProfile: (p) => { setDoc(ref('profiles', uid), stripId(p)).catch(log); },
      saveRules: (rules) => { setDoc(ref('settings', 'household'), { rules }).catch(log); },
      saveRecipe: (r) => {
        const { id, own, seed, ...data } = r;
        const clean = JSON.parse(JSON.stringify({ ...data, updatedAt: new Date().toISOString() }));
        if (id && own) setDoc(ref('recipes', id), clean).catch(log);
        else addDoc(col('recipes'), { ...clean, createdAt: new Date().toISOString() }).catch(log);
      },
      deleteRecipe: (id) => { deleteDoc(ref('recipes', id)).catch(log); },
      toggleFavorite: (id) => {
        const next = favorites.has(id) ? [...favorites].filter((x) => x !== id) : [...favorites, id];
        setDoc(ref('settings', 'prefs'), { ...prefs, favorites: next }).catch(log);
      },
      savePantryItem: (item) => {
        const { id, ...data } = item;
        if (id) setDoc(ref('pantry', id), data).catch(log); else addDoc(col('pantry'), data).catch(log);
      },
      deletePantryItem: (id) => { deleteDoc(ref('pantry', id)).catch(log); },
      // Condivisione del nucleo con altri account
      createInvite: async () => {
        const code = makeCode();
        await setDoc(doc(db, 'invites', code), { hid, createdBy: uid, expiresAt: Timestamp.fromDate(new Date(Date.now() + 48 * 3600 * 1000)) });
        return code;
      },
      // Entrando in un nucleo il profilo personale viene copiato: la dieta e i pasti restano quelli dell'account
      joinHousehold: async (rawCode) => {
        const code = rawCode.trim().toUpperCase().replace(/\s/g, '');
        const inv = await getDoc(doc(db, 'invites', code));
        if (!inv.exists() || inv.data().expiresAt.toDate() < new Date()) throw new Error('Codice non valido o scaduto.');
        const target = inv.data().hid;
        if (target === hid) throw new Error('Fai già parte di questo nucleo.');
        const mine = me ? { ...stripId(me), createdAt: new Date().toISOString() } : null;
        await updateDoc(doc(db, 'households', target), { memberUids: arrayUnion(uid), joinCode: code });
        if (mine) await setDoc(doc(db, 'households', target, 'profiles', uid), mine);
        await setDoc(doc(db, 'users', uid), { householdId: target });
      },
      leaveHousehold: async () => {
        const mine = me ? stripId(me) : null;
        await deleteDoc(doc(db, 'households', hid, 'profiles', uid)).catch(() => {});
        await updateDoc(doc(db, 'households', hid), { memberUids: arrayRemove(uid) });
        const fresh = doc(collection(db, 'households'));
        await setDoc(fresh, { memberUids: [uid], createdAt: new Date().toISOString() });
        if (mine) await setDoc(doc(db, 'households', fresh.id, 'profiles', uid), mine);
        await setDoc(doc(db, 'users', uid), { householdId: fresh.id });
      },
    };
  }, [uid, user, hid, household, me, recipes, recipeMap, userRecipes, prefs, favorites, pantry, plans, lastUse, memberCount]);

  if (!hid) return <div className="h-[100dvh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" /></div>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Piano settimanale: households/<hid>/plans/<weekId> con { days: { 0: { Pranzo: { items, absent, guests } } } }
export function useWeekPlan(hid, weekId) {
  const [plan, setPlan] = React.useState({ days: {} });
  React.useEffect(() => onSnapshot(doc(db, 'households', hid, 'plans', weekId), (s) => setPlan(s.exists() ? s.data() : { days: {} })), [hid, weekId]);
  const saveSlot = (day, slot, data) => setDoc(doc(db, 'households', hid, 'plans', weekId), { days: { [day]: { [slot]: data } } }, { merge: true }).catch(console.error);
  const replaceAll = (days) => setDoc(doc(db, 'households', hid, 'plans', weekId), { days }).catch(console.error);
  return { plan, saveSlot, replaceAll };
}
