import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClinicModule } from './clinic/clinic.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ClinicModule],
  controllers: [HealthController],
})
export class AppModule {}
