import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

export enum EventType { // 실제로는 별도의 컬렉션이나 테이블을 통해 관리되어야 합니다
  LOGIN = 'LOGIN', // 로그인 이벤트
  FRIEND_INVITATION = 'FRIEND_INVITATION', // 친구 초대 이벤트
  LEVEL_UP = 'LEVEL_UP', // 레벨업 이벤트
  TIME_PERIOD = 'TIME_PERIOD', // 시간대 이벤트 (특정 시간에만 참여 가능)
  ACHIEVEMENT = 'ACHIEVEMENT', // 업적 달성 이벤트
  PURCHASE = 'PURCHASE', // 구매 이벤트
  DAILY_MISSION = 'DAILY_MISSION', // 일일 미션 이벤트
  ITEM_COLLECTION = 'ITEM_COLLECTION', // 아이템 수집 이벤트
}

export enum EventStatus {
  ACTIVE = 'ACTIVE', // 활성화 상태
  INACTIVE = 'INACTIVE', // 비활성화 상태
}

export class EventCondition {
  @Prop({ required: true })
  type: string; // 조건 타입 (연속 로그인, 친구 초대 수 등)

  @Prop({ required: true })
  value: number; // 조건 값 (예: 3일 연속 로그인, 5명 친구 초대, 성공여부 1, 0 등.. 실제로는 타입에 따라서 더 다양한 타입의 값이 필요할 수 있음)

  @Prop({ type: Object })
  additionalData?: Record<string, any>;
}

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  name: string; // 이벤트 이름

  @Prop({ required: true })
  description: string; // 이벤트 설명

  @Prop({ required: true, enum: EventType })
  type: EventType; // 이벤트 타입

  @Prop({ type: EventCondition, required: true })
  condition: EventCondition; // 이벤트 조건

  @Prop({ required: true })
  startDate: Date; // 시작일

  @Prop({ required: true })
  endDate: Date; // 종료일

  @Prop({ required: true, enum: EventStatus, default: EventStatus.INACTIVE })
  status: EventStatus; // 이벤트 상태

  @Prop({ required: true })
  createdBy: string; // 생성자

  @Prop()
  updatedBy: string; // 수정자

  @Prop({ default: 0 })
  version: number; // 낙관적 락을 위한 버전 필드

  @Prop({ type: Date, default: null })
  deletedAt: Date; // 소프트 삭제를 위한 삭제 시간 필드

  @Prop()
  deletedBy: string; // 삭제한 사용자
}

export const EventSchema = SchemaFactory.createForClass(Event);
// 인덱스 추가 - 이벤트 조회 성능 향상
EventSchema.index({ status: 1, startDate: 1, endDate: 1 });
EventSchema.index({ type: 1 });
EventSchema.index({ deletedAt: 1 }); // 소프트 삭제 쿼리용 인덱스
