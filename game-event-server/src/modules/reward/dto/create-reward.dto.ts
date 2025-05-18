import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsMongoId, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RewardType } from 'src/modules/reward/schemas/reward.schema';

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RewardType)
  type: RewardType;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsMongoId()
  eventId: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
