import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston'
import { matchPath } from 'src/gateway/utils/path-matcher.util'
import { ProxyRouteConfig } from './interfaces/proxy-route.interface';
import { allRoutes } from './routes';

@Injectable()
export class GatewayService implements OnModuleInit {
  private routes: ProxyRouteConfig[] = [];

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    // 분리된 라우트 파일에서 라우트 로드
    this.setupRoutes();
    this.logger.log(`Initialized ${this.routes.length} proxy routes`);

    // 라우트 테이블 출력 (개발용)
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logRouteTable();
    }
  }

  private setupRoutes() {
    // 각 라우트 파일에서 정의된 모든 라우트 로드
    this.routes = allRoutes.map(route => ({
      ...route,
      // 환경변수로 설정된 서비스 URL이 있으면 해당 URL 사용
      targetUrl: this.resolveTargetUrl(route),
    }));

    this.routes.sort((a, b) => b.path.length - a.path.length);
  }

  private resolveTargetUrl(route: ProxyRouteConfig): string {
    // 경로에서 서비스 이름 추출 (첫 번째 경로 세그먼트)
    const serviceName = route.path.split('/')[0];

    // 환경변수에서 서비스 URL 가져오기 시도
    const envKey = `${serviceName.toUpperCase()}_SERVICE_URL`;
    const envUrl = this.configService.get<string>(envKey);

    return envUrl || route.targetUrl;
  }

  private logRouteTable() {
    this.logger.debug('API Gateway Route Table:');
    this.logger.debug('--------------------------------------------------');
    this.logger.debug('| Path                   | Auth | Roles          |');
    this.logger.debug('--------------------------------------------------');

    this.routes.forEach(route => {
      const roles = route.roles ? route.roles.join(', ') : 'N/A';
      this.logger.debug(
        `| ${route.path.padEnd(23)} | ${route.requireAuth ? 'Yes ' : 'No  '} | ${roles.padEnd(14)} |`,
      );
    });

    this.logger.debug('--------------------------------------------------');
  }

  getRoutes(): ProxyRouteConfig[] {
    return this.routes;
  }

  getRouteConfigForPath(path: string): { routeConfig: ProxyRouteConfig, matchedPattern: string } | undefined {
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;

    // 1. 정확한 경로 매칭 먼저 시도
    const exactMatch = this.routes.find(r => r.path === normalizedPath);
    if (exactMatch) {
      return { routeConfig: exactMatch, matchedPattern: exactMatch.path };
    }

    // 2. 패턴 매칭 시도 (경로 파라미터 포함한 경로)
    for (const route of this.routes) {
      const matchResult = matchPath(route.path, normalizedPath);
      if (matchResult) {
        return {
          routeConfig: route,
          matchedPattern: route.path
        };
      }
    }

    // 3. 접두사 기반 매칭 시도 (가장 구체적인 경로 우선)
    const prefixMatch = this.routes.find(r => normalizedPath.startsWith(r.path));
    if (prefixMatch) {
      return { routeConfig: prefixMatch, matchedPattern: prefixMatch.path };
    }

    return undefined;
  }

}
