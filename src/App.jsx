import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { BookOpen, Calendar, Leaf, Settings as SettingsIcon, ShoppingCart, Users } from 'lucide-react';
import { auth } from './firebase.js';
import { DataProvider, isFreeProfile, useData } from './hooks/data.jsx';
import { Confirm, Spinner } from './components/ui.jsx';
import AuthScreen from './screens/AuthScreen.jsx';
const Onboarding = React.lazy(() => import('./screens/Onboarding.jsx'));
import Planner from './screens/Planner.jsx';
const RecipeBook = React.lazy(() => import('./screens/RecipeBook.jsx'));
import RecipeForm, { emptyRecipe, fromDraft, toDraft } from './screens/RecipeForm.jsx';
const Shopping = React.lazy(() => import('./screens/Shopping.jsx'));
const Family = React.lazy(() => import('./screens/Family.jsx'));
const Settings = React.lazy(() => import('./screens/Settings.jsx'));
import { CheckInCard } from './components/Wellbeing.jsx';
const ReportSheet = React.lazy(() => import('./components/Wellbeing.jsx').then((m) => ({ default: m.ReportSheet })));
const ProfileEditor = React.lazy(() => import('./screens/ProfileEditor.jsx'));
import { useAutoWeeks } from './hooks/useAutoWeeks.js';
import { todayIndex } from './lib/dates.js';
import { pushTabState, setTabBackHandler } from './lib/backstack.js';

