import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

// Types
interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load session from Supabase/localStorage on mount
  useEffect(() => {
    const currentSession = supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) localStorage.removeItem('sb-session');
      else localStorage.setItem('sb-session', JSON.stringify(session));
    });
    // Listen for storage events (sync logout/login across tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sb-session') {
        if (e.newValue) {
          const sess = JSON.parse(e.newValue);
          setSession(sess);
          setUser(sess?.user ?? null);
        } else {
          setSession(null);
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      listener?.subscription.unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return { error: error.message };
    setSession(data.session);
    setUser(data.session?.user ?? null);
    if (data.session) localStorage.setItem('sb-session', JSON.stringify(data.session));
    return {};
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    localStorage.removeItem('sb-session');
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
