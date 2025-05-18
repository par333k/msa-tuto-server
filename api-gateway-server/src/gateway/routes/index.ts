import { gameEventRoutes } from 'src/gateway/routes/game-event.routes'
import { userRoutes } from 'src/gateway/routes/user.routes'
import { ProxyRouteConfig } from '../interfaces/proxy-route.interface';
import { authRoutes } from './auth.routes';

// 모든 라우트를 하나의 배열로 통합
export const allRoutes: ProxyRouteConfig[] = [
  ...authRoutes,
  ...gameEventRoutes,
  ...userRoutes,
];

// 경로별로 라우트를 가져오는 함수
export function getRoutesByBasePath(basePath: string): ProxyRouteConfig[] {
  switch (basePath) {
    case 'auth':
      return [...authRoutes, ...userRoutes];
    case 'events':
      return gameEventRoutes;
    default:
      return [];
  }
}
