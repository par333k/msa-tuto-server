import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRewardRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  eventId: string;
  
  @IsOptional()
  metadata?: Record<string, any>;
}
