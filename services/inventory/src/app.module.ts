import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), InventoryModule],
  controllers: [HealthController],
})
export class AppModule {}
