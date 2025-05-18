import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    console.log('#######들어오니?##########')
    console.log('#######################')

    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
      () =>
        this.disk.checkStorage('disk', {
          thresholdPercent: 0.9, // 90%
          path: '/',
        }),

      // Microservices Health Checks
      () =>
        this.http.pingCheck('auth-service', this.configService.get<string>('AUTH_SERVICE_URL') + '/health'),
/*      () =>
        this.http.pingCheck('user-service', this.configService.get<string>('USER_SERVICE_URL') + '/health'),*/
    ]);
  }

  @Get('liveness')
  @Public()
  @HealthCheck()
  liveness() {
    return this.health.check([]);
  }

  @Get('readiness')
  @Public()
  @HealthCheck()
  readiness() {
    return this.health.check([
      // Basic microservices check
      () =>
        this.http.pingCheck('auth-service', this.configService.get<string>('AUTH_SERVICE_URL') + '/health/liveness'),
    ]);
  }
}
