# Antone Database

This package contains the Prisma schema, migrations, and seed scripts for the Antone application.

## Migration Strategy

### Development Workflow

1. Modify `prisma/schema.prisma`.
2. Run `pnpm db:migrate` (alias for `prisma migrate dev`) to create and apply a new migration.
3. Verify the generated SQL in `prisma/migrations`.
4. Commit the schema and migration files.

### Production Deployment

Migrations are applied using `prisma migrate deploy`. This command applies all pending migrations.
Always backup the database before applying migrations in production.

### Rollback Procedures

If a migration fails:

1. Restore from the latest backup.
2. Revert the code to the previous version.
3. Fix the migration issue and try again.
   Note: Prisma does not support automatic down migrations.

### Data Retention

- **Posts & Decisions**: 90 days (archived to JSON).
- **Replies**: Indefinite.
- **Audit Logs**: 3 years.
- **KPI Metrics**: 2 years.
