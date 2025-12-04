#!/bin/bash
# scripts/restore-db.sh - PostgreSQL Restore Script
#
# Restores database from a backup file.
#
# Usage:
#   ./scripts/restore-db.sh backups/antone_20241201_120000.sql.gz
#   ./scripts/restore-db.sh --latest    # Restore most recent backup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

echo ""
echo -e "${BLUE}🔄 PostgreSQL Restore${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Determine backup file
if [ "$1" = "--latest" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/antone_*.sql.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ No backup files found in $BACKUP_DIR${NC}"
        exit 1
    fi
    echo "Using latest backup: $(basename "$BACKUP_FILE")"
elif [ -n "$1" ]; then
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        # Try with backup directory prefix
        BACKUP_FILE="$BACKUP_DIR/$1"
        if [ ! -f "$BACKUP_FILE" ]; then
            echo -e "${RED}❌ Backup file not found: $1${NC}"
            exit 1
        fi
    fi
else
    echo "Usage: $0 <backup-file.sql.gz> | --latest"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

echo -e "Backup file: ${YELLOW}$BACKUP_FILE${NC}"

# Warning prompt
echo ""
echo -e "${RED}⚠️  WARNING: This will overwrite all data in the database!${NC}"
read -p "Are you sure you want to continue? (y/N): " -r REPLY
echo ""
if [[ ! "$REPLY" =~ ^[yY]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps -q -f name=antone-postgres > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL container is not running${NC}"
    echo "   Start with: ./scripts/dev-ctl.sh up -d"
    exit 1
fi

# Stop backend services to prevent connections
echo -e "${YELLOW}Step 1:${NC} Stopping backend services..."
docker stop antone-backend-api antone-backend-worker 2>/dev/null || true
echo -e "${GREEN}✓${NC} Backend services stopped"

# Drop and recreate database
echo -e "${YELLOW}Step 2:${NC} Recreating database..."
docker exec antone-postgres psql -U "${POSTGRES_USER:-antone}" -d postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-antone};"
docker exec antone-postgres psql -U "${POSTGRES_USER:-antone}" -d postgres -c "CREATE DATABASE ${POSTGRES_DB:-antone};"
echo -e "${GREEN}✓${NC} Database recreated"

# Restore from backup
echo -e "${YELLOW}Step 3:${NC} Restoring from backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i antone-postgres psql -U "${POSTGRES_USER:-antone}" -d "${POSTGRES_DB:-antone}"
echo -e "${GREEN}✓${NC} Database restored"

# Verify restoration
echo -e "${YELLOW}Step 4:${NC} Verifying restoration..."
TABLE_COUNT=$(docker exec antone-postgres psql -U "${POSTGRES_USER:-antone}" -d "${POSTGRES_DB:-antone}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo -e "${GREEN}✓${NC} Verified: $TABLE_COUNT tables restored"

# Restart backend services
echo -e "${YELLOW}Step 5:${NC} Starting backend services..."
docker start antone-backend-api antone-backend-worker 2>/dev/null || echo "Backend services not configured yet"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Database restore complete!${NC}"
echo ""
