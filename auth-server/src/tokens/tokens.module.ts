import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TokensService } from 'src/tokens/tokens.service';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [CacheModule, JwtModule, ConfigModule],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
