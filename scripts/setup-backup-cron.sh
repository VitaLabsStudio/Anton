#!/bin/bash
# scripts/setup-backup-cron.sh - Setup automated database backups
#
# This script configures a cron job to run database backups nightly at 02:00
# with 7-day retention (already configured in backup-db.sh)
#
# Usage:
#   ./scripts/setup-backup-cron.sh
#
# To verify the cron job was created:
#   crontab -l | grep backup-db

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$PROJECT_ROOT/scripts/backup-db.sh"
LOG_FILE="$PROJECT_ROOT/logs/backup-cron.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}⏰ Setting up automated database backups${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Ensure backup script exists and is executable
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

chmod +x "$BACKUP_SCRIPT"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Create cron job entry
CRON_JOB="0 2 * * * cd $PROJECT_ROOT && $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo -e "${YELLOW}⚠${NC}  Cron job already exists for backup script"
    echo ""
    echo "Current cron jobs:"
    crontab -l | grep backup-db
    echo ""
    read -p "Do you want to update it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    # Remove existing cron job
    crontab -l | grep -v "$BACKUP_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}✓${NC} Cron job created successfully!"
echo ""
echo "Schedule: Daily at 02:00 AM"
echo "Retention: 7 days (configured in backup-db.sh)"
echo "Log file: $LOG_FILE"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To verify the cron job:"
echo "  crontab -l | grep backup-db"
echo ""
echo "To check backup logs:"
echo "  tail -f $LOG_FILE"
echo ""
echo "To manually run a backup:"
echo "  $BACKUP_SCRIPT"
echo ""
