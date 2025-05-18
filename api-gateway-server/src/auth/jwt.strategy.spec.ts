import { Test, TestingModule } from '@nestjs/testing';
import { AuthClientService } from 'src/auth/services/auth-client.service'
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express'; // Request 타입 임포트

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockConfigService: any;
  let mockAuthClientService: any;

  beforeEach(async () => {
    // Mock ConfigService
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') {
          return 'test-secret';
        }
        return null;
      }),
    };

    // Mock AuthClientService
    mockAuthClientService = {
      validateToken: jest.fn(),
      getUserRoles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuthClientService, // AuthClientService 주입
          useValue: mockAuthClientService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    let mockRequest: Partial<Request>;

    beforeEach(() => {
      // Mock Request 객체
      // ExtractJwt.fromAuthHeaderAsBearerToken()가 호출될 때 토큰을 반환하도록 설정
      mockRequest = {
        headers: {
          authorization: 'Bearer test-token',
        },
      } as Partial<Request>; // 실제 Request 객체의 일부만 모의

      // 기본적으로 validateToken은 유효한 것으로 설정
      mockAuthClientService.validateToken.mockResolvedValue({ valid: true });
    });

    it('should return user data from payload when token is valid and roles are in payload', async () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        roles: ['USER', 'ADMIN'],
      };

      const result = await strategy.validate(mockRequest as Request, payload);

      expect(mockAuthClientService.validateToken).toHaveBeenCalledWith('test-token');
      expect(result).toEqual({
        userId: 'user-123',
        username: 'testuser',
        roles: ['USER', 'ADMIN'],
      });
      expect(mockAuthClientService.getUserRoles).not.toHaveBeenCalled();
    });

    it('should fetch roles from AuthClientService if not in payload', async () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        // roles: undefined (payload에 roles 없음)
      };
      mockAuthClientService.getUserRoles.mockResolvedValue(['USER']); // AuthClientService가 역할을 반환하도록 모의

      const result = await strategy.validate(mockRequest as Request, payload);

      expect(mockAuthClientService.validateToken).toHaveBeenCalledWith('test-token');
      expect(mockAuthClientService.getUserRoles).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        userId: 'user-123',
        username: 'testuser',
        roles: ['USER'],
      });
    });

    it('should use default roles if AuthClientService fails to fetch roles', async () => {
        const payload = {
            sub: 'user-123',
            username: 'testuser',
        };
        mockAuthClientService.getUserRoles.mockRejectedValue(new Error('Failed to fetch roles'));

        const result = await strategy.validate(mockRequest as Request, payload);

        expect(mockAuthClientService.validateToken).toHaveBeenCalledWith('test-token');
        expect(mockAuthClientService.getUserRoles).toHaveBeenCalledWith('user-123');
        expect(result).toEqual({
            userId: 'user-123',
            username: 'testuser',
            roles: ['USER'], // 기본 역할
        });
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
      };
      const noTokenRequest = { headers: {} } as Partial<Request>;

      await expect(
        strategy.validate(noTokenRequest as Request, payload),
      ).rejects.toThrow(new UnauthorizedException('No token provided'));
    });

    it('should throw UnauthorizedException if token validation fails', async () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
      };
      mockAuthClientService.validateToken.mockResolvedValue({ valid: false }); // 토큰 유효성 검사 실패 모의

      await expect(
        strategy.validate(mockRequest as Request, payload),
      ).rejects.toThrow(new UnauthorizedException('Invalid token'));
    });

     it('should throw UnauthorizedException if validateToken call fails', async () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
      };
      mockAuthClientService.validateToken.mockRejectedValue(new Error('Auth service error'));

      await expect(
        strategy.validate(mockRequest as Request, payload),
      ).rejects.toThrow(new UnauthorizedException('Auth service error'));
    });
  });
});
