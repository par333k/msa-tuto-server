import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { RabbitmqService } from 'src/common/rabbitMq/rabbitmq.service'
import { ConfigModule } from 'src/config/config.module'

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'GAME_EVENT_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: configService.get<string>('RABBITMQ_QUEUE_NAME', 'game_events_queue'),
            queueOptions: {
              durable: true,
            },
            noAck: configService.get<boolean>('RABBITMQ_NO_ACK', false),
            prefetchCount: configService.get<number>('MQ_PREFETCH_COUNT', 1),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [RabbitmqService],
  exports: [ClientsModule, RabbitmqService],
})
export class RabbitmqModule {}
