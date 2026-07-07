import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

/**
 * Módulo de autenticación/autorización. Registra la estrategia JWT (Keycloak) y
 * el guard de roles para que otros módulos puedan proteger sus endpoints.
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy, RolesGuard],
  exports: [PassportModule, RolesGuard],
})
export class AuthModule {}
