import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/roles/enums/role.enum';
import { ROLES_KEY } from 'src/auth/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 역할 요구사항이 없으면 통과
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // 사용자 정보가 없으면 실패
    if (!user || !user.roles) {
      throw new ForbiddenException('권한이 없습니다');
    }

    // ADMIN 사용자는 모든 접근 허용
    if (user.roles.includes(Role.ADMIN)) {
      return true;
    }

    // 사용자가 필요한 역할 중 하나라도 가지고 있는지 확인
    const hasRole = requiredRoles.some(role => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('권한이 없습니다');
    }

    return true;
  }
}
