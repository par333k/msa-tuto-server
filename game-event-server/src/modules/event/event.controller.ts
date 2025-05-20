import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from 'src/common/constants/roles.enum';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateEventDto } from 'src/modules/event/dto/create-event.dto';
import { UpdateEventDto } from 'src/modules/event/dto/update-event.dto';
import { EventService } from 'src/modules/event/event.service';
import { EventFilterDto } from './dto/event-filter.dto';
import { PaginationDto } from './dto/pagination.dto';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async create(
    @Body() createEventDto: CreateEventDto,
    @User() user: { userId: string; email: string; roles: UserRole[] },
  ) {
    return this.eventService.create(createEventDto, user.userId);
  }

  @Get()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async findAll(@Query() filterDto: EventFilterDto) {
    return this.eventService.findAll(filterDto);
  }

  // 클라이언트에서 사용자가 이벤트 보는 api 라고 가정
  @Public()
  @Get('active')
  async findActiveEvents(@Query() paginationDto: PaginationDto) {
    return this.eventService.findActiveEvents(
      paginationDto.page,
      paginationDto.limit,
    );
  }

  // 클라이언트에서 사용자가 이벤트 보는 api 라고 가정
  @Public()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted: boolean = false,
  ) {
    return this.eventService.findOne(id, includeDeleted);
  }

  @Put(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @User('id') userId: string,
  ) {
    try {
      return await this.eventService.update(
        id,
        updateEventDto,
        userId,
        updateEventDto.version,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        const latestEvent = await this.eventService.findOne(id);
        throw new ConflictException({
          message: error.message,
          latestData: latestEvent,
        });
      }
      throw error;
    }
  }
}
