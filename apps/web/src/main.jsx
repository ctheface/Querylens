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
import Ask from './pages/Ask.jsx';
import './index.css';

function Protected({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) {
    return <p className="text-center text-slate-500 mt-24">Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<App />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<Navigate to="/sources" replace />} />
            <Route path="/sources" element={<Protected><Sources /></Protected>} />
            <Route path="/sources/new" element={<Protected><AddSource /></Protected>} />
            <Route path="/ask/:dataSourceId" element={<Protected><Ask /></Protected>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
