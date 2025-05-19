import { Role } from 'src/common/enums/role.enum'
import { ProxyRouteConfig } from 'src/gateway/interfaces/proxy-route.interface'

export const gameEventRoutes: ProxyRouteConfig[] = [
  {
    path: 'event-requests/available-events',
    methods: [],
    targetUrl: process.env.GAME_EVENT_SERVICE_URL || 'http://game-event-service:5000',
    requireAuth: true,
    roles: [Role.USER],
  },
  {
    path: 'event-requests/rewards',
    targetUrl: process.env.GAME_EVENT_SERVICE_URL,
    methods: [],
    requireAuth: true,
    roles: [Role.USER],
    // 메시지 큐 설정
    useMessageQueue: true,
    rabbitmq: {
      pattern: { cmd: 'create_reward_request' },
      options: {
        persistent: true,
      }
    }
  },
  {
    path: 'event-requests/eligibility/:eventId',
    targetUrl: process.env.GAME_EVENT_SERVICE_URL || 'http://game-event-service:5000',
    methods: [],
    requireAuth: true,
    roles: [Role.USER],
  },
  {
    path: 'event-requests/reward-requests/history',
    targetUrl: process.env.GAME_EVENT_SERVICE_URL || 'http://game-event-service:5000',
    methods: [],
    requireAuth: true,
    roles: [Role.USER],
  },
  {
    path: 'event-requests/reward-requests/history/all',
    targetUrl: process.env.GAME_EVENT_SERVICE_URL || 'http://game-event-service:5000',
    methods: [],
    requireAuth: true,
    roles: [Role.OPERATOR, Role.AUDITOR, Role.ADMIN],
  },
  {
    path: 'events',
    targetUrl: process.env.GAME_EVENT_SERVICE_URL || 'http://game-event-service:5000',
    methods: ['POST', 'GET'],
    requireAuth: true,
    roles: [Role.OPERATOR, Role.ADMIN],
  },
  {
    path: 'events/:id',
    targetUrl: process.env.GAME_EVENT_SERVICE_URL || 'http://game-event-service:5000',
    methods: ['GET'],
    requireAuth: true,
  },
  {
    path: 'events/:id',
    targetUrl: process.env.GAME_EVENT_SERVICE_URL || 'http://game-event-service:5000',
    methods: ['PUT'],
    requireAuth: true,
    roles: [Role.OPERATOR, Role.ADMIN],
  },
  {
    path: 'events/active',
    targetUrl: process.env.GAME_EVENT_SERVICE_URL || 'http://game-event-service:5000',
    methods: ['GET'],
    requireAuth: true,
  }
];
