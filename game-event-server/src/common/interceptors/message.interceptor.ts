import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { Observable, tap } from 'rxjs';

@Injectable()
export class MessageInterceptor implements NestInterceptor {
  private readonly noAck: boolean;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly configService: ConfigService,
  ) {
    this.noAck = this.configService.get<boolean>('RABBIT_MQ_NO_ACK', false);
    this.maxRetries = this.configService.get<number>('MQ_MAX_RETRIES', 3);
    this.retryDelay = this.configService.get<number>('MQ_RETRY_DELAY', 1000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // HTTP 요청은 처리하지 않음
    if (context.getType() === 'http') {
      return next.handle();
    }

    const host = context.switchToRpc();
    const rmqContext = host.getContext<RmqContext>();

    // 처리 시작 시간 기록
    const startTime = Date.now();
    const message = rmqContext.getMessage();
    const channel = rmqContext.getChannelRef();
    const routingKey = rmqContext.getPattern();

    const messageId = message.properties.messageId || 'unknown';

    // 메시지 수신 로깅
    this.logger.debug(
      `메시지 수신: ${routingKey}, ID: ${messageId}, Time: ${new Date().toISOString()}`,
    );

    return next.handle().pipe(
      tap({
        next: (result) => {
          const processingTime = Date.now() - startTime;

          this.logger.debug(
            `메시지 처리 완료: ${routingKey}, ID: ${messageId}, 처리 시간: ${processingTime}ms`,
            JSON.stringify({
              messageId,
              routingKey,
              processingTime,
              result:
                typeof result === 'object' ? JSON.stringify(result) : result,
            }),
          );

          // noAck가 false인 경우에만 ack 수행
          if (!this.noAck) {
            this.acknowledgeMessage(channel, message).catch((error) => {
              this.logger.error(
                `메시지 ACK 실패: ${error.message}`,
                error.stack,
              );
            });
          }
        },
        error: (error) => {
          const processingTime = Date.now() - startTime;

          this.logger.error(
            `메시지 처리 오류: ${routingKey}, ID: ${messageId}, 처리 시간: ${processingTime}ms`,
            JSON.stringify({
              messageId,
              routingKey,
              processingTime,
              error: error.message,
              stack: error.stack,
            }),
          );

          // 재시도 로직 또는 실패 큐로 전송
          if (!this.noAck) {
            // 메시지 헤더에서 재시도 횟수 확인
            const retryCount = (message.properties.headers?.['x-retry-count'] ||
              0) as number;

            if (retryCount < this.maxRetries) {
              // 재시도
              this.retryMessage(channel, message, retryCount + 1).catch(
                (retryError) => {
                  this.logger.error(
                    `메시지 재시도 실패: ${retryError.message}`,
                    retryError.stack,
                  );
                },
              );
            } else {
              // 최대 재시도 횟수 초과시 데드레터 큐로 보내고 강제 acked
              /*this.sendToDLQ(channel, message, error).catch(dlqError => {
                this.logger.error(
                  `DLQ 전송 실패: ${dlqError.message}`,
                  dlqError.stack
                );
              });*/
              this.acknowledgeMessage(channel, message).catch((error) => {
                this.logger.error(
                  `메시지 ACK 실패: ${error.message}`,
                  error.stack,
                );
              });
            }
          }

          // 오류를 다시 throw하여 핸들러로 전파
          throw error;
        },
      }),
    );
  }

  /**
   * 메시지 처리 성공 시 ACK 수행
   */
  private async acknowledgeMessage(
    channel: any,
    message: any,
    retries = 2,
  ): Promise<void> {
    try {
      channel.ack(message);
      this.logger.debug(
        `메시지 ACK 완료: ${message.properties.messageId || 'unknown'}`,
      );
    } catch (error) {
      if (retries > 0) {
        this.logger.warn(`ACK 실패, 재시도 중... (남은 시도: ${retries})`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.acknowledgeMessage(channel, message, retries - 1);
      }

      this.logger.error(`여러 번의 시도 후 ACK 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 메시지 처리 실패 시 재시도
   */
  private async retryMessage(
    channel: any,
    message: any,
    retryCount: number,
  ): Promise<void> {
    try {
      // 원본 메시지 거부
      channel.reject(message, false);

      // 원본 큐 이름과 라우팅 키 추출
      const originalQueue = message.fields.routingKey;

      // 재발행할 메시지 준비
      const content = message.content;
      const options = {
        ...message.properties,
        headers: {
          ...(message.properties.headers || {}),
          'x-retry-count': retryCount,
          'x-original-exchange': message.fields.exchange,
          'x-original-routing-key': originalQueue,
        },
      };

      // 지연 후 다시 원본 큐로 발행
      await new Promise((resolve) =>
        setTimeout(resolve, this.retryDelay * retryCount),
      );
      channel.publish('', originalQueue, content, options);

      this.logger.debug(
        `메시지 재시도 (${retryCount}/${this.maxRetries}): ${message.properties.messageId || 'unknown'}`,
      );
    } catch (error) {
      this.logger.error(`메시지 재시도 중 오류: ${error.message}`);
      throw error;
    }
  }

  /**
   * 실제 운영에서는 최대 재시도 횟수 초과 시 데드 레터 큐를 만들어서 실패한 메세지를 대응하는게 좋음
   */
  private async sendToDLQ(
    channel: any,
    message: any,
    error: Error,
  ): Promise<void> {
    /*try {
      // 원본 메시지 거부
      channel.reject(message, false);

      // 데드 레터 큐 이름 구성
      const originalQueue = message.fields.routingKey;
      const dlqName = `${originalQueue}.dlq`;

      // 원본 메시지에 오류 정보 추가하여 DLQ로 발행
      const content = message.content;
      const options = {
        ...message.properties,
        headers: {
          ...(message.properties.headers || {}),
          'x-error-message': error.message,
          'x-error-time': new Date().toISOString(),
          'x-original-exchange': message.fields.exchange,
          'x-original-routing-key': originalQueue,
        },
      };

      // DLQ로 전송
      channel.publish('', dlqName, content, options);

      this.logger.warn(
        `최대 재시도 횟수 초과, 메시지를 DLQ로 전송: ${message.properties.messageId || 'unknown'}`
      );
    } catch (error) {
      this.logger.error(`DLQ 전송 중 오류: ${error.message}`);
      throw error;
    }*/
  }
}
