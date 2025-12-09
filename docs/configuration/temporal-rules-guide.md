# Temporal Rules Configuration Guide

## Rule Structure

A temporal rule consists of:
- **id**: Unique identifier (e.g., `sunday_morning_peak`).
- **priority**: Integer (higher wins).
- **condition**: Criteria to trigger the rule.
- **strategy**: What to do when triggered.

### Example
```json
{
  "id": "sunday_morning_peak",
  "name": "Sunday Morning Peak Suffering",
  "priority": 80,
  "enabled": true,
  "condition": {
    "type": "time_range",
    "day": 0,         // Sunday
    "hourStart": 6,
    "hourEnd": 11
  },
  "strategy": {
    "phase": "peak_suffering",
    "monitoringMultiplier": 3.0,
    "isPriority": true
  }
}
```

## Priority System
- **100+**: Critical / Holiday Specific (e.g., New Year's Morning)
- **80-99**: High Intensity / Peak Patterns (e.g., Sunday Morning Hangover)
- **60-79**: Moderate / Prevention (e.g., Thursday Pre-game)
- **40-59**: Standard / Recurring (e.g., Late Night)
- **0-39**: Low Priority / Background

## Condition Types

### `time_range`
Triggers based on day of week and hour range.
- `day`: 0-6 (Sunday-Saturday)
- `hourStart`: 0-23
- `hourEnd`: 0-24

### `holiday`
Triggers on the day of a specific holiday.
- `holidayId`: ID from `temporal-holidays.json`

### `pre_holiday` / `post_holiday`
Triggers N days before or after a holiday.

## Holiday Calendar
Defined in `temporal-holidays.json` using RRULE syntax.
```json
{
  "id": "new_year",
  "name": "New Year",
  "recurrence": "FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1"
}
```
