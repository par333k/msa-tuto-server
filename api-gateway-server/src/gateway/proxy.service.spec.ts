import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { ProxyService } from './proxy.service';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import got, { HTTPError, RequestError } from 'got';

// Got 모듈 모킹
jest.mock('got', () => {
  const mockFunction = jest.fn() as jest.Mock & { extend: jest.Mock };
  mockFunction.extend = jest.fn(() => mockFunction);
  return mockFunction;
});

describe('ProxyService', () => {
  let service: ProxyService;
  let mockGotInstance: jest.Mock;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'USE_HTTP2':
          return true;
        default:
          return null;
      }
    }),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };


  beforeEach(async () => {
    // 모킹 상태 초기화
    jest.clearAllMocks();

    // Got 인스턴스 모킹 설정
    mockGotInstance = got as unknown as jest.Mock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    (service as any).gotInstance = mockGotInstance;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('proxyRequest', () => {
    it('should proxy request and handle successful response', async () => {
      // Request와 Response 모킹
      const mockRequest = {
        method: 'GET',
        url: '/api/users/123',
        headers: { authorization: 'Bearer token123' },
        body: {},
        query: { include: 'details' },
        user: { userId: 'user1', roles: ['USER'] },
        ip: '127.0.0.1',
      } as unknown as Request;

      const mockResponse = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      // Got 응답 모킹
      const mockGotResponse = {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: Buffer.from(JSON.stringify({ id: 123, name: 'Test User' })),
        requestUrl: 'http://user-service:3002/users/123',
        method: 'GET',
      };

      mockGotInstance.mockImplementation(() => Promise.resolve(mockGotResponse));

      // 서비스 메서드 호출
      await service.proxyRequest(mockRequest, mockResponse, 'http://user-service:3002');

      // Got 호출 검증
      expect(mockGotInstance).toHaveBeenCalledWith('http://user-service:3002/users/123', expect.objectContaining({
        method: 'get',
        headers: expect.objectContaining({
          authorization: 'Bearer token123',
          'x-user-id': 'user1',
          'x-user-roles': JSON.stringify(['USER']),
          'x-forwarded-for': '127.0.0.1',
        }),
        searchParams: { include: 'details' },
      }));

      // 응답 처리 검증
      expect(mockResponse.setHeader).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ id: 123, name: 'Test User' });
    });

    it('should handle HTTP errors correctly', async () => {
      // Request와 Response 모킹
      const mockRequest = {
        method: 'GET',
        url: '/api/users/123',
        headers: {},
        body: {},
        query: {},
      } as unknown as Request;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // HTTPError 모킹
      const mockErrorResponse = {
        statusCode: 404,
        body: Buffer.from(JSON.stringify({ message: 'User not found', error: 'Not Found' })),
      };

      const error = {
        name: 'HTTPError',
        response: mockErrorResponse,
        message: 'Response code 404 (Not Found)',
      };

      mockGotInstance.mockImplementation(() => Promise.reject(error));

      // 서비스 메서드 호출
      await service.proxyRequest(mockRequest, mockResponse, 'http://user-service:3002');

      // 오류 처리 검증
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      }));
    });

    it('should handle network errors correctly', async () => {
      // Request와 Response 모킹
      const mockRequest = {
        method: 'GET',
        url: '/api/users/123',
        headers: {},
        body: {},
        query: {},
      } as unknown as Request;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // RequestError 모킹 (연결 거부)
      const error = {
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:3002',
      };

      mockGotInstance.mockImplementation(() => Promise.reject(error));

      // 서비스 메서드 호출
      await service.proxyRequest(mockRequest, mockResponse, 'http://user-service:3002');

      // 오류 처리 검증
      expect(mockResponse.status).toHaveBeenCalledWith(503); // SERVICE_UNAVAILABLE
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 503,
        message: 'Service is currently unavailable',
        error: 'Service Unavailable',
      }));
    });

    it('should handle timeout errors correctly', async () => {
      // Request와 Response 모킹
      const mockRequest = {
        method: 'GET',
        url: '/api/users/123',
        headers: {},
        body: {},
        query: {},
      } as unknown as Request;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // RequestError 모킹 (타임아웃)
      const error = {
        code: 'ETIMEDOUT',
        message: 'connect ETIMEDOUT 127.0.0.1:3002',
      };

      mockGotInstance.mockImplementation(() => Promise.reject(error));

      // 서비스 메서드 호출
      await service.proxyRequest(mockRequest, mockResponse, 'http://user-service:3002');

      // 오류 처리 검증
      expect(mockResponse.status).toHaveBeenCalledWith(504); // GATEWAY_TIMEOUT
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 504,
        message: 'Request timed out while connecting to the service',
        error: 'Gateway Timeout',
      }));
    });
  });
});
