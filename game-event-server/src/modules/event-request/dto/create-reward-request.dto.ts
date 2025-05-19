import { IsDefined, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRewardRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  eventId: string;

  @IsNotEmpty()
  @IsDefined()
  headers: Record<string, string>;

  @IsOptional()
  metadata?: Record<string, any>;
}
