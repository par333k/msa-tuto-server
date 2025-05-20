import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from 'src/app.module';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { MessageInterceptor } from 'src/common/interceptors/message.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  // 전역 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalInterceptors(new MessageInterceptor(logger, configService));
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost, logger));

  app.useLogger(logger);
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('게임 이벤트 API')
      .setDescription('게임 이벤트 시스템 API 문서')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBIT_MQ_URL')],
        queue: configService.get<string>('RABBIT_MQ_QNAME'),
        noAck: configService.get<boolean>('RABBIT_MQ_NO_ACK'),
        prefetchCount: 1,
        queueOptions: {
          durable: true,
        },
      },
    },
    {
      inheritAppConfig: true,
    },
  );



  await app.startAllMicroservices();
  await app.listen(5000);
  const now = new Date();
  console.log(
    `=== [${now.toISOString()} (Time Zone Offset: ${now.getTimezoneOffset()})] Listening for Game Event Server ${5000}=== `,
  );
  console.log('게임 이벤트 서버가 메시지를 수신 중입니다');
}
bootstrap();
