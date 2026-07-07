# ADR-0006: Gateway / reverse-proxy con Traefik

- **Estado:** Aceptado
- **Fase:** 2

## Contexto
Con varios servicios HTTP (web, api, keycloak, admin) conviene un único punto de
entrada con enrutado por host, en lugar de exponer y recordar puertos sueltos.

## Decisión
Introducir **Traefik v3** como gateway/reverse-proxy, con el proveedor Docker
(descubre servicios por *labels*). Enrutado por host en el entrypoint `web` (:80):

- `web.localhost` → web (catálogo público)
- `api.localhost` → catalog-api
- `auth.localhost` → keycloak
- `admin.localhost` → admin

El dashboard de Traefik queda en `:8080` (modo inseguro, solo dev). Se mantienen
además los puertos directos (3000/3001/3002/5432) por comodidad de desarrollo.

## Alternativas consideradas
- **Nginx**: capaz, pero configuración estática; menos integrado con Docker.
- **Puertos directos sin gateway**: simple pero no escala y complica el issuer
  único de Keycloak.
- **Traefik (elegido)**: descubrimiento dinámico por labels, ideal para un
  compose que crecerá; mismo componente servirá de Ingress-equivalente.

## Consecuencias
- Un solo origen (`*.localhost:80`) para todas las apps en dev. Los navegadores
  Chromium/Firefox resuelven `*.localhost`; para `curl` usar `--resolve`.
- Keycloak se publica **solo** vía Traefik (issuer consistente); no se expone su
  puerto directo.
- En Fase K8s, el gateway se sustituye por Ingress; las rutas ya están
  modeladas por host.
- **Compatibilidad:** con Docker 29.6 / Docker Desktop 4.80, `traefik:v3.2`
  fallaba al hablar con el daemon. Se usa la imagen **`traefik:v3`** (última 3.x)
  y un **`docker-socket-proxy`** (`tecnativa/docker-socket-proxy`) que expone una
  API TCP de solo lectura; Traefik no monta el socket directamente (más seguro).
