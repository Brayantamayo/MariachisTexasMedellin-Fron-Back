#!/bin/sh
set -e

echo "  Ejecutando migraciones de Prisma..."
npx prisma db push

echo "  Migraciones completadas. Iniciando servidor..."
exec node dist/src/index.js