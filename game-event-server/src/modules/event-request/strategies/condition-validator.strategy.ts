import { EventCondition } from 'src/modules/event/schemas/event.schema';

// 조건 검증 전략 인터페이스
export interface ConditionValidatorStrategy {
  /**
   * 이벤트 조건 충족 여부를 검증합니다.
   * @param userId 사용자 ID
   * @param condition 이벤트 조건
   * @returns 조건 충족 여부 (true/false)
   */
  validate(userId: string, condition: EventCondition): Promise<boolean>;
}
