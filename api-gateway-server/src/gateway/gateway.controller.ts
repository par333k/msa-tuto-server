import { All, Controller, HttpException, HttpStatus, Inject, Logger, Next, Req, Res, UseGuards } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { RabbitmqService } from 'src/common/rabbitMq/rabbitmq.service'
import { ProxyRouteConfig } from 'src/gateway/interfaces/proxy-route.interface'
import { matchPath } from 'src/gateway/utils/path-matcher.util'
import { RolesService } from 'src/roles/roles.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GatewayService } from './gateway.service';
import { ProxyService } from './proxy.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class GatewayController {

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly gatewayService: GatewayService,
    private readonly proxyService: ProxyService,
    private readonly rolesService: RolesService,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  @All('*')
  async handleRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    // Skip if it's a health check route
    if (req.path.startsWith('/health')) {
      return next();
    }

    const path = req.path.substring(1); // Remove leading slash
    const method = req.method;

    // Find appropriate route configuration
    const routeResult = this.gatewayService.getRouteConfigForPath(path, method);

    if (!routeResult) {
      this.logger.warn(`No route configuration found for path: ${path}`);
      throw new HttpException('Route not found', HttpStatus.NOT_FOUND);
    }

    const { routeConfig, matchedPattern } = routeResult;

    const matchResult = matchPath(matchedPattern, path);
    if (matchResult) {
      req.params = { ...req.params, ...matchResult.params };
    }

    // Store matched route pattern for proxy service
    req['_matchedRoute'] = matchedPattern;

    // Handle authorization based on route config
    if (routeConfig.requireAuth && !req.user) {
      this.logger.warn(`Unauthorized access attempt to ${path}`);
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Handle role-based access
    if (routeConfig.roles && routeConfig.roles.length > 0) {
      const userRoles = (req.user as any)?.roles || [];
      const hasRole = routeConfig.roles.some(role => userRoles.includes(role));

      if (!hasRole) {
        this.logger.warn(`Insufficient permissions for ${req.user?.['userId']} to access ${path}`);
        throw new HttpException('Forbidden: Insufficient permissions', HttpStatus.FORBIDDEN);
      }
    }

    if (routeConfig.permissions && routeConfig.permissions.length > 0) {
      const userRoles = (req.user as any)?.roles || [];
      let userHasRequiredPermissions = false;

      if (userRoles.includes('admin')) {
        userHasRequiredPermissions = true;
      } else {
        for (const role of userRoles) {
          for (const permission of routeConfig.permissions) {
            if (this.rolesService.validateRolePermission(role, permission)) {
              userHasRequiredPermissions = true;
              break;
            }
          }
          if (userHasRequiredPermissions) break;
        }
      }

      if (!userHasRequiredPermissions) {
        this.logger.warn(`User ${req.user?.['userId']} lacks required permissions for ${path}`);
        throw new HttpException('Forbidden: Insufficient permissions', HttpStatus.FORBIDDEN);
      }
    }

    // 메시지 큐 사용 여부 확인
    if (routeConfig.useMessageQueue && routeConfig.rabbitmq) {
      return this.handleMessageQueueRequest(req, res, routeConfig);
    }

    // Proxy the request to the target service
    return await this.proxyService.proxyRequest(req, res, routeConfig.targetUrl);
  }

  private async handleMessageQueueRequest(
    req: Request,
    res: Response,
    routeConfig: ProxyRouteConfig
  ): Promise<void> {
    try {
      const method = req.method.toLowerCase();
      const correlationId = req.headers['x-correlation-id'];
      const { pattern, options } = routeConfig.rabbitmq;

      // 메시지 데이터 준비
      const messageData = {
        method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body,
        user: req.user, // 사용자 정보
        headers: this.extractRelevantHeaders(req),
        timestamp: new Date().toISOString(),
      };

      // RabbitMQ로 메시지 전송
      this.logger.debug(`Sending request to message queue: ${JSON.stringify(pattern)}`);
      this.rabbitmqService.emitEvent(pattern, messageData, options);

      // 클라이언트에게 바로 응답 (비동기 처리)
      res.status(HttpStatus.ACCEPTED).json({
        message: '요청이 접수되었습니다.',
        requestId: correlationId || 'unknown',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error(`RabbitMQ 메시지 발행 오류: ${error.message}`, error.stack);

      // 오류 응답
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '요청을 처리할 수 없습니다. 나중에 다시 시도해 주세요.',
        error: 'Message Queue Error'
      });
    }
  }

  /**
   * 프록시 요청에 필요한 헤더만 추출
   */
  private extractRelevantHeaders(req: Request): Record<string, string> {
    const headers = { ...req.headers } as Record<string, string>;

    // 불필요한 헤더 제외
    delete headers.host;
    delete headers.connection;
    delete headers['content-length'];

    return headers;
  }

}
