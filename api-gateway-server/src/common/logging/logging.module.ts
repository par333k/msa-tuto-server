import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get<string>('LOG_LEVEL', 'info');
        const isProd = configService.get<string>('NODE_ENV') === 'production';

        return {
          transports: [
            new winston.transports.Console({
              level: logLevel,
              format: winston.format.combine(
                winston.format.timestamp(),
                isProd
                  ? winston.format.json()
                  : winston.format.combine(
                      winston.format.colorize(),
                      nestWinstonModuleUtilities.format.nestLike('API-Gateway', {
                        prettyPrint: true,
                        colors: true,
                      }),
                    ),
              ),
            }),
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
          ],
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggingModule {}
