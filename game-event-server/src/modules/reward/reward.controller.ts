import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserRole } from 'src/common/constants/roles.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateRewardDto } from 'src/modules/reward/dto/create-reward.dto';
import { RewardService } from 'src/modules/reward/reward.service';

@Controller()
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @MessagePattern({ cmd: 'create_reward' })
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async create(@Payload() payload: { user: any, data: CreateRewardDto }) {
    const { user, data } = payload;
    return this.rewardService.create(data, user.id);
  }

  @MessagePattern({ cmd: 'find_all_rewards' })
  async findAll(@Payload() payload: { user: any, filter?: any }) {
    return this.rewardService.findAll(payload.filter);
  }

  @MessagePattern({ cmd: 'find_reward_by_id' })
  async findOne(@Payload() payload: { id: string }) {
    return this.rewardService.findOne(payload.id);
  }

  @MessagePattern({ cmd: 'find_rewards_by_event_id' })
  async findByEventId(@Payload() payload: { eventId: string }) {
    return this.rewardService.findByEventId(payload.eventId);
  }
}
