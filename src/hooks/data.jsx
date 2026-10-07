import React from 'react';
import { addDoc, runTransaction, arrayRemove, arrayUnion, collection, deleteDoc, deleteField, doc, documentId, getDoc, onSnapshot, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase.js';
import { SEED_IDS, SEED_RECIPES } from '../data/seed.js';
import { addWeeks, getWeekId } from '../lib/dates.js';
import { weeksBetween } from '../lib/usage.js';
import { MEMBER_COLORS, MEMBER_EMOJIS } from '../lib/people.js';
import { DEFAULT_SHARED } from '../lib/diet.js';

export const Ctx = React.createContext(null);
export const useData = () => React.useContext(Ctx);
// Piani delle settimane e storico d'uso: in un contesto a parte, così ogni settimana scritta non rifà il rendering di tutta l'app
export const PlansCtx = React.createContext({ plans: [], plansLoaded: false, synced: false, lastUse: new Map() });
export const usePlans = () => React.useContext(PlansCtx);

export { MEMBER_COLORS, MEMBER_EMOJIS };

// Profilo personale: ogni account modifica solo il proprio
export const newProfile = (uid, name, diet, index = 0, extra = {}) => ({
  id: uid,
  name,
  diet,
  photo: null,
  avoid: '',
  intolerances: [],
  goals: [],
  emoji: MEMBER_EMOJIS[(index + 5) % MEMBER_EMOJIS.length],
  color: MEMBER_COLORS[index % MEMBER_COLORS.length],
  meals: {},
  createdAt: new Date().toISOString(),
  ...extra,
});

// Chi può modificare un profilo: il suo proprietario, oppure chiunque se è una persona senza app non ancora reclamata
export const canEditProfile = (p, uid) => p.id === uid || p.claimedBy === uid || (p.managed && !p.claimedBy);
export const isFreeProfile = (p) => Boolean(p.managed && !p.claimedBy);

// Struttura su Firestore:
//   users/<uid>                         { householdId }          puntatore al nucleo dell'account
//   households/<hid>                    { memberUids: [...] }    account con accesso al nucleo
//   households/<hid>/profiles/<id>      una persona del nucleo (dieta, pasti, piano). Se ha un account l'id è il suo uid;
//                                       le persone senza app sono profili "managed" modificabili da tutti finché nessuno li reclama
//   households/<hid>/settings/household { rules }                regole condivise
//   households/<hid>/settings/prefs     { favorites }
//   households/<hid>/recipes, plans, shopping, shoppingExtras, pantry   dati condivisi del nucleo
//   invites/<codice>                    inviti (48 ore)

const stripId = ({ id, ...rest }) => rest;
// Profilo da portare in un altro nucleo: diventa il profilo dell'account (senza id, senza reclamo)
const portable = ({ id, claimedBy, managed, ...rest }) => rest;
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('');

export function DataProvider({ user, children }) {
  const uid = user.uid;
  // l'ultimo nucleo usato si ricorda sul telefono: si può partire subito senza aspettare di rileggere l'account
  const [hid, setHidState] = React.useState(() => { try { return localStorage.getItem(`germoglio-hid-${uid}`) || undefined; } catch { return undefined; } });
  const setHid = (id) => { setHidState(id); try { localStorage.setItem(`germoglio-hid-${uid}`, id); } catch { /* ignora */ } };
  const [profiles, setProfiles] = React.useState(undefined); // undefined = in caricamento
  const [settings, setSettings] = React.useState({ rules: [] });
  const [prefs, setPrefs] = React.useState({ favorites: [] });
  const [userRecipes, setUserRecipes] = React.useState([]);
  const [pantry, setPantry] = React.useState([]);
  const [plans, setPlans] = React.useState([]);
  const [plansLoaded, setPlansLoaded] = React.useState(false);
  const [synced, setSynced] = React.useState(false); // tutti i dati principali sono arrivati dal server (non solo dalla cache del telefono)
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
    setSynced(false);
    const got = new Set();
    const mark = (k, s) => { if (!s.metadata.fromCache && !got.has(k)) { got.add(k); if (got.size === 5) setSynced(true); } };
    const h = (...p) => [db, 'households', hid, ...p];
    const cutoff = getWeekId(addWeeks(new Date(), -6));
    const unsubs = [
      onSnapshot(doc(...h()), (s) => setMemberCount(s.exists() ? (s.data().memberUids || []).length : 1)),
      onSnapshot(collection(...h('profiles')), (s) => { mark('p', s); setProfiles(s.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))); }),
      onSnapshot(doc(...h('settings', 'household')), (s) => { mark('s', s); setSettings({ rules: [], ...(s.exists() ? s.data() : {}) }); }),
      onSnapshot(doc(...h('settings', 'prefs')), (s) => { mark('f', s); setPrefs(s.exists() ? { favorites: [], ...s.data() } : { favorites: [] }); }),
      onSnapshot(collection(...h('recipes')), (s) => { mark('r', s); setUserRecipes(s.docs.map((d) => ({ ...d.data(), id: d.id, own: true }))); }),
      onSnapshot(collection(...h('pantry')), (s) => setPantry(s.docs.map((d) => ({ ...d.data(), id: d.id })))),
      // Piani delle ultime settimane e di quelle future: servono per lo storico
      onSnapshot(query(collection(...h('plans')), where(documentId(), '>=', cutoff)), (s) => { mark('l', s); setPlans(s.docs.map((d) => ({ id: d.id, ...d.data() }))); setPlansLoaded(true); }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [hid]);

  // Ricette: le tue, più quelle precaricate. Una precaricata modificata prende il posto dell'originale (stesso id,
  // così i menù restano validi); una eliminata viene nascosta. Dal pannello Impostazioni si ripristinano.
  const recipes = React.useMemo(() => {
    const overrides = new Map(userRecipes.filter((r) => SEED_IDS.has(r.id)).map((r) => [r.id, r]));
    const mine = userRecipes.filter((r) => !SEED_IDS.has(r.id) && !r.deleted);
    const seeds = SEED_RECIPES.map((seed) => {
      const o = overrides.get(seed.id);
      if (o?.deleted) return null;
      return o ? { ...o, own: true, seed: true, overridden: true } : { ...seed, own: false };
    }).filter(Boolean);
    return [...mine, ...seeds];
  }, [userRecipes]);
  const overrideIds = React.useMemo(() => userRecipes.filter((r) => SEED_IDS.has(r.id)).map((r) => r.id), [userRecipes]);
  const recipeMap = React.useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const favorites = React.useMemo(() => new Set(prefs.favorites || []), [prefs]);
  const me = profiles?.find((p) => p.claimedBy === uid) || profiles?.find((p) => p.id === uid) || null;
  // "household" è ciò che usa tutta la logica: persone del nucleo (i profili) e regole condivise
  const household = React.useMemo(() => (profiles ? { members: profiles, rules: settings.rules || [], sharedSlots: settings.sharedSlots ?? DEFAULT_SHARED } : undefined), [profiles, settings]);

  // recipeId -> settimane dall'ultima volta, contando fino alla settimana corrente
  const lastUse = React.useMemo(() => {
    const now = getWeekId(new Date());
    const map = new Map();
    for (const p of plans) {
      if (p.id > now) continue;
      const ago = weeksBetween(p.id, now);
      for (const slots of Object.values(p.days || {})) for (const data of Object.values(slots || {})) for (const it of data?.items || []) {
        if (it.leftoverOf || !it.recipeId) continue;
        if (!map.has(it.recipeId) || map.get(it.recipeId) > ago) map.set(it.recipeId, ago);
      }
    }
    return map;
  }, [plans]);

  const value = React.useMemo(() => {
    const ref = (...p) => doc(db, 'households', hid, ...p);
    const col = (...p) => collection(db, 'households', hid, ...p);
    // Gli errori di salvataggio (es. regole di Firebase non aggiornate) si mostrano all'utente invece di restare nascosti
    const log = (e) => { console.error(e); window.dispatchEvent(new CustomEvent('germoglio-error', { detail: e?.code || e?.message || 'errore' })); };
    return {
      uid, user, hid, household, me, recipes, overrideIds, recipeMap, userRecipes, prefs, favorites, pantry, memberCount,
      // Le scritture non vengono attese: offline Firestore le mette in coda e le invia al ritorno della rete
      saveProfile: (p) => { setDoc(ref('profiles', p.id || uid), stripId(p)).catch(log); },
      // Persona del nucleo senza app (es. un familiare): la modifica chiunque finché nessuno la reclama
      addManagedProfile: (name = '') => {
        const id = `p-${crypto.randomUUID()}`;
        setDoc(ref('profiles', id), stripId(newProfile(id, name, 'omnivore', profiles?.length || 0, { managed: true }))).catch(log);
        return id;
      },
      // "Questo profilo sono io": da quel momento lo modifica solo il suo proprietario
      claimProfile: async (id) => {
        const target = profiles.find((p) => p.id === id);
        // un account è una sola persona: se ne ha già reclamata una, non può reclamarne un'altra
        if (!target || !isFreeProfile(target) || profiles.some((p) => p.claimedBy === uid)) return;
        await setDoc(ref('profiles', id), { ...stripId(target), claimedBy: uid });
        if (profiles.some((p) => p.id === uid)) await deleteDoc(ref('profiles', uid)).catch(log);
      },
      // "Non sono io": la persona torna libera e la modificano tutti
      releaseProfile: async (id) => {
        const target = profiles.find((p) => p.id === id);
        if (!target || target.claimedBy !== uid) return;
        await updateDoc(ref('profiles', id), { claimedBy: deleteField() }).catch(log);
      },
      // Settimane pianificate in anticipo: si scrivono solo se non esistono o se sono ancora proposte automatiche da aggiornare
      // (una settimana toccata a mano non si sovrascrive mai; due telefoni aperti insieme non si pestano i piedi)
      createWeek: async (weekId, days, sig) => {
        try {
          await runTransaction(db, async (tx) => {
            const r = ref('plans', weekId);
            const snap = await tx.get(r);
            if (!snap.exists() || (snap.data().auto === true && snap.data().sig !== sig)) tx.set(r, { days, auto: true, sig });
          });
        } catch { /* offline o già creata: nessun tentativo ripetuto */ }
      },
      deleteProfile: (id) => { deleteDoc(ref('profiles', id)).catch(log); },
      // Impostazioni condivise del nucleo: regole e pasti condivisi
      saveSettings: (patch) => { setDoc(ref('settings', 'household'), { ...settings, ...patch }).catch(log); },
      saveRules: (rules) => { setDoc(ref('settings', 'household'), { ...settings, rules }).catch(log); },
      saveRecipe: (r) => {
        const { id, own, seed, overridden, ...data } = r;
        const clean = JSON.parse(JSON.stringify({ ...data, updatedAt: new Date().toISOString() }));
        if (id && (own || seed)) { setDoc(ref('recipes', id), clean).catch(log); return id; }
        const created = doc(col('recipes'));
        setDoc(created, { ...clean, createdAt: new Date().toISOString() }).catch(log);
        return created.id;
      },
      deleteRecipe: (id) => {
        if (SEED_IDS.has(id)) setDoc(ref('recipes', id), { deleted: true }).catch(log); // precaricata: si nasconde
        else deleteDoc(ref('recipes', id)).catch(log);
      },
      // Torna alla ricetta precaricata originale (annulla modifica o eliminazione)
      restoreRecipe: (id) => { deleteDoc(ref('recipes', id)).catch(log); },
      restoreAllSeeds: () => { overrideIds.forEach((id) => deleteDoc(ref('recipes', id)).catch(log)); },
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
        const mine = me ? { ...portable(me), createdAt: new Date().toISOString() } : null;
        await updateDoc(doc(db, 'households', target), { memberUids: arrayUnion(uid), joinCode: code });
        if (mine) await setDoc(doc(db, 'households', target, 'profiles', uid), mine);
        await setDoc(doc(db, 'users', uid), { householdId: target });
      },
      leaveHousehold: async () => {
        const mine = me ? portable(me) : null;
        // un profilo reclamato torna libero per gli altri; il profilo creato con l'account si elimina
        if (me?.managed) await updateDoc(doc(db, 'households', hid, 'profiles', me.id), { claimedBy: deleteField() }).catch(() => {});
        else await deleteDoc(doc(db, 'households', hid, 'profiles', uid)).catch(() => {});
        await updateDoc(doc(db, 'households', hid), { memberUids: arrayRemove(uid) });
        const fresh = doc(collection(db, 'households'));
        await setDoc(fresh, { memberUids: [uid], createdAt: new Date().toISOString() });
        if (mine) await setDoc(doc(db, 'households', fresh.id, 'profiles', uid), mine);
        await setDoc(doc(db, 'users', uid), { householdId: fresh.id });
      },
    };
  }, [uid, user, hid, household, settings, me, recipes, overrideIds, recipeMap, userRecipes, prefs, favorites, pantry, memberCount]);

  if (!hid) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" /></div>;
  const plansValue = React.useMemo(() => ({ plans, plansLoaded, synced, lastUse }), [plans, plansLoaded, synced, lastUse]);
  return <Ctx.Provider value={value}><PlansCtx.Provider value={plansValue}>{children}</PlansCtx.Provider></Ctx.Provider>;
}

// Piano settimanale: households/<hid>/plans/<weekId> con { days: { 0: { Pranzo: { items, absent, guests } } } }
export function useWeekPlan(hid, weekId) {
  const [plan, setPlan] = React.useState({ days: {} });
  React.useEffect(() => {
    setPlan({ days: {} });
    return onSnapshot(doc(db, 'households', hid, 'plans', weekId), (s) => setPlan(s.exists() ? s.data() : { days: {} }));
  }, [hid, weekId]);
  // una modifica a mano toglie la settimana dalle "proposte automatiche": non verrà rifatta da sola
  const saveSlot = (day, slot, data) => setDoc(doc(db, 'households', hid, 'plans', weekId), { auto: false, days: { [day]: { [slot]: data } } }, { merge: true }).catch(console.error);
  return { plan, saveSlot };
}
