import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';

export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
}

let client: OAuth2Client | null = null;
function getClient(): OAuth2Client {
  if (!client) client = new OAuth2Client(config.googleClientId);
  return client;
}

export class GoogleAuthError extends Error {}

export async function verifyGoogleCredential(idToken: string): Promise<GoogleProfile> {
  if (!config.googleClientId) {
    throw new GoogleAuthError('Google sign-in is not configured. Set GOOGLE_CLIENT_ID in server/.env.');
  }

  let payload;
  try {
    const ticket = await getClient().verifyIdToken({ idToken, audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch (err) {
    throw new GoogleAuthError(
      err instanceof Error ? `Invalid Google credential: ${err.message}` : 'Invalid Google credential.',
    );
  }

  if (!payload || !payload.email) {
    throw new GoogleAuthError('Google did not return an email address for this account.');
  }
  if (!payload.email_verified) {
    throw new GoogleAuthError("This Google account's email is not verified.");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    fullName: payload.name || payload.email.split('@')[0],
  };
}
