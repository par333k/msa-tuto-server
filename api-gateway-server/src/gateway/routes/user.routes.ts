import { Role } from 'src/common/enums/role.enum'
import { ProxyRouteConfig } from 'src/gateway/interfaces/proxy-route.interface'

export const userRoutes: ProxyRouteConfig[] = [
  {
    path: 'auth/users',
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
    requireAuth: true,
    roles: [Role.ADMIN, Role.AUDITOR],
  },
  {
    path: 'auth/users/:id/roles',
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
    requireAuth: true,
    roles: [Role.ADMIN],
  },
  {
    path: 'auth/users/:id/roles/:role',
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
    requireAuth: true,
    roles: [Role.ADMIN],
  },
];
