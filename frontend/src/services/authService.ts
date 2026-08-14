import type { AuthCredentials, SignupPayload, User } from '@/types';
import { api } from '@/services/api';
import { clearStorage, readStorage, writeStorage } from '@/utils/storage';

const AUTH_KEY = 'nova_auth_user';

async function fetchProfile(userId: string) {
  try {
    const { data, error } = await api.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) console.error('Error fetching profile:', error);
    return data;
  } catch (err) {
    console.error('Error fetching profile catch:', err);
    return null;
  }
}

async function updateProfile(userId: string, patch: Record<string, any>) {
  try {
    const { data, error } = await api.from('profiles').update(patch).eq('user_id', userId).single();
    if (error) console.error('Error updating profile:', error);
    return data;
  } catch (err) {
    console.error('Error updating profile catch:', err);
    return null;
  }
}

export const authService = {
  async login({ email, password }: AuthCredentials): Promise<User> {
    const { data, error } = await api.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message || 'Incorrect email or password.');
    if (!data?.user) throw new Error('Invalid login response.');

    const profile = await fetchProfile(data.user.id);
    const onboarding_data = profile?.onboarding_data || {};

    const user: User = {
      id: data.user.id,
      name: profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
      email: data.user.email || '',
      avatarColor: profile?.avatar_url || '#17B891',
      createdAt: data.user.created_at || new Date().toISOString(),
      onboardingComplete: profile?.onboarding_completed || false,
      dailyStudyTargetMinutes: onboarding_data.dailyStudyTargetMinutes || 60,
      preferredStudyTime: onboarding_data.preferredStudyTime || 'evening',
      streakCount: onboarding_data.streakCount || 0,
      xp: onboarding_data.xp || 0,
      level: onboarding_data.level || 1,
    };

    writeStorage(AUTH_KEY, user);
    return user;
  },

  async signup({ name, email, password }: SignupPayload): Promise<User> {
    const { data, error } = await api.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) throw new Error(error.message || 'Failed to sign up.');
    if (!data?.user) throw new Error('Invalid signup response.');

    // Wait a brief moment for database triggers
    await new Promise((resolve) => setTimeout(resolve, 500));

    const onboarding_data = {
      dailyStudyTargetMinutes: 60,
      preferredStudyTime: 'evening' as const,
      streakCount: 0,
      xp: 0,
      level: 1
    };

    await updateProfile(data.user.id, {
      full_name: name,
      onboarding_data
    });

    const user: User = {
      id: data.user.id,
      name: name.trim(),
      email: data.user.email || email,
      avatarColor: '#17B891',
      createdAt: data.user.created_at || new Date().toISOString(),
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
    if (!email.includes('@')) throw new Error('Enter a valid email address.');
    return { message: `If an account exists for ${email}, a reset link is on its way.` };
  },

  getCurrentUser(): User | null {
    return readStorage<User | null>(AUTH_KEY, null);
  },

  async updateUser(patch: Partial<User>): Promise<User> {
    const current = readStorage<User | null>(AUTH_KEY, null);
    if (!current) throw new Error('Not signed in.');

    const updated = { ...current, ...patch };

    // Update MongoDB
    const profilePatch: Record<string, any> = {};
    if (patch.name) profilePatch.full_name = patch.name;
    if (patch.avatarColor) profilePatch.avatar_url = patch.avatarColor;
    if (patch.onboardingComplete !== undefined) profilePatch.onboarding_completed = patch.onboardingComplete;

    const onboarding_data = {
      dailyStudyTargetMinutes: updated.dailyStudyTargetMinutes,
      preferredStudyTime: updated.preferredStudyTime,
      streakCount: updated.streakCount,
      xp: updated.xp,
      level: updated.level
    };
    profilePatch.onboarding_data = onboarding_data;

    await updateProfile(current.id, profilePatch);

    writeStorage(AUTH_KEY, updated);
    return updated;
  },

  async completeOnboarding(): Promise<User> {
    return authService.updateUser({ onboardingComplete: true });
  },

  logout(): void {
    clearStorage(AUTH_KEY);
    api.auth.signOut().catch(console.error);
  },
};
