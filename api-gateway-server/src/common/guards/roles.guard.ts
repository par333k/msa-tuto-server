import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'src/common/decorators/permissions.decorator'
import { Role } from 'src/common/enums/role.enum'
import { RolesService } from 'src/roles/roles.service'
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService
  ) {}


  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);


    if ((!requiredRoles || requiredRoles.length === 0) &&
      (!requiredPermissions || requiredPermissions.length === 0)) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException('User has no roles');
    }

    // ADMIN 사용자는 모든 접근 허용
    if (user.roles.includes(Role.ADMIN)) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `User does not have sufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    // 역할 검증
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some(role => user.roles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException('필요한 역할이 없습니다');
      }
    }

    // 권한 검증
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = this.getUserPermissions(user.roles);
      const hasPermission = requiredPermissions.some(permission =>
        userPermissions.includes(permission) || userPermissions.includes('all')
      );

      if (!hasPermission) {
        throw new ForbiddenException('필요한 권한이 없습니다');
      }
    }


    return true;
  }

  private getUserPermissions(userRoles: Role[]): string[] {
    let permissions: string[] = [];

    for (const role of userRoles) {
      permissions = [...permissions, ...this.rolesService.getRolePermissions(role)];
    }

    return [...new Set(permissions)]; // 중복 제거
  }

}
