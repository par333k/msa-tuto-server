import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from 'src/common/constants/roles.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateRewardDto } from 'src/modules/reward/dto/create-reward.dto';
import { RewardService } from 'src/modules/reward/reward.service';

@ApiTags('rewards')
@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '리워드 생성',
    description: '운영자나 관리자 권한으로 새로운 리워드를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '리워드가 성공적으로 생성되었습니다.',
  })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  async createReward(@Body() createRewardDto: CreateRewardDto, @Request() req) {
    return this.rewardService.create(createRewardDto, req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: '모든 리워드 조회',
    description: '모든 리워드를 조회합니다. 필터를 적용할 수 있습니다.',
  })
  @ApiResponse({ status: 200, description: '리워드 목록을 반환합니다.' })
  async getAllRewards() {
    return this.rewardService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'ID로 리워드 조회',
    description: '특정 ID의 리워드를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '조회할 리워드의 ID' })
  @ApiResponse({ status: 200, description: '리워드 정보를 반환합니다.' })
  @ApiResponse({ status: 404, description: '리워드를 찾을 수 없습니다.' })
  async getRewardById(@Param('id') id: string) {
    return this.rewardService.findOne(id);
  }

  @Get('event/:eventId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '이벤트 ID로 리워드 조회',
    description: '특정 이벤트 ID에 연결된 모든 리워드를 조회합니다.',
  })
  @ApiParam({ name: 'eventId', description: '조회할 이벤트의 ID' })
  @ApiResponse({
    status: 200,
    description: '이벤트에 연결된 리워드 목록을 반환합니다.',
  })
  async getRewardsByEventId(@Param('eventId') eventId: string) {
    return this.rewardService.findByEventId(eventId);
  }
}
