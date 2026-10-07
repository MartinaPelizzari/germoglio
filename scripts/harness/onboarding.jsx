import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import Onboarding from '../../src/screens/Onboarding.jsx';

// ?joined=1 simula chi è appena entrato in un nucleo con dei profili già creati
const joined = new URLSearchParams(location.search).get('joined') === '1';
const free = [{ id: 'p-1', name: 'Papà', emoji: '👨', color: '#8b5cf6', managed: true }, { id: 'p-2', name: 'Nonna', emoji: '👵', color: '#f97316', managed: true }];
window.__saved = null;
createRoot(document.getElementById('root')).render(
  <Onboarding
    user={{ uid: 'u1', displayName: 'Martina Rossi' }}
    joined={joined}
    freeProfiles={joined ? free : []}
    onJoin={async (c) => { if (c.trim().toUpperCase() !== 'ABCD2345') throw new Error('Codice non valido o scaduto.'); document.title = 'entrato'; }}
    onClaim={(id) => { document.title = `reclamato ${id}`; }}
    onDone={(p) => { window.__saved = p; document.title = 'salvato'; }}
  />
);
