# Database Query Optimization

## Indexing Strategy
- **Foreign Keys**: All foreign keys must be indexed.
- **Filtering**: Columns frequently used in `WHERE` clauses must be indexed.
- **Sorting**: Columns used in `ORDER BY` must be indexed (often combined with filtering columns).
- **Unique Constraints**: Automatically created by unique constraints.

## Performance Validation
All new queries must be validated using `EXPLAIN ANALYZE`.

### How to Run
```sql
EXPLAIN ANALYZE SELECT * FROM posts WHERE platform = 'TWITTER';
```

### Acceptance Criteria
- Sequential Scans (`Seq Scan`) should be avoided for large tables.
- Index Scans (`Index Scan` or `Index Only Scan`) are preferred.
- Execution time should be under 50ms for standard queries.

## Monitoring
- Use `pg_stat_statements` to track slow queries.
- Review query performance during PR reviews.
