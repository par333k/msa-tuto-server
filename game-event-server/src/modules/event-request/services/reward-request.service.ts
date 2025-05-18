import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RewardRequest, RewardRequestDocument, RequestStatus } from 'src/modules/event-request/schemas/reward-request.schema';
import { CreateRewardRequestDto } from 'src/modules/event-request/dto/create-reward-request.dto';
import { UpdateRewardRequestDto } from 'src/modules/event-request/dto/update-reward-request.dto';
import { RewardRequestFilterDto } from 'src/modules/event-request/dto/reward-request-filter.dto';
import { PaginatedRewardRequestsDto } from 'src/modules/event-request/dto/paginated-reward-requests.dto';
import { EventService } from 'src/modules/event/event.service';
import { RewardService } from 'src/modules/reward/reward.service';
import { ConditionValidatorService } from 'src/modules/event-request/services/condition-validator.service';
import { EventStatus } from 'src/modules/event/schemas/event.schema';

@Injectable()
export class RewardRequestService {
  constructor(
    @InjectModel(RewardRequest.name) private rewardRequestModel: Model<RewardRequestDocument>,
    private readonly eventService: EventService,
    private readonly conditionValidatorService: ConditionValidatorService,
  ) {}

  async createEventRewardRequest(userId: string, createRewardRequestDto: CreateRewardRequestDto): Promise<RewardRequest> {
    const { eventId, metadata } = createRewardRequestDto;

    // 이벤트 존재 여부 및 활성 상태 확인
    const event = await this.eventService.findOne(eventId);

    // 이벤트 활성 상태 확인
    if (event.status !== EventStatus.ACTIVE) {
      throw new BadRequestException('비활성화된 이벤트입니다.');
    }

    // 이벤트 기간 확인
    const now = new Date();
    if (now < event.startDate || now > event.endDate) {
      throw new BadRequestException('이벤트 기간이 아닙니다.');
    }


    try {
      // 중복 요청 확인
      /*
       * 보상 지급 프로세스를 별도의 마이크로서비스에서 처리한다고 가정합니다.
       * 이 경우, 보상 지급 과정에서 어떤 이유에 의해 장애가 발생하면 요청의 상태 역시 하나의 트랜잭션으로 관리되거나 재시도가 가능해야합니다.
       * 그럴 때는 구현에 따라서 중복 이벤트 요청을 막는 방식을 바꿔야 합니다
       */
      const existingRequest = await this.findExistingRequest(userId, eventId);

      if (existingRequest) {
        throw new BadRequestException('이미 해당 이벤트에 대한 보상 요청이 존재합니다.');
      }

      // 조건 충족 여부 검증
      const isConditionMet = await this.conditionValidatorService.validateCondition(
        userId,
        event.type,
        event.condition,
      );

      // 요청 상태 결정
      const status = isConditionMet ? RequestStatus.APPROVED : RequestStatus.FAILED;
      const reason = isConditionMet ? null : '이벤트 조건을 충족하지 못했습니다.';

      // 보상 요청 생성
      const createdRequest = new this.rewardRequestModel({
        userId,
        eventId: new Types.ObjectId(eventId),
        status,
        reason,
        metadata: metadata || {},
        processedAt: new Date(),
        processedBy: 'system',
      });

      // 저장
      const savedRequest = await createdRequest.save();
      // MQ를 이용해 reward 지급 서버에 요청을 보냅니다
      // 트랜잭션을 활용해 이벤트 발송과 요청이 하나로 처리되어야 합니다.
      // 실제 서비스에서는 아웃박스 패턴을 적용하거나 이벤트 스트리밍 시스템이 필요할 수 있습니다.
      // this.rabbitmqService.emitEvent({ queueName, eventRequest })
      return savedRequest;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('보상 요청 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 보상 요청 목록을 필터링하여 조회합니다.
   * @param filter 필터링 및 페이지네이션 옵션
   * @returns 페이지네이션이 적용된 보상 요청 목록
   */
  async findAll(filter?: RewardRequestFilterDto): Promise<PaginatedRewardRequestsDto> {
    // 필터 객체 직접 구성
    const queryFilter: Record<string, any> = {};

    if (filter) {
      if (filter.userId) {
        queryFilter.userId = filter.userId;
      }

      if (filter.eventId) {
        queryFilter.eventId = new Types.ObjectId(filter.eventId);
      }

      if (filter.status) {
        queryFilter.status = filter.status;
      }

      if (filter.startDate) {
        queryFilter.createdAt = queryFilter.createdAt || {};
        queryFilter.createdAt.$gte = new Date(filter.startDate);
      }

      if (filter.endDate) {
        queryFilter.createdAt = queryFilter.createdAt || {};
        queryFilter.createdAt.$lte = new Date(filter.endDate);
      }
    }

    // 페이지네이션 매개변수
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    const skip = (page - 1) * limit;

    // 정렬 옵션
    const sortOption: Record<string, 1 | -1> = {};
    sortOption[filter?.sortBy || 'createdAt'] = filter?.sortOrder === 'asc' ? 1 : -1;

    // 쿼리 실행 및 총 문서 수 계산을 병렬로 수행
    const [items, total] = await Promise.all([
      this.rewardRequestModel
        .find(queryFilter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.rewardRequestModel.countDocuments(queryFilter).exec(),
    ]);

    return new PaginatedRewardRequestsDto(items, total, page, limit);
  }

  /**
   * 특정 사용자의 보상 요청 이력을 조회합니다.
   * @param userId 사용자 ID
   * @param filter 필터링 및 페이지네이션 옵션
   * @returns 페이지네이션이 적용된 보상 요청 목록
   */
  async findByUserId(userId: string, filter?: Omit<RewardRequestFilterDto, 'userId'>): Promise<PaginatedRewardRequestsDto> {
    const newFilter: RewardRequestFilterDto = {
      ...(filter || {}),
      userId
    };

    return this.findAll(newFilter);
  }

  /**
   * 사용자가 특정 이벤트에 대해 이미 요청한 내역이 있는지 확인합니다.
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @returns 이미 존재하는 요청 또는 null
   */
  async findExistingRequest(userId: string, eventId: string): Promise<RewardRequest | null> {
    return this.rewardRequestModel.findOne({
      userId,
      eventId: new Types.ObjectId(eventId),
    }).exec();
  }
}
