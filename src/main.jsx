import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './react/context/AppContext';
import { App } from './react/App';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </React.StrictMode>
  );
}
