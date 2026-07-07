# syntax=docker/dockerfile:1
# App web (Next.js, output standalone) — build multi-stage sobre pnpm workspace.
# Contexto de build: raíz del monorepo.

FROM node:22-alpine AS base
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
RUN pnpm install --frozen-lockfile --filter @optimus/web...

# ---- build ----
FROM deps AS build
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web
RUN pnpm --filter @optimus/web build

# ---- runner: sirve el output standalone (base limpia, sin ajustes TLS de build) ----
FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
