#!/bin/sh
set -e

echo "Ensuring pgvector extension..."
node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(() => c.query('CREATE EXTENSION IF NOT EXISTS vector')).then(() => c.end()).then(() => console.log('vector extension ready')).catch(e => { console.error(e); process.exit(1); });"

echo "Running database migrations..."
npx drizzle-kit push --force
echo "Migrations complete."

echo "Starting server..."
exec node server.js
