import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { JournalProvider } from './hooks/useActiveJournal.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <JournalProvider>
        <App />
      </JournalProvider>
    </BrowserRouter>
  </React.StrictMode>
);