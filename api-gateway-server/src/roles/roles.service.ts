import { Injectable } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum'

@Injectable()
export class RolesService {
  getRolePermissions(role: Role): string[] {
    switch (role) {
      case Role.ADMIN:
        return ['all'];
      case Role.OPERATOR:
        return ['create_event', 'create_reward', 'read_reward'];
      case Role.AUDITOR:
        return ['read_reward'];
      case Role.USER:
        return ['request_reward'];
      default:
        return [];
    }
  }

  validateRolePermission(role: Role, permission: string): boolean {
    const permissions = this.getRolePermissions(role);
    return permissions.includes(permission) || permissions.includes('all');
  }
}
