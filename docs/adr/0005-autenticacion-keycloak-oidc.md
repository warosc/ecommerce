# ADR-0005: Autenticación y autorización con Keycloak (OIDC)

- **Estado:** Aceptado
- **Fase:** 2

## Contexto
A partir de Fase 2 hay operaciones que deben restringirse (escrituras del
catálogo) y un panel de administración. Se necesita identidad centralizada,
reutilizable por todos los microservicios y apps futuros.

## Decisión
Adoptar **Keycloak** como IdP (OIDC/OAuth2), tal como define el master prompt.

- **Realm `optimus`** con rol de realm `admin` (y `vendedor`), cliente
  confidencial `optimus-admin` (Authorization Code + Direct Access Grants para
  pruebas), y usuarios de demo (`admin`, `vendedor`). Se importa por JSON al
  arrancar (`--import-realm`), versionado en `infra/keycloak/realm-optimus.json`.
- **Backend (NestJS):** estrategia `passport-jwt` que valida el access token
  RS256. Las **claves (JWKS) se obtienen por la red interna** de Docker
  (`KEYCLOAK_JWKS_URI` → `http://keycloak:8080/...`), mientras que el **issuer
  esperado es la URL pública** (`KEYCLOAK_ISSUER` → `http://auth.localhost/...`).
  Desacoplar JWKS-URI de issuer evita que el backend tenga que resolver el
  hostname público. Autorización por rol con `RolesGuard` + `@Roles('admin')`.
  Se protege `POST /api/products`; los `GET` siguen públicos.
- **Admin (Next.js):** Auth.js (next-auth v5) con el proveedor Keycloak; guarda
  el access token en la sesión y lo reenvía como Bearer desde server actions.

## Alternativas consideradas
- **JWT propio en NestJS**: más simple, pero no centraliza identidad y se
  reescribe al adoptar Keycloak. Descartado (el momento de "añadir cuando se
  necesita" es ahora).
- **Validar el token descargando JWKS desde la URL pública**: obligaría al
  backend a resolver `auth.localhost`. Se evita separando JWKS-URI/issuer.

## Consecuencias
- Identidad reutilizable por los próximos módulos (inventario, pedidos, etc.).
- Complejidad de hostnames: el issuer debe ser idéntico para navegador y
  servicios; se resuelve con `KC_HOSTNAME=http://auth.localhost` tras Traefik y
  `extra_hosts` en el contenedor admin.
- Pendiente (siguiente iteración): validación de `audience`, refresh tokens,
  rotación de secretos, y realm export reproducible.
