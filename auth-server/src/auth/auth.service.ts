import { Injectable, UnauthorizedException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenPayload } from 'src/auth/interface/jwt-payload.interface'
import { UsersService } from 'src/users/users.service';
import { TokensService } from 'src/tokens/tokens.service';
import { CacheService } from 'src/cache/cache.service';
import { LoginDto } from 'src/auth/dto/login.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { Role } from 'src/roles/enums/role.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokensService: TokensService,
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {}

  async login(loginDto: LoginDto) {
    try {
      const user = await this.usersService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      if (!user) {
        throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('이 계정은 비활성화되었습니다');
      }

      // 토큰 생성
      const tokens = await this.generateTokens(user._id.toString(), user.email, user.roles);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`로그인 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException('로그인 처리 중 오류가 발생했습니다');
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const newUser = await this.usersService.create({
        ...registerDto,
        roles: [Role.USER],
      });

      // 토큰 생성
      const tokens = await this.generateTokens(
        newUser._id.toString(),
        newUser.email,
        newUser.roles,
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          roles: newUser.roles,
        },
      };
    } catch (error) {
      this.logger.error(`회원가입 오류: ${error.message}`, error.stack);
      if (error.status === 409) {
        throw error;
      }
      throw new InternalServerErrorException('회원가입 처리 중 오류가 발생했습니다');
    }
  }

  async refreshToken(userId: string, refreshToken: string) {
    try {
      // 리프레시 토큰 유효성 검증
      const isValid = await this.tokensService.validateRefreshToken(userId, refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
      }

      // 사용자 정보 가져오기
      const user = await this.usersService.findById(userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('유효하지 않은 사용자입니다');
      }

      // 새 토큰 생성
      const tokens = await this.generateTokens(userId, user.email, user.roles);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`토큰 갱신 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException('토큰 갱신 중 오류가 발생했습니다');
    }
  }

  async logout(userId: string, accessToken: string) {
    try {
      // 액세스 토큰 블랙리스트에 추가
      const jwtPayload = this.jwtService.decode(accessToken) as any;
      if (jwtPayload) {
        const expiry = jwtPayload.exp * 1000 - Date.now(); // 남은 시간(밀리초)
        if (expiry > 0) {
          // 토큰이 아직 유효한 경우만 블랙리스트에 추가
          await this.cacheService.set(
            `blacklist:${accessToken}`,
            { userId },
            Math.ceil(expiry / 1000),
          );
        }
      }

      // 사용자의 리프레시 토큰 제거
      await this.tokensService.removeRefreshToken(userId);

      return { message: '로그아웃 성공' };
    } catch (error) {
      this.logger.error(`로그아웃 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException('로그아웃 처리 중 오류가 발생했습니다');
    }
  }

  async validateJwtToken(token: string) {
    try {
      // 토큰이 블랙리스트에 있는지 확인
      const isBlacklisted = await this.cacheService.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return null;
      }

      // 토큰 검증
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      return {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };
    } catch (error) {
      return null;
    }
  }

  private async generateTokens(userId: string, email: string, roles: Role[]) {
    try {
      const tokenId = uuidv4(); // 고유 토큰 ID

      // JWT 페이로드 생성
      const payload = {
        sub: userId,
        email,
        roles,
        jti: tokenId,
      };

      // 액세스 토큰 생성
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1h'),
      });

      // 리프레시 토큰 생성
      const refreshTokenPayload: RefreshTokenPayload = {
        sub: userId,
        jti: uuidv4()
      };

      const refreshToken = this.jwtService.sign(
        refreshTokenPayload,
        {
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
        },
      );

      // 리프레시 토큰 저장
      await this.tokensService.saveRefreshToken(userId, refreshToken);

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(`토큰 생성 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException('토큰 생성 중 오류가 발생했습니다');
    }
  }
}
