import { Role } from 'src/common/enums/role.enum'
import { ProxyRouteConfig } from '../interfaces/proxy-route.interface';

// JSON 파일로 별도 관리하거나 DB 에서 관리하는게 실제 서비스에서는 더 적절할수도 있습니다. 혹은 공통 라이브러리 등으로..
export const authRoutes: ProxyRouteConfig[] = [
  {
    path: 'auth/register',
    methods: ['POST'],
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
    requireAuth: false,
  },
  {
    path: 'auth/login',
    methods: ['POST'],
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
    requireAuth: false,
  },
  {
    path: 'auth/refresh',
    methods: ['POST'],
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
    requireAuth: true,
  },
  {
    path: 'auth/logout',
    methods: ['POST'],
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
    requireAuth: true,
  },
];
