#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
node script/migrate.mjs
echo "[entrypoint] Migrations complete, starting server..."

exec node server.js
