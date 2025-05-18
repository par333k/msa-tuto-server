import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Event } from 'src/modules/event/schemas/event.schema';

export type RewardDocument = Reward & Document;

export enum RewardType {
  COUPON = 'COUPON',   // 쿠폰 타입
  ITEM = 'ITEM',       // 아이템 타입
}

@Schema({ timestamps: true })
export class Reward {
  @Prop({ required: true })
  name: string;  // 보상 이름

  @Prop()
  description: string;  // 보상 설명

  @Prop({ required: true, enum: RewardType })
  type: RewardType;  // 보상 타입

  @Prop({ required: true })
  quantity: number;  // 수량

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  eventId: MongooseSchema.Types.ObjectId;  // 연결된 이벤트 ID

  @Prop({ type: Object })
  metadata: Record<string, any>;  // 보상 메타데이터 (쿠폰 코드, 아이템 ID 등)

  @Prop({ required: true })
  createdBy: string;  // 생성자

  @Prop()
  updatedBy: string;  // 수정자
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
RewardSchema.index({ eventId: 1 });
RewardSchema.index({ type: 1 });
