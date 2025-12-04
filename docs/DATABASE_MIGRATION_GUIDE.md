# Database Migration Guide

## Development Workflow

1. Make schema changes in `database/prisma/schema.prisma`
2. Create migration: `pnpm prisma migrate dev --name descriptive_name`
3. Review generated SQL in `prisma/migrations/`
4. Test migration: `./scripts/test-migration.sh`
5. Commit schema.prisma + migration files together

## Production Deployment

### Pre-Deployment Checklist
- [ ] Migration tested in staging environment
- [ ] Backup plan documented and tested
- [ ] Rollback procedure documented
- [ ] Estimated downtime communicated
- [ ] Schema changes reviewed by architect

### Deployment Steps

1. **Backup Database**
   ```bash
   docker-compose exec postgres pg_dump -U antone antone > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test Migration (Dry Run)**
   ```bash
   # In transaction that will be rolled back
   docker-compose exec postgres psql -U antone antone -c "BEGIN; ..." 
   ```

3. **Apply Migration**
   ```bash
   cd database
   pnpm prisma migrate deploy
   ```

4. **Verify**
   ```bash
   pnpm prisma db pull
   # Verify no drift
   ```

### Rollback Procedure

If migration fails:

1. **Immediate Rollback**
   ```bash
   # Restore from backup
   docker-compose exec -T postgres psql -U antone antone < backup_TIMESTAMP.sql
   ```

2. **Revert Code**
   ```bash
   git revert <migration_commit>
   ```

3. **Document Incident**
   - What failed
   - Why it failed
   - What was rolled back
   - Lessons learned

## Migration Safety Rules

1. **Never delete columns** - Deprecate in code, remove later
2. **Always add columns as nullable** - Or provide default value
3. **Separate data migrations** - Schema changes separate from data changes
4. **Test with production-sized data** - Performance can differ greatly
5. **Document breaking changes** - Clear communication to team
