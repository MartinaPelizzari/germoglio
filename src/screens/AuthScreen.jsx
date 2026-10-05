import React from 'react';
import { GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Leaf } from 'lucide-react';
import { auth } from '../firebase.js';

const ERRORS = {
  'auth/invalid-email': 'Indirizzo email non valido.',
  'auth/invalid-credential': 'Email o password non corrette.',
  'auth/wrong-password': 'Email o password non corrette.',
  'auth/user-not-found': 'Email o password non corrette.',
  'auth/email-already-in-use': 'Esiste già un account con questa email.',
  'auth/weak-password': 'La password deve avere almeno 6 caratteri.',
  'auth/too-many-requests': 'Troppi tentativi. Riprova tra qualche minuto.',
  'auth/network-request-failed': 'Nessuna connessione.',
  'auth/popup-closed-by-user': '',
  'auth/unauthorized-domain': 'Questo indirizzo non è autorizzato in Firebase (vedi README, sezione Firebase).',
};

export default function AuthScreen() {
  const [mode, setMode] = React.useState('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState({ type: '', text: '' });

  const run = async (fn) => {
    setBusy(true);
    setMsg({ type: '', text: '' });
    try { await fn(); } catch (e) { setMsg({ type: 'err', text: ERRORS[e.code] ?? 'Qualcosa non ha funzionato. Riprova.' }); }
    setBusy(false);
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => (mode === 'login' ? signInWithEmailAndPassword(auth, email.trim(), password) : createUserWithEmailAndPassword(auth, email.trim(), password)));
  };

  const reset = () => {
    if (!email.trim()) return setMsg({ type: 'err', text: 'Scrivi prima la tua email.' });
    run(async () => { await sendPasswordResetEmail(auth, email.trim()); setMsg({ type: 'ok', text: 'Ti abbiamo inviato un\'email per reimpostare la password.' }); });
  };

  const input = 'w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-surface-ground pt-safe pb-safe">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brand-500 text-white p-4 rounded-3xl shadow-glow mb-4"><Leaf className="w-8 h-8" /></div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900">Germoglio</h1>
          <p className="text-slate-500 text-sm mt-1">Menù settimanale e lista della spesa</p>
        </div>
        <form onSubmit={submit} className="bg-white p-6 rounded-3xl shadow-soft space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-800 mb-1">{mode === 'login' ? 'Accedi' : 'Crea il tuo account'}</h2>
          <input className={input} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {msg.text && <p className={`text-sm ${msg.type === 'ok' ? 'text-brand-700' : 'text-red-500'}`}>{msg.text}</p>}
          <button disabled={busy} className="w-full py-4 bg-brand-600 text-white font-display font-bold rounded-2xl shadow-glow active:scale-95 disabled:opacity-60">
            {busy ? 'Un attimo...' : mode === 'login' ? 'Accedi' : 'Registrati'}
          </button>
          <button type="button" disabled={busy} onClick={() => run(() => signInWithPopup(auth, new GoogleAuthProvider()))} className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl active:scale-95">
            Continua con Google
          </button>
          <div className="flex justify-between text-sm pt-1">
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg({ type: '', text: '' }); }} className="text-brand-700 font-semibold">
              {mode === 'login' ? 'Crea un account' : 'Ho già un account'}
            </button>
            {mode === 'login' && <button type="button" onClick={reset} className="text-slate-400">Password dimenticata?</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
