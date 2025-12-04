# 4. Service Architecture

## 4.1 Service Overview

Antone consists of four main services running as Docker containers:

| Service | Type | Port | Purpose |
|---------|------|------|---------|
| `backend-api` | HTTP Server | 3001 | REST API for dashboard and external integrations |
| `backend-worker` | Background Process | - | Stream monitoring, queue processing, learning loops |
| `dashboard` | Next.js App | 3000 | Web dashboard for human oversight |
| `postgres` | Database | 5432 | Primary data store |

## 4.2 Service Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Internal Network                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   dashboard  │ ──────► │  backend-api │                      │
│  │   (Next.js)  │  HTTP   │    (Hono)    │                      │
│  │   :3000      │         │   :3001      │                      │
│  └──────────────┘         └──────┬───────┘                      │
│         │                        │                               │
│         │                        │                               │
│         │                 ┌──────▼───────┐                      │
│         │                 │   postgres   │                      │
│         │                 │   :5432      │                      │
│         │                 └──────▲───────┘                      │
│         │                        │                               │
│         │                 ┌──────┴───────┐                      │
│         │                 │backend-worker│                      │
│         └────────────────►│  (Node.js)   │                      │
│              WebSocket    └──────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ Cloudflare Tunnel
                    ▼
            External Access
         (https://antone.yourdomain.com)
```

## 4.3 Backend Worker Architecture

The worker process handles multiple concurrent jobs:

```typescript
// backend/src/workers/index.ts

import { StreamMonitor } from './stream-monitor';
import { QueueProcessor } from './queue-processor';
import { FeedbackCollector } from './feedback-collector';
import { SelfCorrection } from './self-correction';
import { RelationshipUpdater } from './relationship-updater';
import { CommunityChampions } from '../analytics/community-champions';

export class WorkerManager {
  private streamMonitor: StreamMonitor;
  private queueProcessor: QueueProcessor;
  private feedbackCollector: FeedbackCollector;
  private selfCorrection: SelfCorrection;
  private relationshipUpdater: RelationshipUpdater;
  private championsTracker: CommunityChampions;

  async start(): Promise<void> {
    // Stream Monitor: Continuous platform polling
    // Twitter: every 5-15 min | Reddit: every 5-15 min | Threads: every 5-15 min
    this.streamMonitor.start();

    // Queue Processor: Process posts from queue every 30 seconds
    this.queueProcessor.start({ intervalMs: 30_000 });

    // Feedback Collector: Collect outcomes every 30 minutes
    this.feedbackCollector.start({ intervalMs: 30 * 60_000 });

    // Self-Correction: Monitor backlash every 15 minutes
    this.selfCorrection.start({ intervalMs: 15 * 60_000 });

    // Relationship Updater: Update author scores hourly
    this.relationshipUpdater.start({ intervalMs: 60 * 60_000 });

    // Champions Tracker: Identify champions daily
    this.championsTracker.start({ cronSchedule: '0 6 * * *' }); // 6 AM daily
  }
}
```

## 4.4 Request Flow: Post Detection to Reply

```
1. DETECTION (Stream Monitor Worker)
   │
   ├─► Twitter API polling (keyword search)
   ├─► Reddit API polling (subreddit + keyword)
   └─► Threads API polling (hashtag + keyword)
         │
         ▼
2. PRE-FILTERING (Tier 1 & 2)
   │
   ├─► Keyword taxonomy match (200+ terms)
   ├─► Spam filter (movie titles, crypto, brand accounts)
   └─► Duplicate detection
         │
         ▼
3. QUEUE (PostgreSQL posts table)
   │
   └─► Post stored with: content, author, platform, detected_at
         │
         ▼
4. ANALYSIS (Queue Processor)
   │
   ├─► Signal 1: Linguistic Intent → SSS (0.0-1.0)
   ├─► Signal 2: Author Context → ARS (0.0-1.0)
   ├─► Signal 3: Post Metrics → EVS (ratio)
   ├─► Signal 4: Semantic Topic → TRS (0.0-1.0)
   ├─► Safety Protocol Check
   ├─► Power User Detection
   ├─► Competitive Detection
   └─► Temporal Intelligence
         │
         ▼
5. DECISION (Decision Engine)
   │
   ├─► Calculate composite Decision Score
   ├─► Select Mode: Helpful | Engagement | Hybrid | Disengaged
   └─► Select Archetype (if engaging)
         │
         ▼
6. GENERATION (Reply Generator)
   │
   ├─► DeepSeek R1 API call
   ├─► Platform personality adaptation
   ├─► Compliance validation
   └─► Social proof integration
         │
         ▼
7. APPROVAL (if manual approval enabled)
   │
   └─► Queue for human review in dashboard
         │
         ▼
8. POSTING (Platform Poster)
   │
   ├─► Rate limit check
   ├─► Post to platform API
   └─► Store reply with UTM tracking
         │
         ▼
9. FEEDBACK (Learning Loop)
   │
   ├─► Collect metrics (likes, replies, clicks)
   ├─► Sentiment analysis of responses
   ├─► Update relationship memory
   └─► Feed into A/B testing framework
```

---
