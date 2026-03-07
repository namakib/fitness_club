import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      const data = await api.get('/me');
      setUser(data.user);
      setRole(data.role);
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMe(); }, []);

  async function login(email, password, loginRole) {
    const data = await api.post('/login', { email, password, role: loginRole });
    setUser(data.user);
    setRole(data.role);
    return data;
  }

  async function logout() {
    try {
      await api.post('/logout');
    } finally {
      setUser(null);
      setRole(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
