# syntax=docker/dockerfile:1
# Microservicio Pedidos (NestJS + Prisma + Redis + RabbitMQ) — build sobre pnpm workspace.
# Contexto de build: raíz del monorepo.

FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g pnpm@9.15.0
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/
COPY services/catalog/package.json ./services/catalog/
COPY services/inventory/package.json ./services/inventory/
COPY services/orders/package.json ./services/orders/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile --filter @optimus/orders...

# ---- build ----
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY services/orders ./services/orders
RUN pnpm --filter @optimus/orders build

# ---- runner ----
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs \
  && chmod +x services/orders/entrypoint.sh \
  && chown -R nestjs:nodejs /app
USER nestjs
WORKDIR /app/services/orders
EXPOSE 3005
CMD ["./entrypoint.sh"]
