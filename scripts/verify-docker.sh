#!/bin/bash
# scripts/verify-docker.sh - Docker Deployment Verification (OPS-001 Mitigation)
#
# Comprehensive test script that validates the entire Docker deployment.
#
# Usage:
#   ./scripts/verify-docker.sh
#
# Prerequisites:
#   1. Docker and docker-compose installed
#   2. .env file configured (copy from .env.example)
#   3. External volume created: docker volume create antone_postgres_data

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🐳 Docker Deployment Verification${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Step 1: Check Docker daemon
echo -e "${YELLOW}Step 1:${NC} Checking Docker daemon..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo "   Start Docker Desktop or run: sudo systemctl start docker"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker daemon is running"

# Step 2: Check .env file exists
echo -e "${YELLOW}Step 2:${NC} Checking environment configuration..."
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   Copy the template: cp .env.example .env"
    echo "   Then edit .env with your values"
    exit 1
fi
echo -e "${GREEN}✓${NC} .env file exists"

# Step 3: Check external volume
echo -e "${YELLOW}Step 3:${NC} Checking external volume..."
if ! docker volume inspect antone_postgres_data > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}  Volume 'antone_postgres_data' not found. Creating..."
    docker volume create antone_postgres_data
    echo -e "${GREEN}✓${NC} Volume created"
else
    echo -e "${GREEN}✓${NC} External volume 'antone_postgres_data' exists"
fi

# Step 4: Start services
echo -e "${YELLOW}Step 4:${NC} Starting services..."
cd "$PROJECT_ROOT"
docker-compose --env-file .env -f docker/docker-compose.yml up -d postgres
echo -e "${GREEN}✓${NC} PostgreSQL started"

# Step 5: Wait for PostgreSQL to be healthy
echo -e "${YELLOW}Step 5:${NC} Waiting for PostgreSQL to become healthy..."
MAX_WAIT=60
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' antone-postgres 2>/dev/null || echo "not_found")
    if [ "$STATUS" = "healthy" ]; then
        echo -e "${GREEN}✓${NC} PostgreSQL is healthy"
        break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
    echo -n "."
done
echo ""

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ PostgreSQL failed to become healthy within ${MAX_WAIT}s${NC}"
    echo ""
    echo "Logs:"
    docker logs antone-postgres --tail 50
    exit 1
fi

# Step 6: Test PostgreSQL connectivity
echo -e "${YELLOW}Step 6:${NC} Testing PostgreSQL connectivity..."
if docker exec antone-postgres psql -U antone -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL connection successful"
else
    echo -e "${RED}❌ PostgreSQL connection failed${NC}"
    docker logs antone-postgres --tail 20
    exit 1
fi

# Step 7: Test data persistence
echo -e "${YELLOW}Step 7:${NC} Testing data persistence..."
# Create a test table
docker exec antone-postgres psql -U antone -c "CREATE TABLE IF NOT EXISTS _verify_test (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW());" > /dev/null 2>&1
docker exec antone-postgres psql -U antone -c "INSERT INTO _verify_test DEFAULT VALUES;" > /dev/null 2>&1
BEFORE_COUNT=$(docker exec antone-postgres psql -U antone -t -c "SELECT COUNT(*) FROM _verify_test;" 2>/dev/null | tr -d ' ')

# Restart postgres
echo "   Restarting PostgreSQL..."
docker-compose --env-file .env -f docker/docker-compose.yml restart postgres > /dev/null 2>&1
sleep 5

# Wait for healthy again
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' antone-postgres 2>/dev/null || echo "not_found")
    if [ "$STATUS" = "healthy" ]; then
        break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

AFTER_COUNT=$(docker exec antone-postgres psql -U antone -t -c "SELECT COUNT(*) FROM _verify_test;" 2>/dev/null | tr -d ' ')

if [ "$BEFORE_COUNT" = "$AFTER_COUNT" ]; then
    echo -e "${GREEN}✓${NC} Data persisted across restart (${AFTER_COUNT} rows)"
else
    echo -e "${RED}❌ Data persistence failed (before: ${BEFORE_COUNT}, after: ${AFTER_COUNT})${NC}"
    exit 1
fi

# Cleanup test table
docker exec antone-postgres psql -U antone -c "DROP TABLE IF EXISTS _verify_test;" > /dev/null 2>&1

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Docker deployment verification complete!${NC}"
echo ""
echo "Next steps:"
echo "  • Build backend: docker-compose --env-file .env -f docker/docker-compose.yml build backend-api"
echo "  • Start all: ./scripts/dev-ctl.sh up -d"
echo "  • View logs:  ./scripts/dev-ctl.sh logs -f"
echo ""
