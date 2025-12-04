# Contributing to Antone

## Database Changes

- All schema changes must be reviewed by the Architect.
- New queries must include `EXPLAIN ANALYZE` output in the PR description.
- Run `pnpm validate:schema` before submitting.

## Schema Review Checklist

- [ ] No DROP COLUMN commands (deprecate instead).
- [ ] All new columns are nullable or have defaults.
- [ ] Indexes named consistently.
- [ ] Foreign keys have proper ON DELETE behavior.
- [ ] Migration SQL reviewed manually.
