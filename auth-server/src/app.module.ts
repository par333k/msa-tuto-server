import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import * as Joi from 'joi'
import { AuthModule } from 'src/auth/auth.module'
import { CacheModule } from 'src/cache/cache.module'
import { LoggingModule } from 'src/common/logger/logging.module'
import { LoggerMiddleware } from 'src/common/middlewares/logger.middleware'
import { HealthModule } from 'src/health/health.module'
import { RolesModule } from 'src/roles/roles.module'
import { TokensModule } from 'src/tokens/tokens.module'
import { UsersModule } from 'src/users/users.module'
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // 환경설정
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3001),
        MONGODB_URI: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('1h'),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
      }),
    }),

    // 데이터베이스
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectTimeoutMS: 50000,
        maxPoolSize: 10,
      }),
      inject: [ConfigService],
    }),

    // 애플리케이션 모듈
    AuthModule,
    UsersModule,
    RolesModule,
    CacheModule,
    TokensModule,
    HealthModule,
    LoggingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
