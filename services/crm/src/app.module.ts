import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrmModule } from './crm/crm.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CrmModule],
  controllers: [HealthController],
})
export class AppModule {}
