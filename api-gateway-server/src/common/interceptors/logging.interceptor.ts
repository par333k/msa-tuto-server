import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston'
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const now = Date.now();
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip || req.connection.remoteAddress;

    this.logger.log(
      `Request: ${method} ${url} from ${ip} using ${userAgent}`,
    );

    if (req.body && Object.keys(req.body).length > 0 && !req.is('multipart/form-data')) {
      this.logger.debug(`Request Body: ${JSON.stringify(req.body)}`);
    }

    return next.handle().pipe(
      tap({
        next: (val) => {
          const response = context.switchToHttp().getResponse();
          const responseTime = Date.now() - now;

          this.logger.log(
            `Response: ${method} ${url} ${response.statusCode} - ${responseTime}ms`,
          );

          if (val && Object.keys(val).length > 0) {
            this.logger.debug(`Response Body: ${JSON.stringify(val)}`);
          }
        },
        error: (err) => {
          const response = context.switchToHttp().getResponse();
          const responseTime = Date.now() - now;

          this.logger.error(
            `Response Error: ${method} ${url} ${response.statusCode} - ${responseTime}ms`,
            err.stack,
          );
        },
      }),
    );
  }
}
