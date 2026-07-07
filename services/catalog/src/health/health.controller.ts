import { Controller, Get } from '@nestjs/common';

/** Endpoint de salud usado por el healthcheck de Docker Compose (`GET /api/health`). */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string; service: string } {
    return { status: 'ok', service: 'catalog' };
  }
}
