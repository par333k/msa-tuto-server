import { HttpModule, HttpService } from '@nestjs/axios'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule } from 'src/common/logging/logging.module'
import { RabbitmqModule } from 'src/common/rabbitMq/rabbitmq.module'
import { RolesModule } from 'src/roles/roles.module'
import { AuthModule } from '../auth/auth.module';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ProxyService } from './proxy.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    LoggingModule,
    RabbitmqModule,
    RolesModule,
    HttpModule,
  ],
  controllers: [GatewayController],
  providers: [GatewayService, ProxyService],
  exports: [GatewayService, ProxyService],
})
export class GatewayModule {}
