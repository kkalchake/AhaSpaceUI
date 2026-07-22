import { createContext, useContext, useState, useCallback } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    return token ? { token, email } : null;
  });

  const login = useCallback((token, email) => {
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    setAuth({ token, email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setAuth(null);
  }, []);

  const value = {
    auth,
    login,
    logout,
    isAuthenticated: !!auth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
