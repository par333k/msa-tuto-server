import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TerminusModule,
    HttpModule.register({  // 명시적으로 등록
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule],
  controllers: [HealthController],
})
export class HealthModule {}
