import { Injectable } from '@nestjs/common';
import { ConditionValidatorStrategy } from './condition-validator.strategy';
import { EventCondition } from 'src/modules/event/schemas/event.schema';
import { EventDataProvider } from '../interfaces/event-data-provider.interface';

@Injectable()
export class FriendInvitationValidatorStrategy implements ConditionValidatorStrategy {
  constructor(
  ) {}

  async validate(userId: string, condition: EventCondition): Promise<boolean> {
    return true
  }
}
