import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston'
import { RefreshTokenPayload } from 'src/auth/interface/jwt-payload.interface'
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class TokensService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: WinstonLogger,
    private cacheService: CacheService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  // 리프레시 토큰 저장
  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      // JWT 분석해서 만료 시간 구하기
      const payload = this.jwtService.decode(refreshToken) as RefreshTokenPayload;
      if (!payload || !payload.exp) {
        throw new Error('Invalid token payload');
      }

      // 토큰 만료까지의 초 계산
      const expiresIn = payload.exp - Math.floor(Date.now() / 1000);

      // Redis에 저장 - 사용자별 리프레시 토큰
      await this.cacheService.set(`refresh_token:${userId}`, refreshToken, expiresIn);
    } catch (error) {
      this.logger.error(`리프레시 토큰 저장 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 리프레시 토큰 검증
  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    try {
      // Redis에서 사용자의 리프레시 토큰 조회
      const storedToken = await this.cacheService.get<string>(`refresh_token:${userId}`);

      if (!storedToken) {
        return false;
      }

      // 제공된 토큰과 저장된 토큰 비교
      if (storedToken !== refreshToken) {
        return false;
      }

      // JWT 검증
      try {
        const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });

        // 토큰의 sub(subject)가 userId와 일치하는지 확인
        return payload.sub === userId;
      } catch (error) {
        this.logger.warn(`유효하지 않은 리프레시 토큰: ${error.message}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`리프레시 토큰 검증 오류: ${error.message}`, error.stack);
      return false;
    }
  }

  // 리프레시 토큰 제거 (로그아웃 시 사용)
  async removeRefreshToken(userId: string): Promise<void> {
    try {
      await this.cacheService.delete(`refresh_token:${userId}`);
    } catch (error) {
      this.logger.error(`리프레시 토큰 제거 오류: ${error.message}`, error.stack);
      throw error;
    }
  }
}
