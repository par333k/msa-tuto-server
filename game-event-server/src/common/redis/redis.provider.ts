import { Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'

export const REDIS_CLIENT = 'RedisToken';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redisHost = configService.get('REDIS_HOST', 'redis://localhost:6379');
    const client = createClient({ url: redisHost });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await client.connect();
    console.log('Redis client connected successfully');

    return client;
  },
};
