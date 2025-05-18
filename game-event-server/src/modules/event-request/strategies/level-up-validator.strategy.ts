import { Injectable } from '@nestjs/common';
import { ConditionValidatorStrategy } from './condition-validator.strategy';
import { EventCondition } from 'src/modules/event/schemas/event.schema';
import { EventDataProvider } from '../interfaces/event-data-provider.interface';

@Injectable()
export class LevelUpValidatorStrategy implements ConditionValidatorStrategy {
  constructor(
  ) {}

  async validate(userId: string, condition: EventCondition): Promise<boolean> {
    // 데이터 제공자에서 사용자 레벨 조회
    // const userLevel = await this.eventDataProvider.getUserLevel(userId);

    //if (userLevel === null) {
    //  return false;
    //}

    return false
  }
}
