# Observability Strategy

**Project:** Antone V2 (Reply Bot)
**Date:** 2025-12-06

## 1. Overview

Observability in Antone V2 relies on three pillars to ensure the system is behaving correctly and to facilitate rapid debugging of the Decision Engine.

1.  **Logs (Pino):** "What is happening right now?" (Events)
2.  **Metrics (Prometheus/Registry):** "Is the system healthy?" (Trends)
3.  **Traces (Request ID):** "Where did this request go?" (Causality)

## 2. Logging Architecture

We use **Pino** for high-performance, structured JSON logging.

### 2.1 Configuration
*   **Production:** JSON output to `stdout`. Docker captures this.
*   **Development:** Pretty-printed (via `pino-pretty`) for readability.

### 2.2 Log Levels
| Level | Usage | Example |
| :--- | :--- | :--- |
| **FATAL** | System cannot continue. | DB connection lost, config missing. |
| **ERROR** | Request failed, bug detected. | `DeepSeek API 500`, `NullPointerException`. |
| **WARN** | Handled issues, degraded state. | `SafetyTriggered`, `CircuitBreakerOpen`. |
| **INFO** | Key lifecycle events. | `DecisionMade`, `PostProcessed`, `ServerStarted`. |
| **DEBUG** | Diagnostic details (verbose). | `Payload received`, `Signal score details`. |

### 2.3 Operational Decision Logging
Do **not** log the full decision object. Log the *event* of the decision.

```json
{
  "level": 30,
  "time": 1678888888888,
  "msg": "decision.complete",
  "requestId": "req_123abc",
  "decisionId": "dec_456def",
  "postId": "post_789ghi",
  "mode": "HELPFUL",
  "compositeScore": 0.89,
  "durationMs": 45
}
```

Full details are queried from the database using `decisionId`.

## 3. Decision Audit Trail (Storage)

The `decisions` table in PostgreSQL acts as the **Audit Log**.

*   **Source of Truth:** If it's not in the DB, it didn't officially happen.
*   **Schema:** Includes input signals (`signals_json`), output (`mode`, `archetype`), and metadata (`version`, `timestamp`).
*   **Immutability:** Decisions should not be updated after creation (except for manual review flags).

## 4. Request Tracing

### 4.1 Trace ID (`requestId`)
*   **Generation:** Generated at the API Edge (`request-trace` middleware) or Job Start (Queue Consumer).
*   **Format:** UUID or Cuid.
*   **Header:** `x-request-id`.

### 4.2 Propagation
All internal and external service calls **must** include the `requestId`.

*   **HTTP Clients:** Add `x-request-id` header.
*   **DB Queries:** (Optional) Add as comment `/* req_id: ... */` for slow query log analysis.
*   **Logger:** Included in `bindings` for every child logger.

## 5. Metrics & Monitoring

(Managed via `backend/src/observability/metrics-registry.ts`)

### Key Metrics for Story 2.8
*   `decision_count_total{mode="...", platform="..."}`: Volume tracking.
*   `decision_latency_seconds_bucket`: Performance distribution.
*   `signal_failure_total{signal="SSS|ARS..."}`: Reliability tracking.
*   `safety_trigger_total`: Compliance monitoring.