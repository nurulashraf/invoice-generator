import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PrintView } from './components/PrintView';
import { I18nProvider } from './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// The export flow opens this same app in a hidden window with ?print=1 to
// render an isolated, dashboard-free invoice for printToPDF. Mark <html> so
// the print stylesheet can hide the window scrollbar (otherwise the hidden
// window paints its own scrollbar into the captured PDF).
const isPrint = new URLSearchParams(window.location.search).get('print') === '1';
if (isPrint) document.documentElement.classList.add('print-route');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      {isPrint ? <PrintView /> : <App />}
    </I18nProvider>
  </React.StrictMode>
);
