import crypto from 'node:crypto';
import { redisClient } from '../db/redis';
import { encrypt, decrypt, type EncryptedPayload } from './redis.crypto.util';

const SESSION_ID_BYTES = 32; // 256-bit opaque session id
const DEFAULT_SESSION_TTL_SECONDS = Number(
  process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 7 // 7 days
);

export type SessionRole = 'agent' | 'admin';

export interface SessionPayload {
  userId: string;
  role: SessionRole;
}

function sessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

function generateSessionId(): string {
  return crypto.randomBytes(SESSION_ID_BYTES).toString('hex');
}

/**
 * Creates a new session: encrypts the payload, stores it in Redis under
 * session:{sessionId} with a TTL, and returns the opaque session id.
 * The session id (not the payload) is what gets set in the browser cookie.
 */
export async function createSession(
  payload: SessionPayload,
  ttlSeconds: number = DEFAULT_SESSION_TTL_SECONDS
): Promise<string> {
  const sessionId = generateSessionId();
  const encrypted = encrypt(JSON.stringify(payload));

  await redisClient.set(sessionKey(sessionId), JSON.stringify(encrypted), {
    EX: ttlSeconds,
  });

  return sessionId;
}

/**
 * Reads and decrypts a session by id. Returns null if the session doesn't
 * exist, has expired, or fails to decrypt/parse (treated as invalid rather
 * than thrown — a corrupted session should just look "logged out").
 */
export async function readSession(sessionId: string): Promise<SessionPayload | null> {
  const raw = await redisClient.get(sessionKey(sessionId));
  if (!raw) return null;

  try {
    const encrypted = JSON.parse(raw) as EncryptedPayload;
    const plaintext = decrypt(encrypted);
    return JSON.parse(plaintext) as SessionPayload;
  } catch (err) {
    console.error('[session] failed to decrypt/parse session, treating as invalid:', err);
    return null;
  }
}

/**
 * Deletes a session outright (logout).
 */
export async function destroySession(sessionId: string): Promise<void> {
  await redisClient.del(sessionKey(sessionId));
}

/**
 * Resets a session's TTL (sliding expiry) without touching its payload.
 * Returns false if the session didn't exist (nothing to touch).
 */
export async function touchSession(
  sessionId: string,
  ttlSeconds: number = DEFAULT_SESSION_TTL_SECONDS
): Promise<boolean> {
  const result = await redisClient.expire(sessionKey(sessionId), ttlSeconds);
  return Boolean(result);
}

export const SESSION_TTL_SECONDS = DEFAULT_SESSION_TTL_SECONDS;