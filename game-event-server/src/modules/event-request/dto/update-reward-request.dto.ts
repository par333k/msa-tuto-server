import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { RequestStatus } from 'src/modules/event-request/schemas/reward-request.schema';

export class UpdateRewardRequestDto {
  @IsEnum(RequestStatus)
  @IsOptional()
  status?: RequestStatus;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  processedAt?: string;
}
