import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3001,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/',
  mongoDbName: process.env.MONGODB_DB_NAME || 'nova',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '',
};

export function requireJwtSecret(): string {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured. Set it in server/.env (copy from .env.example).');
  }
  return config.jwtSecret;
}
