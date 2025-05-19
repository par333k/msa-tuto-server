import { Role } from 'src/common/enums/role.enum'
import { ProxyRouteConfig } from 'src/gateway/interfaces/proxy-route.interface'

export const userRoutes: ProxyRouteConfig[] = [
  {
    path: 'users',
    methods: ['GET'],
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
    requireAuth: true,
    roles: [Role.ADMIN, Role.AUDITOR],
  },
  {
    path: 'users/:id/roles',
    methods: ['POST'],
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
    requireAuth: true,
    roles: [Role.ADMIN],
  },
  {
    path: 'users/:id/roles/:role',
    methods: ['DELETE'],
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
    requireAuth: true,
    roles: [Role.ADMIN],
  },
];
