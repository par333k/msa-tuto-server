import { IsDefined, IsMongoId, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

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
