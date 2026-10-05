// Gesto "indietro" di iPhone (scorrere dal bordo sinistro) e tasto indietro di Android:
// ogni schermata sovrapposta (scheda ricetta, pannello, conferma) aggiunge una voce alla cronologia del browser,
// così il gesto la chiude invece di uscire dall'app. Il cambio di scheda in basso funziona allo stesso modo.

const stack = []; // schermate sovrapposte aperte, l'ultima è in cima
let skip = 0; // popstate provocati da noi (chiusura con i pulsanti) da ignorare
let tabBack = null;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (skip > 0) { skip--; return; }
    const top = stack.pop();
    if (top) top.close();
    else tabBack?.();
  });
}

// Registra una schermata sovrapposta. Restituisce la funzione da chiamare quando si chiude con i pulsanti.
export const pushOverlay = (close) => {
  const entry = { close };
  stack.push(entry);
  history.pushState({ overlay: true }, '');
  return () => {
    const i = stack.indexOf(entry);
    if (i < 0) return; // già chiusa dal gesto indietro
    stack.splice(i, 1);
    skip++;
    history.back();
  };
};

// Cambi di scheda: onBack riporta alla scheda precedente
export const setTabBackHandler = (fn) => { tabBack = fn; };
export const pushTabState = () => history.pushState({ tab: true }, '');
