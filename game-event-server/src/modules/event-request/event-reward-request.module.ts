import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from 'src/common/redis/redis.module'
import {
  EventRequestHttpController,
} from 'src/modules/event-request/http-controllers/event-request-http.controller';
import { EventRewardRequestController } from 'src/modules/event-request/event-reward-request.controller';
import { RewardRequest, RewardRequestSchema } from 'src/modules/event-request/schemas/reward-request.schema';
import { ConditionValidatorService } from 'src/modules/event-request/services/condition-validator.service';
import { RequestEligibilityService } from 'src/modules/event-request/services/request-eligibility.service';
import { RewardRequestService } from 'src/modules/event-request/services/reward-request.service';
import { EventModule } from 'src/modules/event/event.module';
import { RewardModule } from 'src/modules/reward/reward.module';
import { ConditionValidatorFactory } from './factories/condition-validator.factory';
import { FriendInvitationValidatorStrategy } from './strategies/friend-invitation-validator.strategy';
import { LevelUpValidatorStrategy } from './strategies/level-up-validator.strategy';
import { LoginValidatorStrategy } from './strategies/login-validator.strategy';
import { TimePeriodValidatorStrategy } from './strategies/time-period-validator.strategy';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: RewardRequest.name, schema: RewardRequestSchema },
    ]),
    EventModule,
    RewardModule,
    RedisModule,
  ],
  controllers: [
    EventRewardRequestController,      // 메시지 큐 컨트롤러
    EventRequestHttpController,  // HTTP API 컨트롤러
  ],
  providers: [
    RewardRequestService,
    ConditionValidatorService,
    RequestEligibilityService,

    // 조건 검증 전략들 등록
    LoginValidatorStrategy,
    FriendInvitationValidatorStrategy,
    LevelUpValidatorStrategy,
    TimePeriodValidatorStrategy,
    ConditionValidatorFactory,
  ],
  exports: [
    RewardRequestService,
    ConditionValidatorService,
  ],
})
export class EventRewardRequestModule {}
