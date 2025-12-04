#!/bin/bash
set -e

echo "🧪 Testing database migration..."

# Detect docker compose file
COMPOSE_FILE="docker/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Docker compose file not found at $COMPOSE_FILE"
    exit 1
fi

# We need to know the postgres password for pg_dump
# It's in .env or passed via env var
if [ -f .env ]; then
  source .env
fi

# Backup current database
echo "📦 Creating backup..."
# Using PGPASSWORD env var for pg_dump inside container
# Note: -T disables pseudo-tty, useful for scripts
docker compose -f $COMPOSE_FILE exec -T -e PGPASSWORD=$POSTGRES_PASSWORD postgres pg_dump -U antone antone > backup_before_migration.sql

# Apply migration
echo "🔄 Applying migration..."
cd database
# Ensure DATABASE_URL is set for prisma
export DATABASE_URL="postgresql://${POSTGRES_USER:-antone}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB:-antone}"
pnpm prisma migrate deploy || {
  echo "❌ Migration failed!"
  echo "🔙 Restoring from backup..."
  cd .. # Go back to root
  docker compose -f $COMPOSE_FILE exec -T -e PGPASSWORD=$POSTGRES_PASSWORD postgres psql -U antone antone < backup_before_migration.sql
  exit 1
}
cd .. # Back to root

# Verify schema
echo "✅ Migration successful, verifying schema..."
cd database
pnpm prisma db pull
# schema.prisma is in database/prisma/schema.prisma
git diff --exit-code prisma/schema.prisma || {
  echo "⚠️  Schema drift detected after migration"
  # Don't exit with error if just drift, but warn? Or exit?
  # Story says "Schema drift detected"
  # Usually we want to fail if drift occurs.
  exit 1
}

echo "✅ Migration test completed successfully"
# Clean up backup
rm ../backup_before_migration.sql 2>/dev/null || rm backup_before_migration.sql 2>/dev/null || true
