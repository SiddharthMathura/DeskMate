import 'dotenv/config';
import { encrypt, decrypt } from '../src/auth/redis.crypto.util';
import { redisClient, connectRedis } from '../src/db/redis';

async function runTest() {
  console.log('🧪 Starting Smoke Test...\n');

  try {
    // 1. Initialize Redis connection
    await connectRedis();

    // 2. Define sample raw data (e.g., a mock user session payload)
    const secretSessionData = JSON.stringify({ userId: 'user_98765', role: 'agent' });
    console.log('1. Original Data:', secretSessionData);

    // 3. Test our encryption utility
    const encrypted = encrypt(secretSessionData);
    console.log('2. Encrypted Payload (Ready for Redis):', encrypted);

    // 4. Save the encrypted string straight into Redis with a 60-second expiration timer
    const redisKey = 'test:session:1';
    await redisClient.set(redisKey, JSON.stringify(encrypted), { EX: 60 });
    console.log(`3. Encrypted data safely written to Redis under key: "${redisKey}"`);

    // 5. Read the data back from Redis
    const dataFromRedis = await redisClient.get(redisKey);
    if (!dataFromRedis) throw new Error('Failed to retrieve data from Redis!');
    
    const parsedPayload = JSON.parse(dataFromRedis);
    console.log('4. Retrieved from Redis:', parsedPayload);

    // 6. Decrypt the payload back to plaintext
    const decryptedData = decrypt(parsedPayload);
    console.log('5. Decrypted Plaintext Result:', decryptedData);

    // 7. Sanity Check Validation
    if (decryptedData === secretSessionData) {
      console.log('\n✅ SUCCESS: Encryption, Redis storage, and Decryption match perfectly!');
    } else {
      console.error('\n❌ FAILURE: Decrypted data does not match the original input!');
    }

  } catch (error) {
    console.error('\n💥 Test exploded with an error:', error);
  } finally {
    // Gracefully disconnect from the Redis socket so the script exits cleanly
    await redisClient.disconnect();
    console.log('\n🔌 Disconnected from Redis. Test complete.');
  }
}

runTest();
