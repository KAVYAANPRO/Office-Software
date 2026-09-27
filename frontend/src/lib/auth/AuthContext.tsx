import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Role, PermissionKey } from '../permissions/permissions';

export interface User {
  id: string;
  name: string;
  role: Role;
  /** Set only for Factory/Artisan users — scopes all party-owned data (BR-08/AUTH-06). */
  partyId?: string;
  /** AUTH-04 per-user overrides on top of the role default. */
  grantedPermissions?: PermissionKey[];
  deniedPermissions?: PermissionKey[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  /**
   * Dev-only: switch role without a real login round trip, so the frontend's
   * permission gating can be exercised before the backend issues real roles.
   * Remove once AUTH-01..04 are backed by a real API.
   */
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: Record<string, User> = {
  admin: { id: '1', name: 'Admin User', role: 'super_admin' },
};

// TODO: Replace mock login with real API call — POST /api/v1/auth/login
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const isLoading = false;

  const login = async (username: string, password: string) => {
    // Temporary mock — remove when backend is ready
    await new Promise(r => setTimeout(r, 800));
    if (username === 'admin' && password === 'admin') {
      setUser(DEMO_USERS.admin);
    } else {
      throw { response: { data: { message: 'Invalid credentials. Use admin / admin for testing.' } } };
    }
  };

  const logout = () => setUser(null);

  const switchRole = (role: Role) => {
    setUser(prev => (prev ? { ...prev, role, name: prev.name } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
