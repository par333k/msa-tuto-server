import { Event } from 'src/modules/event/schemas/event.schema';

export class EventEligibilityDto {
  event: Event;
  eligible: boolean;
  reason?: string;
  
  constructor(event: Event, eligible: boolean, reason?: string) {
    this.event = event;
    this.eligible = eligible;
    this.reason = reason;
  }
}
