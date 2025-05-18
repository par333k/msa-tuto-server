import { Injectable } from '@nestjs/common';
import { EventType, EventCondition } from 'src/modules/event/schemas/event.schema';
import { ConditionValidatorFactory } from '../factories/condition-validator.factory';

@Injectable()
export class ConditionValidatorService {
  constructor(
    private readonly validatorFactory: ConditionValidatorFactory,
  ) {}

  /**
   * 이벤트 조건 충족 여부를 검증합니다.
   * @param userId 사용자 ID
   * @param eventType 이벤트 타입
   * @param condition 이벤트 조건
   * @returns 조건 충족 여부 (true/false)
   */
  async validateCondition(userId: string, eventType: EventType, condition: EventCondition): Promise<boolean> {
    // 팩토리에서 이벤트 타입에 맞는 검증 전략 가져오기
    const validator = this.validatorFactory.getStrategy(eventType);
    
    // 전략을 사용하여 조건 검증
    return await validator.validate(userId, condition);
  }
}
