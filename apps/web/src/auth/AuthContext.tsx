import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver' | 'manager';
  employeeId: string;
  avatar: string;
  accessLevel: string;
  description: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-admin',
    name: 'JP Wilson',
    email: 'jp.wilson@servicecore.com',
    role: 'admin',
    employeeId: 'emp-014',
    avatar: '#f89020',
    accessLevel: 'Administrator — Full Access',
    description: 'Dashboard, analytics, approvals, invoicing, settings, and all management tools',
  },
  {
    id: 'demo-driver',
    name: 'Marcus Trujillo',
    email: 'marcus.trujillo@servicecore.com',
    role: 'driver',
    employeeId: 'emp-001',
    avatar: '#3b82f6',
    accessLevel: 'Driver — Limited Access',
    description: 'Time clock, daily route planning, schedule view, and equipment status',
  },
  {
    id: 'demo-manager',
    name: 'Andrea Quintana',
    email: 'andrea.quintana@servicecore.com',
    role: 'manager',
    employeeId: 'emp-014',
    avatar: '#dc2626',
    accessLevel: 'Operations Manager — Full Access',
    description: 'Crew scheduling, approvals, customers, invoicing, analytics, and reporting',
  },
];

interface AuthState {
  user: DemoUser | null;
  isAuthenticated: boolean;
  login: (userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(() => {
    const stored = localStorage.getItem('servicecore_demo_user');
    if (stored) {
      const found = DEMO_USERS.find((u) => u.id === stored);
      return found || null;
    }
    return null;
  });

  const login = useCallback((userId: string) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      localStorage.setItem('servicecore_demo_user', found.id);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('servicecore_demo_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
