import { Injectable } from '@nestjs/common';
import { ConditionValidatorStrategy } from './condition-validator.strategy';
import { EventCondition } from 'src/modules/event/schemas/event.schema';

@Injectable()
export class LoginValidatorStrategy implements ConditionValidatorStrategy {
  constructor(
  ) {}

  async validate(userId: string, condition: EventCondition): Promise<boolean> {
    return false
  }
}
