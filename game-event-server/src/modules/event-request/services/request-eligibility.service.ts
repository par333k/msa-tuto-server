import { Injectable } from '@nestjs/common';
import { Event, EventDocument } from 'src/modules/event/schemas/event.schema';
import { RewardRequestService } from './reward-request.service';
import { ConditionValidatorService } from './condition-validator.service';

@Injectable()
export class RequestEligibilityService {
  constructor(
    private readonly rewardRequestService: RewardRequestService,
    private readonly conditionValidatorService: ConditionValidatorService,
  ) {}

  /**
   * 사용자의 이벤트 참여 자격을 확인합니다.
   * @param userId 사용자 ID
   * @param event 이벤트 정보
   * @returns 참여 자격 정보 (eligible: 참여 가능 여부, reason: 참여 불가능 이유)
   */
  async checkEligibility(userId: string, event: EventDocument): Promise<{ eligible: boolean, reason?: string }> {
    if (event.status !== 'ACTIVE') {
      return { eligible: false, reason: '비활성화된 이벤트입니다.' };
    }

    // 2. 이벤트 기간 확인
    const now = new Date();
    if (now < event.startDate || now > event.endDate) {
      return { eligible: false, reason: '이벤트 기간이 아닙니다.' };
    }

    // 3. 이미 참여한 이벤트인지 확인
    try {
      const existingRequest = await this.rewardRequestService.findExistingRequest(userId, event.id);
      if (existingRequest) {
        return { eligible: false, reason: '이미 참여한 이벤트입니다.' };
      }
    } catch (error) {
      // 에러 발생 시 아직 참여하지 않은 것으로 간주
    }

    // 4. 조건 충족 여부 확인
    const conditionMet = await this.conditionValidatorService.validateCondition(
      userId,
      event.type,
      event.condition,
    );

    if (!conditionMet) {
      return { eligible: false, reason: '이벤트 조건을 충족하지 못했습니다.' };
    }

    // 모든 조건을 충족하면 참여 가능
    return { eligible: true };
  }
}
