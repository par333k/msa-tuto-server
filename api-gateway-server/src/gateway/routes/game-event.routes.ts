import { Role } from 'src/common/enums/role.enum'
import { ProxyRouteConfig } from 'src/gateway/interfaces/proxy-route.interface'

export const gameEventRoutes: ProxyRouteConfig[] = [
  {
    path: 'event/info',
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://game-event-service:5000',
    requireAuth: true,
    roles: [Role.USER],
  },
  {
    path: 'events/rewards/claim',
    targetUrl: 'http://event-service:3000',
    requireAuth: true,
    roles: ['user', 'admin'],
    // 메시지 큐 설정
    useMessageQueue: true,
    rabbitmq: {
      pattern: { cmd: 'create_reward_request' },
      options: {
        // 추가 옵션 설정
        persistent: true,
      }
    }
  },
];
