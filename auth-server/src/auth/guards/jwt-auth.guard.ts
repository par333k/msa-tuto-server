import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly publicPaths = [
    '/auth/login',
    '/auth/register',
    '/health',
    '/api-docs',
  ];

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest();
    const path = request.path;

    if (this.publicPaths.includes(path)) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
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
