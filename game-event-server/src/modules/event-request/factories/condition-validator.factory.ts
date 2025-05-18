import { Injectable } from '@nestjs/common';
import { EventType } from 'src/modules/event/schemas/event.schema';
import { ConditionValidatorStrategy } from '../strategies/condition-validator.strategy';
import { LoginValidatorStrategy } from '../strategies/login-validator.strategy';
import { FriendInvitationValidatorStrategy } from '../strategies/friend-invitation-validator.strategy';
import { LevelUpValidatorStrategy } from '../strategies/level-up-validator.strategy';
import { TimePeriodValidatorStrategy } from '../strategies/time-period-validator.strategy';

@Injectable()
export class ConditionValidatorFactory {
  constructor(
    private readonly loginValidatorStrategy: LoginValidatorStrategy,
    private readonly friendInvitationValidatorStrategy: FriendInvitationValidatorStrategy,
  ) {}

  /**
   * 이벤트 타입에 맞는 검증 전략을 반환합니다.
   * @param eventType 이벤트 타입
   * @returns 조건 검증 전략
   */
  getStrategy(eventType: EventType): ConditionValidatorStrategy {
    // 이벤트 타입에 따라 적절한 전략 반환
    // 살재 이벤트 조건에 대한 구체적인 검증은 구현하지 않음
    switch (eventType) {
      case EventType.LOGIN:
        return this.loginValidatorStrategy;
      case EventType.FRIEND_INVITATION:
        return this.friendInvitationValidatorStrategy;
      // 추가 이벤트 타입에 대한 처리
      // case EventType.LEVEL_UP:
      //   return this.levelUpValidatorStrategy;
      // case EventType.TIME_PERIOD:
      //   return this.timePeriodValidatorStrategy;
      default:
        // 기본 전략 (항상 실패 처리)
        return {
          validate: async () => false,
        };
    }
  }
}
