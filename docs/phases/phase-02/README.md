# Fase 2 — Identidad (Keycloak) + Gateway (Traefik) + Admin

## Alcance
Añadir autenticación/autorización real y un panel de administración:

- **Keycloak** (OIDC) como IdP: realm `optimus`, rol `admin`, cliente
  `optimus-admin`, usuarios demo `admin`/`vendedor`.
- **Traefik** como gateway: enruta `web/api/auth/admin.localhost`.
- **apps/admin** (Next.js + next-auth): login con Keycloak y formulario para
  crear productos (usa el POST protegido).
- **Backend**: `POST /api/products` protegido con JWT + rol `admin`; `GET` sigue
  público.

Infra nueva de esta fase: **Keycloak, Traefik** (coherente con "añadir infra
cuando el módulo la necesita").

## Componentes / archivos clave
- `services/catalog/src/auth/` — `JwtStrategy` (JWKS interno + issuer público),
  `JwtAuthGuard`, `RolesGuard`, `@Roles`, `AuthModule`.
- `services/catalog/src/catalog/interfaces/http/product.controller.ts` — `@UseGuards`
  + `@Roles('admin')` en `create`.
- `infra/keycloak/realm-optimus.json` — realm importable.
- `apps/admin/` — `src/auth.ts` (Auth.js/Keycloak), `src/app/actions.ts` (server
  action que reenvía el Bearer), `src/components/CreateProductForm.tsx`.
- `docker-compose.yml` — servicios `traefik`, `keycloak`, `admin` + labels + env.

## Credenciales demo (Keycloak realm `optimus`)
- `admin` / `admin123` → rol **admin** (puede crear productos).
- `vendedor` / `vendedor123` → rol **vendedor** (NO puede crear → 403).
- Consola Keycloak (master): `admin` / `admin` en `http://auth.localhost` (o dashboard Traefik en `http://localhost:8080`).

## Cómo verificar

### En el navegador (Chromium/Firefox resuelven *.localhost)
1. `http://web.localhost` → catálogo público (lectura, sin login).
2. `http://admin.localhost` → “Iniciar sesión con Keycloak” → entra con
   `admin/admin123` → crea un producto → aparece en `http://web.localhost/catalogo`.
3. Repite con `vendedor/vendedor123` → al crear, la API responde **403**.

### Por API (curl usa --resolve porque Windows no resuelve *.localhost)
```bash
# 1) Token del usuario admin (Direct Access Grant)
TOKEN=$(curl -s --resolve auth.localhost:80:127.0.0.1 \
  http://auth.localhost/realms/optimus/protocol/openid-connect/token \
  -d grant_type=password -d client_id=optimus-admin \
  -d client_secret=optimus-admin-secret \
  -d username=admin -d password=admin123 | jq -r .access_token)

# 2) POST protegido con token admin -> 201
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"sku":"FR-ADM-01","name":"Creado por admin","type":"FRAME","brand":"Optimus","priceAmount":50000}'

# 3) Sin token -> 401 ; con token de 'vendedor' -> 403 ; GET público -> 200
```

## Criterios de aceptación — VERIFICADO ✅ (2026-07-07)
- [x] `docker compose up -d --build` levanta traefik+dockerproxy+postgres+keycloak+catalog-api+web+admin.
- [x] Keycloak importa el realm `optimus` (`/realms/optimus` → 200; token con `iss=http://auth.localhost/realms/optimus`, rol `admin`).
- [x] `POST /api/products` sin token → **401**; con rol admin → **201** (persistido); con rol vendedor → **403**.
- [x] `GET /api/products` sigue **200** sin auth.
- [x] Traefik enruta `web/api/auth/admin.localhost` (200) y el contenedor admin alcanza el discovery OIDC vía `extra_hosts`.
- [x] Tests catálogo: **48 unit** (incl. `RolesGuard`) + **10 e2e** en verde.
- [ ] Login interactivo del admin en el navegador (paso manual: entra en `http://admin.localhost`).

### Gotcha resuelto: Traefik + Docker 29.6
Con **Docker 29.6 / Docker Desktop 4.80** (versiones muy nuevas), `traefik:v3.2`
no podía hablar con el daemon (`Failed to retrieve information of the docker
client... Error response from daemon`). Solución: usar la imagen **`traefik:v3`**
(última 3.x) + un **docker-socket-proxy** (`tecnativa/docker-socket-proxy`) que
expone una API TCP filtrada de solo lectura (más seguro que montar el socket en
Traefik). Con eso Traefik descubre las rutas por labels correctamente.

## Notas / limitaciones (para fases siguientes)
- Keycloak corre en `start-dev` con H2 (no persistente entre recreaciones; el
  realm se reimporta al arrancar). En producción: BD dedicada + `start`.
- No se valida `audience` todavía; no hay refresh-token flow en el admin.
- `*.localhost` lo resuelven los navegadores; para `curl`/scripts usar `--resolve`.
