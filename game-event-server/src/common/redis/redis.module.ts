import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { REDIS_CLIENT, RedisProvider } from 'src/common/redis/redis.provider'
import { RedisService } from 'src/common/redis/redis.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, RedisProvider],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
