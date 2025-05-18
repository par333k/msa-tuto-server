import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class RedisHealthService {
  private readonly logger = new Logger(RedisHealthService.name);

  constructor(private cacheService: CacheService) {}

  async check(): Promise<boolean> {
    try {
      return await this.cacheService.ping();
    } catch (error) {
      this.logger.error('Redis health check failed', error.stack);
      return false;
    }
  }
}
