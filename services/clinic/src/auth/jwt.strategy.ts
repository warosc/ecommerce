import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from './authenticated-user';

interface KeycloakJwtPayload {
  sub: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
}

/**
 * Valida el access token (RS256) de Keycloak: firma vía JWKS interno y `iss`
 * contra el issuer público configurado. Igual que en el servicio de Catálogo.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const issuer = process.env.KEYCLOAK_ISSUER;
    const jwksUri = process.env.KEYCLOAK_JWKS_URI;
    if (!issuer || !jwksUri) {
      throw new Error('Faltan KEYCLOAK_ISSUER y/o KEYCLOAK_JWKS_URI.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      issuer,
      secretOrKeyProvider: passportJwtSecret({
        jwksUri,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      }),
    });
  }

  validate(payload: KeycloakJwtPayload): AuthenticatedUser {
    if (!payload?.sub) {
      throw new UnauthorizedException('Token inválido.');
    }
    return {
      sub: payload.sub,
      username: payload.preferred_username ?? payload.sub,
      email: payload.email,
      roles: payload.realm_access?.roles ?? [],
    };
  }
}
