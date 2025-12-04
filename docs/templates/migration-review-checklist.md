# Migration Review Checklist

**Migration Name:** 
**Author:** 
**Date:** 

## Safety Checks
- [ ] No `DROP COLUMN` statements (if yes, explain why safe)
- [ ] No `DROP TABLE` statements
- [ ] No `ALTER COLUMN` that changes type incompatibly
- [ ] All new columns are `NULL` or have `DEFAULT`

## Performance Checks
- [ ] New indexes created for foreign keys
- [ ] New indexes created for query filters
- [ ] Index names follow convention (`table_column_idx`)

## Logic Checks
- [ ] `ON DELETE` behaviors correct (CASCADE vs SET NULL vs RESTRICT)
- [ ] Unique constraints added where appropriate
- [ ] Check constraints added for data validity

## Operational Checks
- [ ] Tested with `./scripts/test-migration.sh`
- [ ] Rollback plan verified
