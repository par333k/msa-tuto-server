import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserRole } from 'src/common/constants/roles.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { MessageInterceptor } from 'src/common/interceptors/message.interceptor'
import { CreateRewardRequestDto } from 'src/modules/event-request/dto/create-reward-request.dto';
import { RewardRequest } from 'src/modules/event-request/schemas/reward-request.schema'
import { RewardRequestService } from 'src/modules/event-request/services/reward-request.service';

@Controller()
@UseInterceptors(MessageInterceptor)
export class EventRewardRequestController {
  constructor(private readonly rewardRequestService: RewardRequestService) {}

  @EventPattern({ cmd: 'create_reward_request' })
  @Roles(UserRole.USER, UserRole.ADMIN)
  async createRewardRequest(@Payload() payload: { user: any, data: CreateRewardRequestDto }): Promise<RewardRequest> {
    const { user, data } = payload;
    return this.rewardRequestService.createEventRewardRequest(user.id, data);
  }
}
