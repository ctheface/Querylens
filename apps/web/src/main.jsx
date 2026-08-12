import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import Sources from './pages/Sources.jsx';
import AddSource from './pages/AddSource.jsx';
import Landing from './pages/Landing.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import Ask from './pages/Ask.jsx';
import './index.css';

function Protected({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) {
    return (
      <div className="flex items-center justify-center py-32 text-ink-500">
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<App />}>
              <Route path="/" element={<Landing />} />
              <Route path="/demo" element={<Ask demo />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/sources" element={<Protected><Sources /></Protected>} />
              <Route path="/sources/new" element={<Protected><AddSource /></Protected>} />
              <Route path="/ask/:dataSourceId" element={<Protected><Ask /></Protected>} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Analytics />
      <SpeedInsights />
    </ThemeProvider>
  </React.StrictMode>
);
