import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { GatewayService } from './gateway.service';
import { ConfigService } from '@nestjs/config';

describe('GatewayService', () => {
  let service: GatewayService;
  let configService: ConfigService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'NODE_ENV':
                  return 'test';
                case 'AUTH_SERVICE_URL':
                  return 'http://auth-service:3001';
                default:
                  return null;
              }
            }),
          },
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<GatewayService>(GatewayService);
    configService = module.get<ConfigService>(ConfigService);

    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRouteConfigForPath', () => {
    it('should find route config for exact path', () => {
      const routeConfig = service.getRouteConfigForPath('/auth/login');

      expect(routeConfig).toBeDefined();
      expect(routeConfig.path).toBe('auth/login');
      expect(routeConfig.requireAuth).toBe(false);
    });

    it('should find route config for path with prefix', () => {
      const routeConfig = service.getRouteConfigForPath('/event/info');

      expect(routeConfig).toBeDefined();
      expect(routeConfig.path).toBe('event/info');
      expect(routeConfig.requireAuth).toBe(true);
    });

    it('should return undefined for non-existent path', () => {
      const routeConfig = service.getRouteConfigForPath('/nonexistent/path');

      expect(routeConfig).toBeUndefined();
    });
  });
});
