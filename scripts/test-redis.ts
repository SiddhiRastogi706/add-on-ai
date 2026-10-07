import dotenv from 'dotenv';
dotenv.config();
import { RedisService } from '../src/server/services/redis.service';

async function main() {
  console.log('Testing RedisService...');
  const status = await RedisService.getStatus();
  console.log('Status result:', JSON.stringify(status, null, 2));

  await RedisService.set('marketmind:test_key', 'upstash_tls_success_100', 60);
  const value = await RedisService.get('marketmind:test_key');
  console.log('GET result:', value);

  const counter = await RedisService.incr('marketmind:test_counter');
  console.log('INCR result:', counter);

  const ping = await RedisService.ping();
  console.log('PING result:', JSON.stringify(ping));

  process.exit(0);
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
