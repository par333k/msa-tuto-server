import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const corsOptions = {
    credentials: true,
    origin: ['http://localhost:4000', 'http://localhost:5000'],
  };
  try {
    const app = await NestFactory.create(AppModule, {
      cors: corsOptions,
      logger: ['error', 'warn'],
    });
    const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
    app.useLogger(logger);

    // Get configuration
    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    const env = configService.get<string>('NODE_ENV', 'development');

    app.use(helmet());
    app.use(compression());

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global exception filters
    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(
      new AllExceptionsFilter(httpAdapterHost, logger),
      new HttpExceptionFilter(logger),
    );

    // API Documentation with Swagger
    if (env !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('API Gateway')
        .setDescription('The API Gateway for the MSA architecture')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api-docs', app, document);

      logger.log('Swagger API documentation available at /api-docs');
    }

    // Start the application
    await app.listen(port);

    console.log(`API Gateway running on port ${port} in ${env} mode`);
  } catch (error) {
    console.log(`Error starting API Gateway: ${error.message}`, error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();
