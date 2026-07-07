#!/bin/sh
set -e

cd /app/services/catalog

echo "[entrypoint] Aplicando migraciones de Prisma (migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] Ejecutando seed idempotente..."
npx prisma db seed

echo "[entrypoint] Iniciando la API de Catálogo..."
exec node dist/main.js
