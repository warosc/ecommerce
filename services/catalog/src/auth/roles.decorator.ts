import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Marca un handler/controlador como restringido a los roles indicados. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
