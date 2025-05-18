import { IsString, IsNotEmpty, IsEnum, IsDateString, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType, EventStatus } from 'src/modules/event/schemas/event.schema';

export class EventConditionDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  value: number;

  @IsOptional()
  additionalData?: Record<string, any>;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(EventType)
  type: EventType;

  @ValidateNested()
  @Type(() => EventConditionDto)
  condition: EventConditionDto;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;
}
