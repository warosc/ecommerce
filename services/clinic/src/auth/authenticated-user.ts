/** Usuario autenticado que la estrategia JWT adjunta a `request.user`. */
export interface AuthenticatedUser {
  sub: string;
  username: string;
  email?: string;
  roles: string[];
}
