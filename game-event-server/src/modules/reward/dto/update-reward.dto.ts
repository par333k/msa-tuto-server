import { IsString, IsEnum, IsNumber, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RewardType } from 'src/modules/reward/schemas/reward.schema';

export class UpdateRewardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RewardType)
  @IsOptional()
  type?: RewardType;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
