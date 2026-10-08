import React from 'react';
import { signOut } from 'firebase/auth';
import { Check, Copy, Download, LogOut, Upload } from 'lucide-react';
import { auth } from '../firebase.js';
import { useData } from '../hooks/data.jsx';
import { Block, Confirm, Sheet, Tabs } from '../components/ui.jsx';
import { convertLegacyRecipe } from '../lib/legacy.js';

export default function Settings({ onClose, onGoFamily }) {
  const { user, userRecipes, saveRecipe, household, me, overrideIds, restoreAllSeeds, memberCount, createInvite, joinHousehold, leaveHousehold } = useData();
  const [code, setCode] = React.useState('');
  const [joinCode, setJoinCode] = React.useState('');
  const [confirmJoin, setConfirmJoin] = React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); }
    catch { // browser senza accesso agli appunti: copia dal campo selezionato
      const t = document.createElement('textarea'); t.value = code; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch { /* ignora */ }
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const [msg, setMsg] = React.useState('');
  const fileRef = React.useRef(null);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), profile: me, rules: household.rules, recipes: userRecipes }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `germoglio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Accetta un file JSON con un array di ricette (vecchia app o backup di questa)
  const importFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const list = Array.isArray(data) ? data : data.recipes;
      if (!Array.isArray(list)) throw new Error();
      list.forEach((r) => saveRecipe({ ...(r.steps ? r : convertLegacyRecipe(r)), id: null, own: false }));
      setMsg(`Importate ${list.length} ricette. Controlla la dieta e le componenti degli ingredienti.`);
    } catch { setMsg('File non valido.'); }
    e.target.value = '';
  };

  const btn = 'w-full p-4 bg-slate-50 rounded-2xl flex items-center gap-3 text-slate-700 font-bold active:scale-[0.98]';
  const [tab, setTab] = React.useState('account');
  return (
    <Sheet title="Impostazioni" onClose={onClose}>
      <div className="p-5 space-y-5">
        <Tabs tabs={[{ id: 'account', label: 'Account' }, { id: 'nucleo', label: 'Nucleo' }, { id: 'dati', label: 'Dati' }]} value={tab} onChange={setTab} label="Impostazioni" />

        {tab === 'account' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500">Accesso come <b className="text-slate-700">{user.email}</b></p>
            <Block title="Il tuo profilo e il tuo piano" hint="Dieta, intolleranze, piano alimentare, pasti che vuoi vedere e come rispettare le quantità si cambiano dalla scheda Famiglia, aprendo il tuo profilo.">
              {onGoFamily && <button onClick={onGoFamily} className="w-full py-3 bg-brand-50 text-brand-700 font-bold rounded-2xl active:scale-[0.98]">Apri Famiglia</button>}
            </Block>
            <button onClick={() => signOut(auth)} className="w-full py-3 text-red-600 font-bold rounded-2xl bg-red-50 flex items-center justify-center gap-2 active:scale-[0.98]"><LogOut className="w-5 h-5" /> Esci</button>
          </div>
        )}

        {tab === 'nucleo' && (
          <Block title="Nucleo condiviso" hint={memberCount > 1 ? `Questo nucleo ha ${memberCount} account: vedono e modificano gli stessi menù, ricette, lista della spesa e dispensa.` : 'Per ora solo il tuo account. Crea un codice di invito per condividere menù, spesa e dispensa con altre persone.'}>
            {code ? (
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="font-mono text-2xl tracking-widest text-slate-800">{code}</p>
                <p className="text-[11px] text-slate-400 mt-1">Vale 48 ore. Chi lo inserisce vede tutti i dati del nucleo.</p>
                <button onClick={copyCode} aria-live="polite" className={`mt-2 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 mx-auto active:scale-95 ${copied ? 'bg-brand-100 text-brand-700' : 'bg-white text-slate-600'}`}>{copied ? <><Check className="w-3.5 h-3.5" /> Codice copiato</> : <><Copy className="w-3.5 h-3.5" /> Copia il codice</>}</button>
              </div>
            ) : <button onClick={async () => { setErr(''); try { setCode(await createInvite()); } catch { setErr('Non riesco a creare il codice.'); } }} className="w-full py-3 bg-brand-600 text-white rounded-2xl text-sm font-bold active:scale-[0.98]">Crea un codice d'invito</button>}
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-500 mb-2">Hai già un codice?</p>
              <div className="flex gap-2">
                <input className="flex-1 min-w-0 p-2.5 bg-slate-50 rounded-xl text-sm uppercase tracking-widest" placeholder="Codice" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} aria-label="Codice d'invito" />
                <button disabled={!joinCode.trim()} onClick={() => setConfirmJoin(true)} className="px-4 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold disabled:opacity-40 active:scale-95">Unisciti</button>
              </div>
            </div>
            {memberCount > 1 && <button onClick={() => setConfirmLeave(true)} className="text-xs font-bold text-red-500">Esci da questo nucleo</button>}
            {err && <p className="text-xs text-red-500">{err}</p>}
          </Block>
        )}

        {tab === 'dati' && (
          <Block title="I tuoi dati" hint="Una copia di sicurezza contiene il tuo profilo, le regole e le ricette che hai creato.">
            <button onClick={exportAll} className={btn}><Download className="w-5 h-5" /> Esporta copia di sicurezza</button>
            <button onClick={() => fileRef.current?.click()} className={btn}><Upload className="w-5 h-5" /> Importa ricette da file JSON</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importFile} />
            {overrideIds.length > 0 && <button onClick={() => { restoreAllSeeds(); setMsg('Ricette precaricate ripristinate.'); }} className={btn}>Ripristina le ricette precaricate ({overrideIds.length} modificate o eliminate)</button>}
            {msg && <p className="text-sm text-brand-700">{msg}</p>}
          </Block>
        )}
      </div>
      {confirmJoin && <Confirm title="Unirti a questo nucleo?" msg="Vedrai i dati del nucleo al posto dei tuoi. Le tue ricette e i tuoi menù attuali restano nel tuo vecchio nucleo: esporta prima una copia se ti servono." confirmLabel="Unisciti" onCancel={() => setConfirmJoin(false)} onConfirm={async () => { setConfirmJoin(false); setErr(''); try { await joinHousehold(joinCode); onClose(); } catch (e) { setErr(e.message || 'Non è stato possibile unirsi al nucleo.'); } }} />}
      {confirmLeave && <Confirm title="Uscire dal nucleo?" msg="Ripartirai con un nucleo nuovo e vuoto. Gli altri account continuano a vedere i dati condivisi." confirmLabel="Esci" onCancel={() => setConfirmLeave(false)} onConfirm={async () => { setConfirmLeave(false); try { await leaveHousehold(); onClose(); } catch { setErr('Non è stato possibile uscire.'); } }} />}
    </Sheet>
  );
}
