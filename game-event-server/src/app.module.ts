import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggingModule } from 'src/common/logging/logger.module'
import { EventModule } from 'src/modules/event/event.module';
import { RewardModule } from 'src/modules/reward/reward.module';
import { EventRewardRequestModule } from 'src/modules/event-request/event-reward-request.module';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  imports: [
    // 설정
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 데이터베이스
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    LoggingModule,
    // Redis
    RedisModule,

    // 기능 모듈
    EventModule,
    RewardModule,
    EventRewardRequestModule,
  ],
})
export class AppModule {}
