import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import Onboarding from '../../src/screens/Onboarding.jsx';

window.__saved = null;
createRoot(document.getElementById('root')).render(<Onboarding user={{ uid: 'u1', displayName: 'Martina Rossi' }} onDone={(p) => { window.__saved = p; document.title = 'salvato'; }} />);
