#!/bin/bash
# scripts/backup-db.sh - PostgreSQL Backup Script
#
# Creates compressed database backups and optionally uploads to Backblaze B2.
#
# Usage:
#   ./scripts/backup-db.sh              # Local backup only
#   ./scripts/backup-db.sh --upload     # Backup and upload to B2
#
# Backup location: ./backups/antone_YYYYMMDD_HHMMSS.sql.gz
# Retention: 7 days for local backups

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="antone_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

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
echo -e "${BLUE}💾 PostgreSQL Backup${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if PostgreSQL container is running
if ! docker ps -q -f name=antone-postgres > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL container is not running${NC}"
    echo "   Start with: ./scripts/dev-ctl.sh up -d"
    exit 1
fi

# Create backup
echo -e "${YELLOW}Step 1:${NC} Creating backup..."
docker exec antone-postgres pg_dump -U "${POSTGRES_USER:-antone}" "${POSTGRES_DB:-antone}" | gzip > "$BACKUP_DIR/$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to Backblaze B2 if requested
if [ "$1" = "--upload" ]; then
    echo -e "${YELLOW}Step 2:${NC} Uploading to Backblaze B2..."
    
    if [ -z "$BACKBLAZE_KEY_ID" ] || [ -z "$BACKBLAZE_APPLICATION_KEY" ]; then
        echo -e "${YELLOW}⚠${NC}  Backblaze credentials not configured in .env"
        echo "   Skipping upload..."
    else
        # Check if b2 CLI is installed
        if ! command -v b2 &> /dev/null; then
            echo -e "${YELLOW}⚠${NC}  b2 CLI not installed. Install with: pip install b2"
            echo "   Skipping upload..."
        else
            b2 authorize-account "$BACKBLAZE_KEY_ID" "$BACKBLAZE_APPLICATION_KEY" > /dev/null 2>&1
            b2 upload-file "${BACKBLAZE_BUCKET_NAME:-antone-backups}" "$BACKUP_DIR/$BACKUP_FILE" "backups/$BACKUP_FILE"
            echo -e "${GREEN}✓${NC} Uploaded to B2: backups/$BACKUP_FILE"
        fi
    fi
fi

# Clean up old backups
echo -e "${YELLOW}Step 3:${NC} Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
DELETED=$(find "$BACKUP_DIR" -name "antone_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo -e "${GREEN}✓${NC} Deleted $DELETED old backup(s)"

# List current backups
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 || echo "  No backups found"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Backup complete!${NC}"
echo ""
echo "Backup file: $BACKUP_DIR/$BACKUP_FILE"
echo ""
