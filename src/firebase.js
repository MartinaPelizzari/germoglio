import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';

// Queste chiavi non sono segrete: identificano il progetto. A proteggere i dati sono le regole di
// sicurezza in firestore.rules (ognuno legge e scrive solo sotto users/<proprio uid>).
const firebaseConfig = {
  apiKey: 'AIzaSyCmwDzLGkxL6y6DXG1I4bixQffHb_SGVtc',
  authDomain: 'planner-alimentare.firebaseapp.com',
  projectId: 'planner-alimentare',
  storageBucket: 'planner-alimentare.firebasestorage.app',
  messagingSenderId: '776341597044',
  appId: '1:776341597044:web:792a2e1e63571b04ee1a21',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Cache locale: l'app funziona anche senza rete e si risincronizza da sola.
// Un solo gestore di schede (l'app si usa in una finestra sola: meno lavoro all'avvio) e rilevamento automatico del
// "long polling": su alcuni telefoni e reti la connessione normale impiega diversi secondi a ripiegare, e l'app sembra ferma.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
  experimentalAutoDetectLongPolling: true,
});
