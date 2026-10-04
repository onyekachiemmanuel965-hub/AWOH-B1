#!/bin/sh
set -eu
cd /app
if [ -f ./prisma/dev.db ]; then
  echo "Using bundled SQLite catalogue database."
else
  echo "No prisma/dev.db found — applying migrations to empty database."
  npx prisma migrate deploy
fi
if [ -f ./dist/src/main.js ]; then
  exec node dist/src/main.js
fi
exec node dist/main.js
