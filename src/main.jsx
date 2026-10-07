import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary, { watchChunkErrors } from './components/ErrorBoundary.jsx';
import './index.css';

watchChunkErrors();
createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
// se l'app è rimasta su per qualche secondo, il caricamento è andato bene: un prossimo errore potrà ricaricare di nuovo
setTimeout(() => { try { sessionStorage.removeItem('germoglio-reloaded'); } catch { /* ignora */ } }, 10000);
