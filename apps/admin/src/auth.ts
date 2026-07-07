import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

/**
 * Configuración de Auth.js (next-auth v5) con Keycloak como proveedor OIDC.
 * Se guarda el `access_token` de Keycloak en el JWT/sesión para reenviarlo como
 * Bearer al microservicio de Catálogo desde las server actions.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Detrás de Traefik y accesible por varios hosts (admin.localhost / localhost):
  // trustHost deriva la URL base de la petición, evitando el desajuste de host
  // que rompe la cookie PKCE.
  trustHost: true,
  // El gateway de dev sirve por HTTP: las cookies no pueden ser `Secure`
  // (si no, el navegador no las reenvía en el callback). Revisar al añadir TLS.
  useSecureCookies: false,
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
