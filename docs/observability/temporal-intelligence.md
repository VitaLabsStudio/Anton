# Temporal Intelligence Observability

## Overview
The system exposes metrics via Prometheus and traces via OpenTelemetry. Dashboards are available in Grafana.

## Key Metrics

| Metric Name | Type | Description |
|-------------|------|-------------|
| `temporal_context_latency_ms` | Histogram | Latency of rule evaluation |
| `temporal_rule_evaluation_total` | Counter | Count of matched rules by ID |
| `temporal_strategy_cache_hit` | Counter | Number of cache hits |
| `temporal_strategy_cache_miss` | Counter | Number of cache misses |

## Tracing
- **Span Name**: `temporal.evaluate_rules`
- **Attributes**: `temporal.phase`, `temporal.rules_matched`, `temporal.multiplier`

## Alerts
- **High Latency**: Triggered if p99 evaluation > 10ms for 5 minutes.
- **Engagement Anomaly**: Triggered if engagement rate shifts > 20% vs last week.

## Dashboards
- **Temporal Intelligence**: `grafana/dashboards/temporal-intelligence.json`
