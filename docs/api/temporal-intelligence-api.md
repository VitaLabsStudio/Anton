# Temporal Intelligence API Reference

## Admin Endpoints

### GET /api/admin/temporal/rules
Lists all configured temporal rules.
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "sunday_morning_peak",
      "name": "Sunday Morning Peak Suffering",
      "priority": 80,
      "enabled": true,
      ...
    }
  ]
  ```

### POST /api/admin/temporal/rules
Creates a new temporal rule.
- **Body**: `TemporalRule` object
- **Response**: `201 Created`

### PATCH /api/admin/temporal/rules/:id
Updates an existing rule.
- **Body**: Partial `TemporalRule` object
- **Response**: `200 OK`

### DELETE /api/admin/temporal/rules/:id
Deletes a rule.
- **Response**: `204 No Content`

### GET /api/admin/temporal/holidays
Lists configured holidays.

## Analytics Endpoints

### GET /api/analytics/temporal/performance
Returns performance metrics for the engine.
- **Response**:
  ```json
  {
    "p99_latency_ms": 0.05,
    "cache_hit_rate": 0.95,
    "evaluations_per_sec": 1250
  }
  ```

### GET /api/analytics/temporal/distribution
Returns distribution of matched rules over time.
- **Response**: Histogram data of rule activations.
