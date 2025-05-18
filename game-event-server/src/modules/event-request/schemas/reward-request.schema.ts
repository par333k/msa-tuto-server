import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Event } from 'src/modules/event/schemas/event.schema';

export type RewardRequestDocument = RewardRequest & Document;

export enum RequestStatus {
  PENDING = 'PENDING',     // 대기 상태
  APPROVED = 'APPROVED',   // 승인됨
  REJECTED = 'REJECTED',   // 거부됨
  FAILED = 'FAILED',       // 실패 (조건 불충족)
}

@Schema({ timestamps: true })
export class RewardRequest {
  @Prop({ required: true })
  userId: string;  // 요청한 사용자 ID

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  eventId: MongooseSchema.Types.ObjectId;  // 요청한 이벤트 ID

  @Prop({ required: true, enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;  // 요청 상태

  @Prop()
  reason: string;  // 실패 또는 거부 이유

  @Prop({ type: Object })
  metadata: Record<string, any>;  // 요청 관련 메타데이터 (조건 충족 데이터 등)

  @Prop()
  processedAt: Date;  // 처리 시간

  @Prop()
  processedBy: string;  // 처리자 (관리자/시스템)
}

export const RewardRequestSchema = SchemaFactory.createForClass(RewardRequest);
// 인덱스 추가 - 사용자별/이벤트별 조회 성능 향상
RewardRequestSchema.index({ userId: 1 });
RewardRequestSchema.index({ eventId: 1 });
RewardRequestSchema.index({ status: 1 });
RewardRequestSchema.index({ userId: 1, eventId: 1 }, { unique: true });  // 중복 요청 방지
