#!/bin/sh
set -e

cd /app/services/crm

echo "[entrypoint] Aplicando migraciones de Prisma (migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] Iniciando la API de CRM..."
exec node dist/main.js
