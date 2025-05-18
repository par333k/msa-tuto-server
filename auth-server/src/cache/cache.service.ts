import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { CACHE_CLIENT } from 'src/cache/cache.provider'

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_CLIENT) private redisClient: RedisClientType,
  ) {
  }
  async get<T>(key: string): Promise<any> {
    try {
      // return await this.redisClient.get(key);
    } catch (error) {
      throw error
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.redisClient.set(key, stringValue, { EX: ttl });
    } else {
      await this.redisClient.set(key, stringValue);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async reset(): Promise<void> {
    await this.redisClient.flushAll();
  }

  // Redis 상태 확인 (헬스체크용)
  async ping(): Promise<boolean> {
    const result = await this.redisClient.ping();
    return result === 'PONG';
  }
}
