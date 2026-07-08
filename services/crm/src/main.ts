import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './crm/interfaces/http/filters/domain-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableCors({ origin: true });

  const port = Number(process.env.CRM_PORT ?? process.env.PORT ?? 3009);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[crm] API escuchando en http://0.0.0.0:${port}/api`);
}

void bootstrap();
