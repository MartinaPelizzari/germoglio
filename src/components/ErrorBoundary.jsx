import React from 'react';

// Se qualcosa si rompe, invece di una schermata bianca si vede il motivo e un pulsante per ricaricare.
// Un errore di caricamento di un pezzo dell'app (di solito dopo un aggiornamento) si risolve ricaricando una volta da solo.
const isChunkError = (e) => /Loading chunk|dynamically imported module|Importing a module script failed|error loading dynamically/i.test(String(e?.message || e));
const reloadOnce = () => {
  try {
    if (sessionStorage.getItem('germoglio-reloaded')) return false;
    sessionStorage.setItem('germoglio-reloaded', '1');
  } catch { /* si ricarica comunque */ }
  window.location.reload();
  return true;
};

export default class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) {
    console.error(error);
    if (isChunkError(error)) reloadOnce();
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 bg-white text-slate-800">
        <div className="max-w-sm w-full space-y-4 text-center">
          <h1 className="text-xl font-bold">Qualcosa non è andato</h1>
          <p className="text-sm text-slate-500">L'app ha avuto un problema. Di solito basta ricaricarla.</p>
          <button onClick={() => { try { sessionStorage.removeItem('germoglio-reloaded'); } catch { /* ignora */ } window.location.reload(); }} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl">Ricarica</button>
          <p className="text-[11px] text-slate-400 break-words">{String(this.state.error?.message || this.state.error).slice(0, 300)}</p>
        </div>
      </div>
    );
  }
}

// Un pezzo dell'app che non si scarica (versione vecchia in cache): si ricarica una volta
export const watchChunkErrors = () => {
  window.addEventListener('vite:preloadError', (e) => { if (reloadOnce()) e.preventDefault(); });
  window.addEventListener('unhandledrejection', (e) => { if (isChunkError(e.reason)) reloadOnce(); });
};
