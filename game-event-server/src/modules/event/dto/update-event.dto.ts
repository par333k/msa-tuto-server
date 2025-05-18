import { IsString, IsEnum, IsDateString, ValidateNested, IsOptional, IsNumber, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType, EventStatus } from 'src/modules/event/schemas/event.schema';
import { EventConditionDto } from 'src/modules/event/dto/create-event.dto';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ValidateNested()
  @Type(() => EventConditionDto)
  @IsOptional()
  condition?: EventConditionDto;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsNumber()
  @IsDefined()
  version: number;
}
