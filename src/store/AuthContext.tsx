import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthCredentials, SignupPayload, User } from '@/types';
import { authService } from '@/services/authService';
import { DEMO_USER } from '@/data/mockData';

interface AuthContextValue {
  user: User | null;
  isInitializing: boolean;
  login: (credentials: AuthCredentials) => Promise<User>;
  signup: (payload: SignupPayload) => Promise<User>;
  loginAsDemo: () => Promise<User>;
  logout: () => void;
  completeOnboarding: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    setIsInitializing(false);
  }, []);

  const login = async (credentials: AuthCredentials) => {
    const loggedIn = await authService.login(credentials);
    setUser(loggedIn);
    return loggedIn;
  };

  const signup = async (payload: SignupPayload) => {
    const created = await authService.signup(payload);
    setUser(created);
    return created;
  };

  const loginAsDemo = async () => {
    const demo = await authService.login({ email: DEMO_USER.email, password: 'demo1234' });
    setUser(demo);
    return demo;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const completeOnboarding = async () => {
    const updated = await authService.completeOnboarding();
    setUser(updated);
  };

  const updateUser = async (patch: Partial<User>) => {
    const updated = await authService.updateUser(patch);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{ user, isInitializing, login, signup, loginAsDemo, logout, completeOnboarding, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
