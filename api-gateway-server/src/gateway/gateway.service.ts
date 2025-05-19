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

  getRouteConfigForPath(path: string, method: string): { routeConfig: ProxyRouteConfig, matchedPattern: string } | undefined {
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    const normalizedMethod = method.toUpperCase(); // HTTP 메서드 표준화

    // 메서드 매칭 확인 헬퍼 함수
    const isMethodMatch = (route: ProxyRouteConfig): boolean => {
      // 메서드가 지정되지 않았으면 모든 메서드 허용
      if (!route.methods || route.methods.length === 0) {
        return true;
      }

      // 메서드 배열에서 확인
      return route.methods
        .map(m => m.toUpperCase())
        .includes(normalizedMethod);
    };

    // 1. 정확한 경로 매칭 먼저 시도 (메서드도 고려)
    const exactMatches = this.routes.filter(r =>
      r.path === normalizedPath && isMethodMatch(r)
    );

    if (exactMatches.length > 0) {
      return { routeConfig: exactMatches[0], matchedPattern: exactMatches[0].path };
    }

    // 2. 패턴 매칭 시도 (경로 파라미터 포함한 경로)
    for (const route of this.routes) {
      if (!isMethodMatch(route)) continue; // 메서드가 일치하지 않으면 건너뜀

      const matchResult = matchPath(route.path, normalizedPath);
      if (matchResult) {
        return {
          routeConfig: route,
          matchedPattern: route.path
        };
      }
    }

    // 3. 접두사 기반 매칭 시도 (가장 구체적인 경로 우선)
    // 패턴을 경로 길이로 정렬하여 가장 구체적인 것이 먼저 매칭되도록 함
    const prefixRoutes = this.routes
      .filter(r => normalizedPath.startsWith(r.path) && isMethodMatch(r))
      .sort((a, b) => b.path.length - a.path.length); // 더 긴 경로가 앞으로 오도록 정렬

    if (prefixRoutes.length > 0) {
      return { routeConfig: prefixRoutes[0], matchedPattern: prefixRoutes[0].path };
    }

    // 4. 마지막 시도: 경로만 일치하고 메서드는 다른 경우 (405 응답을 위해)
    const pathMatches = this.routes.filter(r =>
      r.path === normalizedPath || matchPath(r.path, normalizedPath) !== null
    );

    if (pathMatches.length > 0) {
      // 해당 경로에 허용된 모든 메서드 수집
      const allowedMethods = pathMatches.flatMap(r => r.methods || []);

      // 이 경우 컨트롤러에서 405 응답으로 처리할 수 있도록 특별한 표시를 함
      return {
        routeConfig: {
          ...pathMatches[0],
          methodNotAllowed: true, // 메서드 불일치 표시
          allowedMethods: allowedMethods
        } as ProxyRouteConfig,
        matchedPattern: pathMatches[0].path
      };
    }

    return undefined;
  }
}
