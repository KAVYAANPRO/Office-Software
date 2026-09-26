import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  role: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// TODO: Replace mock login with real API call — POST /api/v1/auth/login
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const isLoading = false;

  const login = async (username: string, password: string) => {
    // Temporary mock — remove when backend is ready
    await new Promise(r => setTimeout(r, 800));
    if (username === 'admin' && password === 'admin') {
      setUser({ id: '1', name: 'Admin User', role: 'admin' });
    } else {
      throw { response: { data: { message: 'Invalid credentials. Use admin / admin for testing.' } } };
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
