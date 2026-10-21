import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './store/AuthContext';
import { LanguageSwitcher } from './components/layout/LanguageSwitcher';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <LanguageSwitcher />
    </AuthProvider>
  </React.StrictMode>
);
