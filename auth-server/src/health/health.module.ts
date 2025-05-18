import { Module } from '@nestjs/common';
import { HealthController } from 'src/health/health.controller';
import { RedisHealthService } from 'src/health/services/redis-health.service';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [HealthController],
  providers: [RedisHealthService],
})
export class HealthModule {}
