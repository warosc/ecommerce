# syntax=docker/dockerfile:1
# Microservicio Catálogo (NestJS + Prisma) — build multi-stage sobre pnpm workspace.
# Contexto de build: raíz del monorepo.

FROM node:22-alpine AS base
# openssl/libc6-compat son requeridos por los engines de Prisma en Alpine.
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g pnpm@9.15.0
WORKDIR /app

# ---- deps: instala solo el subárbol de dependencias del catálogo ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/
COPY services/catalog/package.json ./services/catalog/
COPY services/inventory/package.json ./services/inventory/
COPY services/orders/package.json ./services/orders/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile --filter @optimus/catalog...

# ---- build: genera el cliente Prisma y compila TypeScript ----
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY services/catalog ./services/catalog
RUN pnpm --filter @optimus/catalog build

# ---- runner: imagen de ejecución (base limpia, sin ajustes TLS de build) ----
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs \
  && chmod +x services/catalog/entrypoint.sh \
  && chown -R nestjs:nodejs /app
USER nestjs
WORKDIR /app/services/catalog
EXPOSE 3001
CMD ["./entrypoint.sh"]
