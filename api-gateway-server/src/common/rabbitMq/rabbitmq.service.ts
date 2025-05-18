import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientProxy } from '@nestjs/microservices'
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class RabbitmqService {
  constructor(
    @Inject('GAME_EVENT_SERVICE') private readonly client: ClientProxy,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 이벤트를 RabbitMQ로 발행
   */
  emitEvent<T>(pattern: string | object, data: T, options: Record<string, any> = {}): void {
    try {
      const messageId = options.messageId || uuidv4();

      this.logger.debug(`이벤트 발행: ${JSON.stringify(pattern)}, ID: ${messageId}`);

      this.client.emit(pattern, {
        ...data,
        _metadata: {
          messageId,
          timestamp: new Date().toISOString(),
          ...options,
        },
      })

      this.logger.debug(`이벤트 발행 완료: ${JSON.stringify(pattern)}, ID: ${messageId}`);
    } catch (error) {
      this.logger.error(`이벤트 발행 실패: ${error.message}`, error.stack);
      throw error;
    }
  }
}
