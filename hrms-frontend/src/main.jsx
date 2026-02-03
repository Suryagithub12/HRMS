import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { SocketProvider } from './contexts/SocketContext';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
    <ErrorBoundary>
      <SocketProvider>
        <App />
      </SocketProvider>
    </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
