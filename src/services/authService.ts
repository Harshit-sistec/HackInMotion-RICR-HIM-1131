import type { AuthCredentials, SignupPayload, User } from '@/types';
import { fetchApi } from './api';

const TOKEN_KEY = 'nova_auth_token';
const AUTH_KEY = 'nova_auth_user';

export const authService = {
  async login({ email, password }: AuthCredentials): Promise<User> {
    const data = await fetchApi('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || email.split('@')[0],
      avatarColor: '#17B891',
      createdAt: data.user.created_at,
      onboardingComplete: false,
      dailyStudyTargetMinutes: 60,
      preferredStudyTime: 'evening' as const,
      streakCount: 0,
      xp: 0,
      level: 1,
    };
    
    localStorage.setItem(TOKEN_KEY, data.session.access_token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },

  async signup({ name, email, password }: SignupPayload): Promise<User> {
    const data = await fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password,
        options: { data: { full_name: name } }
      }),
    });
    
    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || name,
      avatarColor: '#17B891',
      createdAt: data.user.created_at,
      onboardingComplete: false,
      dailyStudyTargetMinutes: 60,
      preferredStudyTime: 'evening' as const,
      streakCount: 0,
      xp: 0,
      level: 1,
    };

    localStorage.setItem(TOKEN_KEY, data.session.access_token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return { message: `If an account exists for ${email}, a reset link is on its way.` };
  },

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  async updateUser(patch: Partial<User>): Promise<User> {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not signed in.');
    const updated = { ...current, ...patch };
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    return updated as User;
  },

  async completeOnboarding(): Promise<User> {
    return authService.updateUser({ onboardingComplete: true });
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
  },
};
