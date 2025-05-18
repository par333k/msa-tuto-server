import { IsOptional, IsString, IsEnum, IsDateString, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';
import { RequestStatus } from '../schemas/reward-request.schema';

export class RewardRequestFilterDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * 페이지네이션을 위한 옵션 속성들
   */
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