const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} aria-label={label} className={`flex flex-col items-center justify-center w-16 active:scale-90 transition-all ${active ? 'text-brand-600' : 'text-slate-400'}`}>
    <div className={`p-1.5 rounded-xl ${active ? 'bg-brand-50' : ''}`}><Icon className="w-6 h-6" strokeWidth={2} /></div>
    <span className={`text-[10px] font-semibold ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

// Vista famiglia (tutti) o personale (solo io): si ricorda l'ultima scelta


export function Main() {
  const { household, me, memberCount, saveProfile, saveSettings, claimProfile, joinHousehold, saveRecipe, deleteRecipe, user } = useData();
  useAutoWeeks();
  const [tab, setTabState] = React.useState('planner');
  const tabRef = React.useRef('planner');
  const tabHist = React.useRef([]);
  const [weekDate, setWeekDate] = React.useState(new Date());
  const [dayIndex, setDayIndex] = React.useState(todayIndex());
  const [shopDays, setShopDays] = React.useState([0, 1, 2, 3, 4, 5, 6]);
  const [filters, setFilters] = React.useState({ time: 'Tutte', diet: 'Tutte', origin: 'tutte', q: '', free: [], contains: [] });
  const [draft, setDraft] = React.useState(emptyRecipe());
  const [confirm, setConfirm] = React.useState(null);
  const [settings, setSettings] = React.useState(false);
  const [report, setReport] = React.useState(undefined); // undefined = chiusa, null = scelta del sintomo, stringa = sintomo
  const [joined, setJoined] = React.useState(false); // appena entrato in un nucleo con un codice
  const [review, setReview] = React.useState(false); // dopo aver reclamato un profilo: controllo dei dati
  const [saveError, setSaveError] = React.useState('');
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    let t;
    const on = (e) => { setSaveError(e.detail); clearTimeout(t); t = setTimeout(() => setSaveError(''), 12000); };
    window.addEventListener('germoglio-error', on);
    return () => { window.removeEventListener('germoglio-error', on); clearTimeout(t); };
  }, []);

  // Ogni cambio di scheda entra nella cronologia, così il gesto indietro torna alla scheda precedente
  const setTab = (t) => {
    if (t === tabRef.current) return;
    tabHist.current.push(tabRef.current);
    pushTabState();
    tabRef.current = t;
    setTabState(t);
  };
  React.useEffect(() => {
    setTabBackHandler(() => {
      const prev = tabHist.current.pop();
      if (prev) { tabRef.current = prev; setTabState(prev); }
    });
    return () => setTabBackHandler(null);
  }, []);
  React.useEffect(() => { scrollRef.current?.scrollTo(0, 0); }, [tab]);

  if (household === undefined) return <div className="h-full flex items-center justify-center"><Spinner /></div>;
  if (!me) {
    return (
      <React.Suspense fallback={<div className="h-full flex items-center justify-center"><Spinner /></div>}>
      <Onboarding
        user={user}
        index={household.members.length}
        joined={joined}
        freeProfiles={household.members.filter(isFreeProfile)}
        onJoin={async (code) => { await joinHousehold(code); setJoined(true); }}
        onClaim={async (id) => { await claimProfile(id); setReview(true); }}
        onDone={(profile, extra) => { saveProfile(profile); if (extra) saveSettings(extra); }}
      />
      </React.Suspense>
    );
  }

  const edit = (r) => { setDraft(toDraft(r)); setTab('add'); };
  const duplicate = (r) => { setDraft({ ...toDraft(r), id: null, own: true, source: r.source || null, title: r.title }); setTab('add'); };
  const askDelete = (r) => setConfirm({ title: 'Eliminare la ricetta?', msg: r.seed ? 'La ricetta sparisce dall\'elenco. Puoi ripristinarla da Impostazioni.' : 'Questa azione non può essere annullata.', action: () => { deleteRecipe(r.id); setConfirm(null); } });
  const closeDraft = () => {
    const dirty = draft.title || draft.ingredients[0]?.name;
    const exit = () => { setDraft(emptyRecipe()); setConfirm(null); setTab('recipes'); };
    if (dirty) setConfirm({ title: 'Annullare le modifiche?', msg: 'Se esci ora, perderai i dati non salvati.', action: exit });
    else exit();
  };
  const save = () => {
    if (!draft.title.trim()) return alert('Manca il titolo!');
    saveRecipe(fromDraft(draft));
    setDraft(emptyRecipe());
    setTab('recipes');
  };

  return (
    <div className="h-full w-full flex flex-col bg-surface-ground text-slate-800 overflow-hidden">
      <header className="glass shrink-0 z-20 px-5 pt-safe">
        <div className="h-14 flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="bg-brand-100 p-2 rounded-xl text-brand-600"><Leaf className="w-5 h-5" /></div><h1 className="font-display font-bold text-xl text-slate-900 tracking-tight">Germoglio</h1></div>
          <div className="flex items-center">
          <button onClick={() => setSettings(true)} aria-label="Impostazioni" className="p-2.5 -mr-2 rounded-full text-slate-500 active:scale-90"><SettingsIcon className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-10" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-md mx-auto min-h-full" key={tab}>
          <React.Suspense fallback={<div className="py-10 flex justify-center"><Spinner /></div>}>
          {tab === 'planner' && <CheckInCard onReport={setReport} />}
          {tab === 'planner' && <Planner weekDate={weekDate} setWeekDate={setWeekDate} dayIndex={dayIndex} setDayIndex={setDayIndex} onEdit={edit} onDuplicate={duplicate} onDelete={askDelete} />}
          {tab === 'recipes' && <RecipeBook filters={filters} setFilters={setFilters} onNew={() => { setDraft(emptyRecipe()); setTab('add'); }} onEdit={edit} onDuplicate={duplicate} onDelete={askDelete} />}
          {tab === 'add' && <RecipeForm data={draft} onChange={setDraft} onClose={closeDraft} onSave={save} />}
          {tab === 'family' && <Family />}
          {tab === 'shopping' && <Shopping weekDate={weekDate} setWeekDate={setWeekDate} days={shopDays} setDays={setShopDays} />}
          </React.Suspense>
        </div>
      </main>

      <nav className="glass-nav shrink-0 z-30 pb-safe">
        <div className="flex justify-around items-end px-2 pt-2 pb-1 max-w-md mx-auto">
          <NavBtn icon={Calendar} label="Planner" active={tab === 'planner'} onClick={() => setTab('planner')} />
          <NavBtn icon={BookOpen} label="Ricette" active={tab === 'recipes'} onClick={() => setTab('recipes')} />
          <NavBtn icon={ShoppingCart} label="Spesa" active={tab === 'shopping'} onClick={() => setTab('shopping')} />
          <NavBtn icon={Users} label="Famiglia" active={tab === 'family'} onClick={() => setTab('family')} />
        </div>
      </nav>

      <React.Suspense fallback={null}>
      {review && <ProfileEditor member={me} mine title="Controlla i tuoi dati" intro="Questo profilo era stato creato da qualcuno della famiglia. Controlla che nome, dieta, intolleranze e piano alimentare siano giusti e correggi quello che non torna." onChange={saveProfile} onClose={() => setReview(false)} />}
      </React.Suspense>
      {saveError && (
        <div role="alert" className="fixed left-3 right-3 z-[120] bg-red-600 text-white text-sm rounded-2xl p-4 shadow-2xl" style={{ top: 'calc(var(--safe-top) + 0.75rem)' }}>
          <div className="flex gap-3">
            <p className="flex-1">{saveError === 'permission-denied' ? 'Non ho il permesso di salvare. Quasi sempre vuol dire che le regole di Firebase non sono aggiornate: apri Firestore, scheda Regole, incolla il file firestore.rules e premi Pubblica.' : `Non sono riuscito a salvare (${saveError}). Controlla la connessione e riprova.`}</p>
            <button onClick={() => setSaveError('')} aria-label="Chiudi avviso" className="font-bold shrink-0">✕</button>
          </div>
        </div>
      )}
      <React.Suspense fallback={null}>
      {report !== undefined && <ReportSheet symptom={report} onClose={() => setReport(undefined)} />}
      </React.Suspense>
      <React.Suspense fallback={null}>
      {settings && <Settings onClose={() => setSettings(false)} onGoFamily={() => { setSettings(false); setTab('family'); }} onReport={() => { setSettings(false); setReport(null); }} />}
      </React.Suspense>
      {confirm && <Confirm title={confirm.title} msg={confirm.msg} onConfirm={confirm.action} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = React.useState(undefined);
  React.useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return <div className="h-full flex items-center justify-center"><Spinner /></div>;
  if (!user) return <AuthScreen />;
  return <DataProvider user={user}><Main /></DataProvider>;
}
