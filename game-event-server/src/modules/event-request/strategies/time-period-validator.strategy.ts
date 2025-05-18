import { Injectable } from '@nestjs/common';
import { ConditionValidatorStrategy } from './condition-validator.strategy';
import { EventCondition } from 'src/modules/event/schemas/event.schema';

@Injectable()
export class TimePeriodValidatorStrategy implements ConditionValidatorStrategy {
  async validate(userId: string, condition: EventCondition): Promise<boolean> {
    // 기간 이벤트는 특별한 조건 없이 이벤트 기간 내에만 참여 가능
    // additionalData에서 추가 조건을 확인할 수 있음
    const { additionalData } = condition;
    
    // 예시: 특정 시간대에만 참여 가능한 이벤트
    if (additionalData?.timeRange) {
      const now = new Date();
      const hour = now.getHours();
      
      const { startHour, endHour } = additionalData.timeRange;
      if (hour < startHour || hour >= endHour) {
        return false;
      }
    }
    
    // 기본적으로는 조건을 충족하는 것으로 간주
    return true;
  }
}
