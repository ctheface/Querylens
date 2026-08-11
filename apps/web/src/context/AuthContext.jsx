import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAccessToken, tryRefresh } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Silent login on page load: the refresh cookie may still be valid.
  useEffect(() => {
    tryRefresh()
      .then((restored) => setUser(restored))
      .finally(() => setInitializing(false));
  }, []);

  // The API layer fires this when a refresh fails mid-session.
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('ql:logout', onLogout);
    return () => window.removeEventListener('ql:logout', onLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.register({ name, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  /** Used after Google OAuth redirect — refresh cookie was set by the API. */
  const adoptSession = useCallback(async () => {
    const restored = await tryRefresh();
    setUser(restored);
    return restored;
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, initializing, login, register, logout, adoptSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
