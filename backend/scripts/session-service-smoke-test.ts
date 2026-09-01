import 'dotenv/config';
import { connectRedis, redisClient } from '../src/db/redis';
import {
  createSession,
  readSession,
  touchSession,
  destroySession,
} from '../src/auth/session.service';

async function main() {
  // Ensure we are connected to the Redis instance
  await connectRedis();

  console.log('--- session.service smoke test ---');

  // 1. Create a session with a short 10-second initial TTL
  const sessionId = await createSession({ userId: 'test-user-id', role: 'agent' }, 10);
  console.log('[1] created session:', sessionId);

  // 2. Read back and verify structural mapping
  const payload = await readSession(sessionId);
  console.log('[2] read back payload:', payload);
  if (!payload || payload.userId !== 'test-user-id' || payload.role !== 'agent') {
    throw new Error('Read payload does not match what was created');
  }

  // 3. Confirm target TTL constraints
  const ttlAfterCreate = await redisClient.ttl(`session:${sessionId}`);
  console.log('[3] TTL after create (seconds):', ttlAfterCreate);
  if (ttlAfterCreate <= 0) {
    throw new Error('Expected a positive TTL after create');
  }

  // 4. Touch to extend TTL via rolling window (sliding expiry)
  const touched = await touchSession(sessionId, 3600);
  const ttlAfterTouch = await redisClient.ttl(`session:${sessionId}`);
  console.log('[4] touch result:', touched, '| TTL after touch:', ttlAfterTouch);
  if (!touched || ttlAfterTouch <= ttlAfterCreate) {
    throw new Error('Expected touch to extend the TTL');
  }

  // 5. Assert fallback logic for missing target sessions
  const touchedMissing = await touchSession('does-not-exist', 3600);
  console.log('[5] touch on missing session returns:', touchedMissing);
  if (touchedMissing !== false) {
    throw new Error('Expected touch on missing session to return false');
  }

  // 6. Destroy session entries and verify extraction termination
  await destroySession(sessionId);
  const afterDestroy = await readSession(sessionId);
  console.log('[6] read after destroy:', afterDestroy);
  if (afterDestroy !== null) {
    throw new Error('Expected session to be gone after destroy');
  }

  console.log('--- all checks passed ---');
  await redisClient.quit();
  process.exit(0);
}

main().catch((err) => {
  console.error('smoke test failed:', err);
  process.exit(1);
});
