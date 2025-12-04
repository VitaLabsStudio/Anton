# 6. API Specifications

## 6.1 API Overview

The backend exposes a RESTful API for the dashboard and potential external integrations.

**Base URL**: `http://localhost:3001/api/v1`

**Authentication**: Bearer token (JWT) for dashboard access

## 6.2 Core Endpoints

### Health & Status

```yaml
GET /health
  Description: System health check
  Response:
    status: "healthy" | "degraded" | "unhealthy"
    components:
      database: { status, latencyMs }
      twitter: { status, authValid }
      reddit: { status, authValid, karma }
      threads: { status, authValid }
      worker: { status, lastPollAt, queueDepth }
    uptime: number
    version: string

GET /health/detailed
  Description: Detailed component status
  Auth: Required
  Response: Extended health metrics
```

### Posts & Queue

```yaml
GET /posts
  Description: List posts in queue
  Query Params:
    platform?: "TWITTER" | "REDDIT" | "THREADS"
    processed?: boolean
    limit?: number (default: 50, max: 200)
    offset?: number
  Response:
    posts: Post[]
    total: number
    hasMore: boolean

GET /posts/:id
  Description: Get single post with full details
  Response:
    post: Post
    author: Author
    decisions: Decision[]
```

### Decisions

```yaml
GET /decisions
  Description: List decisions with filtering
  Query Params:
    mode?: OperationalMode
    minScore?: number
    maxScore?: number
    platform?: Platform
    startDate?: ISO8601
    endDate?: ISO8601
    limit?: number
    offset?: number
  Response:
    decisions: Decision[]
    total: number

GET /decisions/:id
  Description: Get decision with full signal breakdown
  Response:
    decision: Decision
    post: Post
    author: Author
    signals: {
      linguistic: SignalDetails
      author: SignalDetails
      velocity: SignalDetails
      semantic: SignalDetails
    }
    replies: Reply[]
```

### Replies & Approvals

```yaml
GET /replies
  Description: List replies
  Query Params:
    approvalStatus?: ApprovalStatus
    platform?: Platform
    archetype?: Archetype
    startDate?: ISO8601
    endDate?: ISO8601
    limit?: number
  Response:
    replies: Reply[]
    total: number

GET /replies/pending
  Description: Get pending approval queue
  Response:
    replies: ReplyWithContext[]
    count: number

POST /replies/:id/approve
  Description: Approve a reply for posting
  Body:
    editedContent?: string (optional edit before approval)
  Response:
    reply: Reply
    posted: boolean

POST /replies/:id/reject
  Description: Reject a reply
  Body:
    reason: "SAFETY" | "IRRELEVANT" | "LOW_QUALITY" | "OTHER"
    notes?: string
  Response:
    success: boolean

POST /replies/:id/regenerate
  Description: Request new reply generation
  Body:
    instructions?: string
  Response:
    newReply: Reply
```

### Analytics & KPIs

```yaml
GET /analytics/kpis
  Description: Get KPI summary
  Query Params:
    type?: "COMMERCIAL" | "LOVE" | "SAFETY"
    startDate?: ISO8601
    endDate?: ISO8601
    granularity?: "HOUR" | "DAY" | "WEEK"
  Response:
    commercial: {
      ctr: number
      conversionRate: number
      revenuePerReply: number
      trend: number
    }
    love: {
      thanksLikesRate: number
      followsPerHundred: number
      positiveSentiment: number
      trend: number
    }
    safety: {
      removalRate: number
      platformStrikes: number
      karmaTrajectory: number
      selfDeletionRate: number
    }

GET /analytics/filtering-funnel
  Description: Get filtering funnel metrics
  Query Params:
    platform?: Platform
    startDate?: ISO8601
    endDate?: ISO8601
  Response:
    scanned: number
    keywordMatched: number
    spamFiltered: number
    queued: number
    analyzed: number
    engaged: number
    conversionRate: number
    keywordPerformance: KeywordMetric[]

GET /analytics/revenue
  Description: Revenue attribution data
  Query Params:
    startDate?: ISO8601
    endDate?: ISO8601
  Response:
    totalRevenue: number
    byArchetype: { archetype: string, revenue: number }[]
    byPlatform: { platform: string, revenue: number }[]
    topReplies: ReplyWithRevenue[]
```

### Competitive Intelligence

```yaml
GET /competitive/share-of-voice
  Description: Market share metrics
  Query Params:
    startDate?: ISO8601
    endDate?: ISO8601
  Response:
    vita: { mentions: number, sentiment: number }
    competitors: {
      name: string
      mentions: number
      sentiment: number
      trend: number
    }[]

GET /competitive/mentions
  Description: Competitor mention feed
  Query Params:
    competitorId?: string
    sentiment?: Sentiment
    satisfaction?: UserSatisfaction
    replied?: boolean
    limit?: number
  Response:
    mentions: CompetitiveMention[]
    total: number

GET /competitive/gaps
  Description: Product gap analysis
  Response:
    topComplaints: { category: string, count: number }[]
    unmetNeeds: string[]
    opportunities: string[]
```

### Experiments

```yaml
GET /experiments
  Description: List A/B tests
  Query Params:
    status?: ExperimentStatus
  Response:
    experiments: Experiment[]

POST /experiments
  Description: Create new experiment
  Body:
    name: string
    description?: string
    variantA: ExperimentConfig
    variantB: ExperimentConfig
    metric: string
    trafficSplit?: number
  Response:
    experiment: Experiment

PUT /experiments/:id/start
  Description: Start an experiment
  Response:
    experiment: Experiment

PUT /experiments/:id/stop
  Description: Stop an experiment
  Response:
    experiment: Experiment
    results: ExperimentResults
```

### Export

```yaml
GET /export/llm-bundle
  Description: Export data for LLM analysis
  Response: (Downloads ZIP file)
    - antone_performance_data.json
    - analysis_prompt.md
```

## 6.3 WebSocket Events

The dashboard connects via WebSocket for real-time updates:

```typescript
// Connection
ws://localhost:3001/ws

// Events (Server → Client)
{
  event: "post:detected",
  data: { post: Post, keywords: string[] }
}

{
  event: "decision:made",
  data: { decision: Decision, mode: string }
}

{
  event: "reply:generated",
  data: { reply: Reply, needsApproval: boolean }
}

{
  event: "reply:posted",
  data: { reply: Reply, metrics: Metrics }
}

{
  event: "alert:triggered",
  data: { type: string, severity: string, message: string }
}

{
  event: "kpi:updated",
  data: { type: string, metric: string, value: number }
}
```

---
