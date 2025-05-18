import { IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EventStatus, EventType } from '../schemas/event.schema';
import { PaginationDto } from './pagination.dto';

export class EventFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
  
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean = false;
}
