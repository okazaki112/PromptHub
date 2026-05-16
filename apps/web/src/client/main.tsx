import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import '@desktop-renderer-globals-css';
import '@desktop-renderer-i18n';

document.documentElement.classList.add('prompthub-web-runtime');
document.body.classList.add('prompthub-web-runtime');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
