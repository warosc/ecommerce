import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), OrdersModule],
  controllers: [HealthController],
})
export class AppModule {}
