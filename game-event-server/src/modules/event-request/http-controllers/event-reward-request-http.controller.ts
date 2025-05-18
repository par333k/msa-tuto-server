import { Controller, Get, Post, Body, UseGuards, Param, Query } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { UserRole } from 'src/common/constants/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RewardRequestService } from '../services/reward-request.service';
import { CreateRewardRequestDto } from '../dto/create-reward-request.dto';
import { RewardRequestFilterDto } from '../dto/reward-request-filter.dto';
import { EventService } from 'src/modules/event/event.service';
import { RequestEligibilityService } from '../services/request-eligibility.service';
import { EventEligibilityDto } from '../dto/event-eligibility.dto';
import { PaginationDto } from 'src/modules/event/dto/pagination.dto';

@Controller('event-reward-requests')
@UseGuards(RolesGuard)
export class EventRewardRequestHttpController {
  constructor(
    private readonly rewardRequestService: RewardRequestService,
    private readonly eventService: EventService,
    private readonly requestEligibilityService: RequestEligibilityService,
  ) {}

  /**
   * 현재 참여 가능한 이벤트 목록을 반환합니다.
   * 각 이벤트에 대한 참여 자격 정보를 포함합니다.
   */
  @Get('available-events')
  @Roles(UserRole.USER)
  async getAvailableEvents(
    @User('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<{
    events: EventEligibilityDto[],
    total: number,
    page: number,
    limit: number,
    pages: number,
  }> {
    // 활성 이벤트 목록 조회
    const activeEvents = await this.eventService.findActiveEvents(
      paginationDto.page,
      paginationDto.limit
    );

    // 각 이벤트에 대한 참여 자격 확인
    const eligibilityResults = await Promise.all(
      activeEvents.items.map(async (event) => {
        const eligibility = await this.requestEligibilityService.checkEligibility(userId, event);
        return new EventEligibilityDto(event, eligibility.eligible, eligibility.reason);
      })
    );

    return {
      events: eligibilityResults,
      total: activeEvents.total,
      page: activeEvents.page,
      limit: activeEvents.limit,
      pages: activeEvents.pages,
    };
  }

  /**
   * 특정 이벤트에 대한 참여 자격을 확인합니다.
   */
  @Get('eligibility/:eventId')
  @Roles(UserRole.USER)
  async checkEligibility(
    @User('id') userId: string,
    @Param('eventId') eventId: string,
  ): Promise<{ eligible: boolean, reason?: string }> {
    const event = await this.eventService.findOne(eventId);
    return this.requestEligibilityService.checkEligibility(userId, event);
  }

  /**
   * 사용자의 보상 요청 이력을 조회합니다.
   */
  @Get('reward-requests')
  @Roles(UserRole.USER)
  async getMyRequests(
    @User('id') userId: string,
    @Query() filterDto: Omit<RewardRequestFilterDto, 'userId'>,
  ) {
    return this.rewardRequestService.findByUserId(userId, filterDto);
  }

  /**
   * 모든 보상 요청 이력을 조회합니다. (관리자/감사자용)
   */
  @Get('all')
  @Roles(UserRole.OPERATOR, UserRole.AUDITOR, UserRole.ADMIN)
  async getAllRequests(@Query() filterDto: RewardRequestFilterDto) {
    return this.rewardRequestService.findAll(filterDto);
  }
}
