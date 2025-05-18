import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REDIS_CLIENT, RedisProvider } from 'src/common/redis/redis.provider'
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, RedisProvider],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
