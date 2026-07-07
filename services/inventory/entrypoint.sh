#!/bin/sh
set -e

cd /app/services/inventory

echo "[entrypoint] Aplicando migraciones de Prisma (migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] Iniciando la API de Inventario..."
exec node dist/main.js
