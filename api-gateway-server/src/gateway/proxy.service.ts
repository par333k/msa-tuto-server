import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

@Injectable()
export class ProxyService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  async proxyRequest(
    req: Request,
    res: Response,
    targetUrl: string,
  ): Promise<void> {
    const method = req.method.toLowerCase();
    const url = this.createTargetUrl(targetUrl, req);

    this.logger.debug(`Proxying ${method.toUpperCase()} request to ${url}`);

    try {
      // 요청 헤더 설정
      const headers = { ...req.headers };

      // 불필요한 헤더 제거
      delete headers.host;
      delete headers.connection;
      delete headers['content-length'];

      // 인증 헤더 확인 및 조정 (필요한 경우)
      if (
        headers.authorization &&
        !headers.authorization.startsWith('Bearer ')
      ) {
        headers.authorization = `Bearer ${headers.authorization}`;
        console.log('Modified authorization header:', headers.authorization);
      }

      const response = await axios({
        method: method,
        url: url,
        headers,
        data: Object.keys(req.body || {}).length > 0 ? req.body : undefined,
        params: req.query,
        timeout: 5000,
        validateStatus: () => true, // 모든 상태 코드를 허용
      });

      Object.keys(response.headers).forEach((key) => {
        res.set(key, response.headers[key]);
      });
      // 응답 전송
      res.status(response.status).send(response.data);
    } catch (error) {
      console.log('########error#########');
      console.log(error);
      console.log('#######################');

      this.handleProxyError(error, req, res);
    }
  }

  private createTargetUrl(targetBaseUrl: string, req: Request): string {
    const originalPath = req.path;

    let result = targetBaseUrl;
    if (!result.endsWith('/')) {
      result += '/';
    }

    const cleanPath = originalPath.startsWith('/')
      ? originalPath.substring(1)
      : originalPath;

    return result + cleanPath;
  }

  private handleProxyError(error: unknown, req: Request, res: Response): void {
    this.logger.error(
      `Proxy error for ${req.method} ${req.url}: ${(error as Error).message}`,
      (error as Error).stack,
    );
    if (error && typeof error === 'object' && 'response' in error) {
      // HTTP 오류 응답 (4xx, 5xx)
      const errorResponse = (error as any).response; // 'response' 속성을 errorResponse 변수로 추출

      res.status(errorResponse.status).json({
        statusCode: errorResponse.status,
        message: errorResponse.data.message || 'Error from microservice',
        error: errorResponse.data.error || 'Proxy Error',
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
