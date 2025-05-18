import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { AppModule } from 'src/app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MessageInterceptor } from 'src/common/interceptors/message.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER)
  // 전역 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new MessageInterceptor(logger, configService))

  app.useLogger(logger);
  app.setGlobalPrefix('api')

  app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBIT_MQ_URL')],
        queue: configService.get<string>('RABBIT_MQ_QUEUE_NAME'),
        noAck: configService.get<boolean>('RABBIT_MQ_NO_ACK'),
        prefetchCount: 1,
        queueOptions: {
          durable: true,
        },
      },
    },
    {
      inheritAppConfig: true,
    },)

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


  await app.startAllMicroservices()
  await app.listen(5000)
  const now = new Date()
  console.log(`=== [${now.toISOString()} (Time Zone Offset: ${now.getTimezoneOffset()})] Listening for Game Event Server ${5000}=== `)
  console.log('게임 이벤트 서버가 메시지를 수신 중입니다');
}
bootstrap();
