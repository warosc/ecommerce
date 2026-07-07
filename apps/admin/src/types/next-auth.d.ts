import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    /** Access token de Keycloak, reenviado a la API como Bearer. */
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
}
