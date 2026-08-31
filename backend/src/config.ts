import 'dotenv/config';

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Critical Error: Missing required environment variable: ${key}`);
  }
  return value;
};

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: requiredEnv('DATABASE_URL'),
  redisUrl: requiredEnv('REDIS_URL'),
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'deskmate_sid',
  sessionEncryptionKey: requiredEnv('SESSION_ENCRYPTION_KEY'),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
};