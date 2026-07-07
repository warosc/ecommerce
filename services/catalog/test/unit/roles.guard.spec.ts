import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../../src/auth/authenticated-user';
import { RolesGuard } from '../../src/auth/roles.guard';

function contextWithUser(user?: Partial<AuthenticatedUser>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guardRequiring(roles: string[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: () => roles,
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('permite cuando el endpoint no requiere roles', () => {
    expect(guardRequiring(undefined).canActivate(contextWithUser())).toBe(true);
    expect(guardRequiring([]).canActivate(contextWithUser())).toBe(true);
  });

  it('permite cuando el usuario tiene el rol requerido', () => {
    const ctx = contextWithUser({ roles: ['admin', 'user'] });
    expect(guardRequiring(['admin']).canActivate(ctx)).toBe(true);
  });

  it('lanza Forbidden cuando faltan los roles', () => {
    const ctx = contextWithUser({ roles: ['user'] });
    expect(() => guardRequiring(['admin']).canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('lanza Forbidden cuando no hay usuario', () => {
    expect(() => guardRequiring(['admin']).canActivate(contextWithUser())).toThrow(
      ForbiddenException,
    );
  });
});
