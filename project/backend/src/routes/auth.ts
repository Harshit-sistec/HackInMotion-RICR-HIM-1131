import { Router } from 'express';
import { userStore, type StoredUser } from '../lib/users.js';
import { verifyGoogleCredential, GoogleAuthError } from '../lib/googleAuth.js';
import { requireAuth, signToken, type AuthedRequest } from '../middleware/auth.js';

export const authRouter = Router();

function toBackendUser(user: StoredUser) {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    user_metadata: { full_name: user.full_name },
  };
}

authRouter.post('/signup', async (req, res) => {
  const { email, password, options } = req.body ?? {};
  const fullName = options?.data?.full_name?.trim();

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: { message: 'Email is required.' } });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: { message: 'Password must be at least 6 characters.' } });
    return;
  }

  try {
    const user = await userStore.create(email.trim().toLowerCase(), password, fullName || email.split('@')[0]);
    const token = signToken(user.id);
    res.json({ data: { session: { access_token: token }, user: toBackendUser(user) } });
  } catch (err) {
    res.status(409).json({ error: { message: err instanceof Error ? err.message : 'Signup failed.' } });
  }
});

authRouter.post('/signin', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: { message: 'Email and password are required.' } });
    return;
  }

  const user = await userStore.findByEmail(String(email).trim().toLowerCase());
  if (!user || !(await userStore.verifyPassword(user, password))) {
    res.status(401).json({ error: { message: 'Invalid email or password.' } });
    return;
  }

  const token = signToken(user.id);
  res.json({ data: { session: { access_token: token }, user: toBackendUser(user) } });
});

authRouter.post('/google', async (req, res) => {
  const { credential } = req.body ?? {};

  if (!credential || typeof credential !== 'string') {
    res.status(400).json({ error: { message: 'A Google credential is required.' } });
    return;
  }

  try {
    const profile = await verifyGoogleCredential(credential);
    const user = await userStore.findOrCreateByGoogle(profile.email, profile.googleId, profile.fullName);
    const token = signToken(user.id);
    res.json({ data: { session: { access_token: token }, user: toBackendUser(user) } });
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      res.status(401).json({ error: { message: err.message } });
      return;
    }
    console.error('Google sign-in failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
  }
});

authRouter.get('/session', requireAuth, async (req: AuthedRequest, res) => {
  const user = await userStore.findById(req.userId!);
  if (!user) {
    res.json({ data: { session: null } });
    return;
  }
  res.json({ data: { session: { user: toBackendUser(user) } } });
});
