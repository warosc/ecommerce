#!/bin/sh
set -e

cd /app/services/clinic

echo "[entrypoint] Aplicando migraciones de Prisma (migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] Iniciando la API Clínica..."
exec node dist/main.js
