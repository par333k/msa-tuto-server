import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reward, RewardDocument } from 'src/modules/reward/schemas/reward.schema';
import { CreateRewardDto } from 'src/modules/reward/dto/create-reward.dto';
import { UpdateRewardDto } from 'src/modules/reward/dto/update-reward.dto';
import { EventService } from 'src/modules/event/event.service';

@Injectable()
export class RewardService {
  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    private readonly eventService: EventService,
  ) {}

  async create(createRewardDto: CreateRewardDto, createdBy: string): Promise<Reward> {
    // 이벤트 존재 여부 확인
    try {
      await this.eventService.findOne(createRewardDto.eventId);
    } catch (error) {
      throw new BadRequestException(`유효하지 않은 이벤트 ID: ${createRewardDto.eventId}`);
    }

    const createdReward = new this.rewardModel({
      ...createRewardDto,
      eventId: new Types.ObjectId(createRewardDto.eventId),
      createdBy,
    });

    return createdReward.save();
  }

  async findAll(filter?: any): Promise<Reward[]> {
    const query = this.rewardModel.find();

    if (filter) {
      if (filter.eventId) {
        query.where('eventId').equals(new Types.ObjectId(filter.eventId));
      }

      if (filter.type) {
        query.where('type').equals(filter.type);
      }
    }

    return query.sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Reward> {
    const reward = await this.rewardModel.findById(id).exec();

    if (!reward) {
      throw new NotFoundException(`보상 ID ${id}를 찾을 수 없습니다.`);
    }

    return reward;
  }

  async findByEventId(eventId: string): Promise<Reward[]> {
    return this.rewardModel.find({ eventId: new Types.ObjectId(eventId) }).exec();
  }
}
