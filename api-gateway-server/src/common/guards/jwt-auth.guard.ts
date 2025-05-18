import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 인증 없이 접근 가능한 경로 패턴 목록
  private readonly publicPaths = [
    // 인증 관련 엔드포인트
    '/auth/login',
    '/auth/register',
    '/auth/refresh-token',

    // 건강 체크 엔드포인트
    '/health',
    '/health/liveness',
    '/health/readiness',

    // 문서 및 정적 파일 (필요한 경우)
    '/api-docs',
  ];

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const path = request.path;

    if (this.publicPaths.includes(path)) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err) {
      throw err;
    }

    if (!user) {
      if (info && info.message) {
        throw new UnauthorizedException(`Authentication failed: ${info.message}`);
      }
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
