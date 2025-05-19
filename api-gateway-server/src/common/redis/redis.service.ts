import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from 'src/common/redis/redis.provider';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT) private redisClient: RedisClientType,
  ) {
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.set(key, value, { EX: ttl });
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async incr(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    return this.redisClient.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(key);
  }

  getClient(): RedisClientType {
    return this.redisClient;
  }
}
