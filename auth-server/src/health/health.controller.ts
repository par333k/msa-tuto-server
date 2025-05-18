import { Controller, Get } from '@nestjs/common';
import { RedisHealthService } from 'src/health/services/redis-health.service';

@Controller('health')
export class HealthController {
  constructor(private redisHealthService: RedisHealthService) {}

  @Get()
  async check() {
    const redisStatus = await this.redisHealthService.check();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus ? 'up' : 'down',
      },
    };
  }
}
