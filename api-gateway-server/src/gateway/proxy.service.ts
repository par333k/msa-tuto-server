import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import axios from 'axios'
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston'

@Injectable()
export class ProxyService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger,
  ) {
  }

  async proxyRequest(req: Request, res: Response, targetUrl: string): Promise<void> {
    const method = req.method.toLowerCase();
    const url = this.createTargetUrl(targetUrl, req);

    this.logger.debug(`Proxying ${method.toUpperCase()} request to ${url}`);

    try {
      const response = await axios({
        method: method,
        url: url,
        headers: this.createHeadersForTargetRequest(req),
        data: Object.keys(req.body || {}).length > 0 ? req.body : undefined,
        params: req.query,
        timeout: 5000,
        validateStatus: () => true,  // 모든 상태 코드를 허용
      });

      // 응답 헤더 설정
      Object.entries(response.headers).forEach(([header, value]) => {
        if (!['connection', 'content-length'].includes(header.toLowerCase())) {
          res.setHeader(header, value);
        }
      });

      // 응답 상태 코드 설정
      res.status(response.status);

      // 응답 데이터 전송
      if (typeof response.data === 'object') {
        res.json(response.data);
      } else {
        res.send(response.data);
      }
    } catch (error) {
      this.handleProxyError(error, req, res);
    }
  }

  private createTargetUrl(targetBaseUrl: string, req: Request): string {
    const originalUrl = req.url;
    const matchedRoute = req['_matchedRoute'] as string;

    let targetPath = '';

    if (matchedRoute) {
      // 서비스 이름을 추출 (첫 번째 경로 세그먼트)
      const serviceName = matchedRoute.split('/')[0];

      // 원본 URL에서 서비스 이름을 제외한 나머지 부분을 대상 경로로 사용
      const pathSegments = originalUrl.split('/').filter(Boolean);
      const serviceNameIndex = pathSegments.findIndex(segment => segment === serviceName);

      if (serviceNameIndex !== -1) {
        targetPath = pathSegments.slice(serviceNameIndex + 1).join('/');
      } else {
        // 서비스 이름을 찾을 수 없는 경우 첫 번째 세그먼트를 제외한 나머지 사용
        targetPath = pathSegments.slice(1).join('/');
      }
    } else {
      // 매칭된 라우트가 없는 경우 (이 코드에 도달하지 않아야 함)
      const pathParts = originalUrl.split('/');
      targetPath = pathParts.slice(1).join('/');
    }

    // 대상 URL과 결합, 이중 슬래시 방지
    let result = targetBaseUrl;
    if (!result.endsWith('/')) {
      result += '/';
    }

    if (targetPath) {
      result += targetPath;
    }

    return result;
  }

  private createHeadersForTargetRequest(req: Request): Record<string, string> {
    const headers = { ...req.headers } as Record<string, string>;

    // 전달하지 않을 헤더 제거
    delete headers.host;
    delete headers.connection;

    // 사용자 정보 및 역할 추가
    if (req.user) {
      headers['x-user-id'] = req.user['userId'];
      headers['x-user-roles'] = JSON.stringify(req.user['roles'] || []);
    }

    // 원본 IP 유지
    if (!headers['x-forwarded-for'] && req.ip) {
      headers['x-forwarded-for'] = req.ip;
    }

    return headers;
  }

  private handleProxyError(error: unknown, req: Request, res: Response): void {
    this.logger.error(
      `Proxy error for ${req.method} ${req.url}: ${(error as Error).message}`,
      (error as Error).stack,
    );
    if (error && typeof error === 'object' && 'response' in error) {
      // HTTP 오류 응답 (4xx, 5xx)
      const errorResponse = (error as any).response;  // 'response' 속성을 errorResponse 변수로 추출

      let responseData;
      try {
        // JSON 응답 파싱 시도
        responseData = JSON.parse(errorResponse.body.toString());
      } catch (e) {
        // 파싱 실패 시 문자열로 사용
        responseData = { message: errorResponse.body.toString() };
      }

      res.status(errorResponse.statusCode).json({
        statusCode: errorResponse.statusCode,
        message: responseData.message || 'Error from microservice',
        error: responseData.error || 'Proxy Error',
      });
    } else if (error && typeof error === 'object' && 'code' in error) {
      // 요청 오류 (네트워크 문제 등)
      const { code } = error as any;

      if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
        res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: `Service is currently unavailable (${code})`,
          error: 'Service Unavailable',
        });
      } else if (code === 'ETIMEDOUT') {
        res.status(HttpStatus.GATEWAY_TIMEOUT).json({
          statusCode: HttpStatus.GATEWAY_TIMEOUT,
          message: 'Request timed out while connecting to the service',
          error: 'Gateway Timeout',
        });
      } else {
        // 기타 알려진 에러 코드도 처리
        res.status(HttpStatus.BAD_GATEWAY).json({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: `Unable to connect to service: ${code}`,
          error: 'Bad Gateway',
        });
      }
    } else {
      // 기타 오류
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred while proxying the request',
        error: 'Internal Server Error',
      });
    }
  }
}
