# syntax=docker/dockerfile:1
# App admin (Next.js + next-auth, output standalone) — build sobre pnpm workspace.
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
RUN pnpm install --frozen-lockfile --filter @optimus/admin...

# ---- build ----
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/admin ./apps/admin
RUN pnpm --filter @optimus/admin build

# ---- runner ----
FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public
USER nextjs
EXPOSE 3002
CMD ["node", "apps/admin/server.js"]
