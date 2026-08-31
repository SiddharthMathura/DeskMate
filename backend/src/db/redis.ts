import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not set in environment variables');
}

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => {
  console.error('[redis] client error:', err);
});

redisClient.on('connect', () => {
  console.log('[redis] connecting...');
});

redisClient.on('ready', () => {
  console.log('[redis] connected and ready');
});

let connectPromise: Promise<void> | null = null;

export function connectRedis(): Promise<void> {
  if (!connectPromise) {
    connectPromise = redisClient.connect().then(() => undefined);
  }
  return connectPromise;
}