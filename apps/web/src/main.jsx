import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import Sources from './pages/Sources.jsx';
import AddSource from './pages/AddSource.jsx';
import Ask from './pages/Ask.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<Navigate to="/sources" replace />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/sources/new" element={<AddSource />} />
          <Route path="/ask/:dataSourceId" element={<Ask />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
