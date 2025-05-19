import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter'
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor'
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  app.useLogger(logger);
  app.use(helmet());
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.enableCors('*')

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port,'0.0.0.0');
  console.log(`Auth server running on port ${port}`);
}
bootstrap();
