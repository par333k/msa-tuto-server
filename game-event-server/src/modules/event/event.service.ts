import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument, EventStatus } from 'src/modules/event/schemas/event.schema';
import { CreateEventDto } from 'src/modules/event/dto/create-event.dto';
import { UpdateEventDto } from 'src/modules/event/dto/update-event.dto';
import { PaginatedResponseDto } from './dto/pagination.dto';
import { EventFilterDto } from './dto/event-filter.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async create(createEventDto: CreateEventDto, createdBy: string): Promise<Event> {
    // 날짜 검증
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('종료일은 시작일보다 이후여야 합니다.');
    }

    const createdEvent = new this.eventModel({
      ...createEventDto,
      startDate,
      endDate,
      createdBy,
      status: createEventDto.status || EventStatus.INACTIVE,
      version: 0, // 초기 버전
      deletedAt: null, // 소프트 삭제 초기값
    });

    return createdEvent.save();
  }

  async findAll(filterDto: EventFilterDto): Promise<PaginatedResponseDto<Event>> {
    const { page = 1, limit = 10, status, type, startDate, endDate, includeDeleted = false } = filterDto;
    const skip = (page - 1) * limit;

    // 필터 적용
    const filter: any = {};

    // 소프트 삭제 필터 적용
    if (!includeDeleted) {
      filter.deletedAt = null; // 삭제되지 않은 항목만 조회
    }

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    if (startDate) {
      filter.startDate = { $gte: new Date(startDate) };
    }

    if (endDate) {
      filter.endDate = { $lte: new Date(endDate) };
    }

    const [events, total] = await Promise.all([
      this.eventModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.eventModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto<Event>(events, total, page, limit);
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<EventDocument> {
    const filter: any = { _id: id };

    if (!includeDeleted) {
      filter.deletedAt = null;
    }

    const event = await this.eventModel.findOne(filter).exec();

    if (!event) {
      throw new NotFoundException(`이벤트 ID ${id}를 찾을 수 없습니다.`);
    }

    return event;
  }

  async findActiveEvents(page = 1, limit = 10): Promise<PaginatedResponseDto<EventDocument>> {
    const skip = (page - 1) * limit;
    const now = new Date();

    const filter = {
      status: EventStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gt: now },
      deletedAt: null, // 삭제되지 않은 항목만 조회
    };

    const [events, total] = await Promise.all([
      this.eventModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.eventModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto<EventDocument>(events, total, page, limit);
  }

  async update(id: string, updateEventDto: UpdateEventDto, updatedBy: string, version: number): Promise<EventDocument> {
    // 이벤트 존재 여부 확인 (삭제된 항목 제외)
    const event = await this.findOne(id, false);

    // 날짜 검증
    let startDate = event.startDate;
    let endDate = event.endDate;

    if (updateEventDto.startDate) {
      startDate = new Date(updateEventDto.startDate);
    }

    if (updateEventDto.endDate) {
      endDate = new Date(updateEventDto.endDate);
    }

    if (startDate >= endDate) {
      throw new BadRequestException('종료일은 시작일보다 이후여야 합니다.');
    }

    // 낙관적 락 적용 - 현재 버전이 요청된 버전과 일치해야 업데이트 가능
    if (event.version !== version) {
      throw new ConflictException('이벤트가 다른 사용자에 의해 수정되었습니다. 최신 데이터를 조회한 후 다시 시도하세요.');
    }

    const updatedEvent = await this.eventModel.findOneAndUpdate(
      { _id: id, version: version, deletedAt: null }, // 삭제된 항목은 수정 불가
      {
        ...updateEventDto,
        startDate,
        endDate,
        updatedBy,
        $inc: { version: 1 }, // 버전 증가
      },
      { new: true },
    ).exec();

    if (!updatedEvent) {
      throw new ConflictException('이벤트가 다른 사용자에 의해 수정되었거나 삭제되었습니다. 최신 데이터를 조회한 후 다시 시도하세요.');
    }

    return updatedEvent;
  }

  async remove(id: string, deletedBy: string): Promise<any> {
    // 소프트 삭제 구현
    const result = await this.eventModel.findOneAndUpdate(
      { _id: id, deletedAt: null }, // 이미 삭제된 항목은 다시 삭제 불가
      {
        deletedAt: new Date(),
        deletedBy,
        $inc: { version: 1 }, // 버전 증가
      },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException(`이벤트 ID ${id}를 찾을 수 없거나 이미 삭제되었습니다.`);
    }

    return { id, deleted: true };
  }

  // 영구 삭제 메서드 (필요 시 사용)
  async permanentlyRemove(id: string): Promise<any> {
    const result = await this.eventModel.deleteOne({ _id: id }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`이벤트 ID ${id}를 찾을 수 없습니다.`);
    }

    return { id, deleted: true };
  }

  // 삭제 복구 메서드
  async restore(id: string, restoredBy: string): Promise<Event> {
    const restoredEvent = await this.eventModel.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } }, // 삭제된 항목만 복구 가능
      {
        deletedAt: null,
        deletedBy: null,
        updatedBy: restoredBy,
        $inc: { version: 1 }, // 버전 증가
      },
      { new: true }
    ).exec();

    if (!restoredEvent) {
      throw new NotFoundException(`이벤트 ID ${id}를 찾을 수 없거나 이미 삭제되지 않은 상태입니다.`);
    }

    return restoredEvent;
  }
}
