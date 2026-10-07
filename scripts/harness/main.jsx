import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { Main } from '../../src/App.jsx';
import { DataProvider } from './mock-data.jsx';

createRoot(document.getElementById('root')).render(<DataProvider><Main /></DataProvider>);
