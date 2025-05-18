export interface ProxyRouteConfig {
  path: string;
  targetUrl: string;
  requireAuth: boolean;
  roles?: string[];
  methods?: string[];
  permissions?: string[];
  useMessageQueue?: boolean;
  // RabbitMQ 설정
  rabbitmq?: {
    pattern: string | object;
    options?: Record<string, any>;
  };
}
