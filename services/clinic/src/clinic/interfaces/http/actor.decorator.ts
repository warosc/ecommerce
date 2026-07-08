import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AuthenticatedUser } from '../../../auth/authenticated-user';

/** Inyecta el nombre de usuario del personal autenticado (para auditoría). */
export const Actor = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
  return request.user?.username ?? 'desconocido';
});
