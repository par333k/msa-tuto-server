import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston'
import { CacheService } from 'src/cache/cache.service';
import { Role } from 'src/roles/enums/role.enum';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger,
    private cacheService: CacheService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    try {
      // 이메일 중복 체크
      const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();
      if (existingUser) {
        throw new ConflictException('이미 존재하는 이메일입니다');
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

      // 새 사용자 생성
      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
        roles: createUserDto.roles || [Role.USER],
      });

      return await newUser.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`사용자 생성 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException('사용자 생성 중 오류가 발생했습니다');
    }
  }

  async findAll(): Promise<UserDocument[]> {
    try {
      return await this.userModel.find().exec();
    } catch (error) {
      this.logger.error(`모든 사용자 조회 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException('사용자 조회 중 오류가 발생했습니다');
    }
  }

  async findById(id: string): Promise<UserDocument> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`ID ${id}를 가진 사용자를 찾을 수 없습니다`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`ID로 사용자 조회 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException('사용자 조회 중 오류가 발생했습니다');
    }
  }

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // 마지막 로그인 시간 업데이트
      user.lastLogin = new Date();
      await user.save();

      return user;
    } catch (error) {
      this.logger.error(`사용자 검증 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException('사용자 검증 중 오류가 발생했습니다');
    }
  }

  async addRole(userId: string, role: Role): Promise<UserDocument> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`ID ${userId}를 가진 사용자를 찾을 수 없습니다`);
      }

      // 역할이 이미 있는지 확인
      if (!user.roles.includes(role)) {
        user.roles.push(role);
        await user.save();
      }

      // 캐시 삭제
      await this.cacheService.delete(`user:id:${userId}`);
      await this.cacheService.delete(`user:${user.email}`);

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`사용자 역할 추가 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException('사용자에 역할 추가 중 오류가 발생했습니다');
    }
  }

  async removeRole(userId: string, role: Role): Promise<UserDocument> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`ID ${userId}를 가진 사용자를 찾을 수 없습니다`);
      }

      // 마지막 역할은 제거 불가
      if (user.roles.length === 1) {
        throw new ConflictException('사용자의 마지막 역할은 제거할 수 없습니다');
      }

      // 역할 제거
      user.roles = user.roles.filter(r => r !== role);
      await user.save();

      // 캐시 삭제
      await this.cacheService.delete(`user:id:${userId}`);
      await this.cacheService.delete(`user:${user.email}`);

      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`사용자 역할 제거 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException('사용자에서 역할 제거 중 오류가 발생했습니다');
    }
  }
}
