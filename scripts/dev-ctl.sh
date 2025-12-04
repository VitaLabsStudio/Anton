#!/bin/bash
# scripts/dev-ctl.sh - Developer Control Script (DATA-001 Mitigation)
# 
# Safety wrapper for docker-compose commands that intercepts dangerous operations.
# ALWAYS use this script instead of raw docker-compose to prevent accidental data loss.
#
# Usage:
#   ./scripts/dev-ctl.sh up -d          # Start services
#   ./scripts/dev-ctl.sh down           # Stop services (safe)
#   ./scripts/dev-ctl.sh logs -f        # Follow logs
#   ./scripts/dev-ctl.sh ps             # List services

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.yml"
DEV_COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.dev.yml"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if command provided
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Usage:${NC} $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  up [-d]     Start services (use -d for detached mode)"
    echo "  down        Stop services"
    echo "  logs [-f]   View logs (use -f to follow)"
    echo "  ps          List services"
    echo "  build       Build images"
    echo "  restart     Restart services"
    echo "  exec        Execute command in container"
    echo ""
    echo -e "${RED}⚠️  WARNING:${NC} 'down -v' will prompt for confirmation to prevent data loss"
    exit 1
fi

COMMAND="$1"
shift

# Block dangerous commands - DATA-001 mitigation
if [[ "$COMMAND" == "down" ]]; then
    for arg in "$@"; do
        if [[ "$arg" == "-v" || "$arg" == "--volumes" ]]; then
            echo ""
            echo -e "${RED}🚨 CRITICAL WARNING 🚨${NC}"
            echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
            echo ""
            echo -e "You are attempting to run: ${YELLOW}docker-compose down -v${NC}"
            echo ""
            echo -e "This will ${RED}PERMANENTLY DELETE${NC} all Docker volumes, including:"
            echo -e "  • ${RED}PostgreSQL database${NC} (all posts, authors, analytics data)"
            echo -e "  • ${RED}All learned patterns${NC} and weight optimizations"
            echo ""
            echo -e "${RED}THIS ACTION CANNOT BE UNDONE.${NC}"
            echo ""
            echo -e "${YELLOW}If you need to reset the database, consider:${NC}"
            echo "  1. Running a backup first: ./scripts/backup-db.sh"
            echo "  2. Using database migrations to reset specific tables"
            echo ""
            echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
            echo ""
            read -p "Are you ABSOLUTELY sure you want to delete all data? Type 'DELETE ALL DATA' to confirm: " -r REPLY
            echo ""
            if [[ "$REPLY" != "DELETE ALL DATA" ]]; then
                echo -e "${GREEN}✓ Aborted. Your data is safe.${NC}"
                exit 1
            fi
            echo -e "${YELLOW}⚠️  Proceeding with volume deletion...${NC}"
            break
        fi
    done
fi

# Determine which compose files to use
COMPOSE_FILES="--env-file $PROJECT_ROOT/.env -f $COMPOSE_FILE"
if [ -f "$DEV_COMPOSE_FILE" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f $DEV_COMPOSE_FILE"
fi

# Execute the command
echo -e "${GREEN}🚀 Executing:${NC} docker-compose $COMPOSE_FILES $COMMAND $*"
echo ""
docker-compose $COMPOSE_FILES "$COMMAND" "$@"
