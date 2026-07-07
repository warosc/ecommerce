#!/bin/sh
set -e

cd /app/services/orders

echo "[entrypoint] Aplicando migraciones de Prisma (migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] Iniciando la API de Pedidos..."
exec node dist/main.js
