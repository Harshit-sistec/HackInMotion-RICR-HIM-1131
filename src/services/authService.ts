import type { AuthCredentials, SignupPayload, User } from '@/types';
import { DEMO_USER } from '@/data/mockData';
import { clearStorage, readStorage, writeStorage } from '@/utils/storage';
import { delay, randomId } from '@/utils/async';

const AUTH_KEY = 'nova_auth_user';

/**
 * Mock auth layer. Swap these implementations for calls to
 * POST /api/auth/login, /api/auth/signup, /api/auth/forgot-password
 * once the Node/Express/JWT backend is ready — the function
 * signatures are designed to stay stable across that swap.
 */
export const authService = {
  async login({ email, password }: AuthCredentials): Promise<User> {
    await delay(700);
    if (!email.includes('@')) throw new Error('Enter a valid email address.');
    if (password.length < 6) throw new Error('Incorrect email or password.');

    const isDemo = email.trim().toLowerCase() === DEMO_USER.email;
    const user: User = isDemo ? DEMO_USER : { ...DEMO_USER, id: randomId('user'), email, name: email.split('@')[0] };
    writeStorage(AUTH_KEY, user);
    return user;
  },

  async signup({ name, email, password }: SignupPayload): Promise<User> {
    await delay(900);
    if (!name.trim()) throw new Error('Please enter your name.');
    if (!email.includes('@')) throw new Error('Enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');

    const user: User = {
      id: randomId('user'),
      name: name.trim(),
      email,
      avatarColor: '#17B891',
      createdAt: new Date().toISOString(),
      onboardingComplete: false,
      dailyStudyTargetMinutes: 60,
      preferredStudyTime: 'evening',
      streakCount: 0,
      xp: 0,
      level: 1,
    };
    writeStorage(AUTH_KEY, user);
    return user;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    await delay(800);
    if (!email.includes('@')) throw new Error('Enter a valid email address.');
    return { message: `If an account exists for ${email}, a reset link is on its way.` };
  },

  getCurrentUser(): User | null {
    return readStorage<User | null>(AUTH_KEY, null);
  },

  async updateUser(patch: Partial<User>): Promise<User> {
    await delay(400);
    const current = readStorage<User | null>(AUTH_KEY, null);
    if (!current) throw new Error('Not signed in.');
    const updated = { ...current, ...patch };
    writeStorage(AUTH_KEY, updated);
    return updated;
  },

  async completeOnboarding(): Promise<User> {
    return authService.updateUser({ onboardingComplete: true });
  },

  logout(): void {
    clearStorage(AUTH_KEY);
  },
};
