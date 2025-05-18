import { Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'

export const CACHE_CLIENT = 'CacheToken';

export const CacheRedisProvider: Provider = {
  provide: CACHE_CLIENT,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redisHost = configService.get('REDIS_URL', 'redis://localhost:6379');
    const client = createClient({ url: redisHost });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await client.connect();
    console.log('Redis client connected successfully');

    return client;
  },
};
