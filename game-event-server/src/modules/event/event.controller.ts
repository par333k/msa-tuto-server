import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ConflictException,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { EventService } from 'src/modules/event/event.service';
import { CreateEventDto } from 'src/modules/event/dto/create-event.dto';
import { UpdateEventDto } from 'src/modules/event/dto/update-event.dto';
import { PaginationDto } from './dto/pagination.dto';
import { EventFilterDto } from './dto/event-filter.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { UserRole } from 'src/common/constants/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('events')
@UseGuards(RolesGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async create(@Body() createEventDto: CreateEventDto, @User('id') userId: string) {
    return this.eventService.create(createEventDto, userId);
  }

  @Get()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async findAll(@Query() filterDto: EventFilterDto) {
    return this.eventService.findAll(filterDto);
  }

  @Get('active')
  async findActiveEvents(@Query() paginationDto: PaginationDto) {
    return this.eventService.findActiveEvents(
      paginationDto.page,
      paginationDto.limit
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted: boolean = false
  ) {
    return this.eventService.findOne(id, includeDeleted);
  }

  @Put(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @User('id') userId: string
  ) {
    try {
      return await this.eventService.update(id, updateEventDto, userId, updateEventDto.version);
    } catch (error) {
      if (error instanceof ConflictException) {
        const latestEvent = await this.eventService.findOne(id);
        throw new ConflictException({
          message: error.message,
          latestData: latestEvent
        });
      }
      throw error;
    }
  }
}
