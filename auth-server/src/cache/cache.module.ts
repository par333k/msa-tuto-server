import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CACHE_CLIENT, CacheRedisProvider } from 'src/cache/cache.provider'
import { CacheService } from 'src/cache/cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CacheService, CacheRedisProvider],
  exports: [CacheService, CACHE_CLIENT],
})
export class CacheModule {}
