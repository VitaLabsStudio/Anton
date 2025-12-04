# 8. Frontend Architecture

## 8.1 Dashboard Overview

The Next.js dashboard provides a 10-view master interface for human oversight:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ANTONE DASHBOARD                            │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  SIDEBAR     │              MAIN CONTENT AREA                   │
│              │                                                   │
│  🎯 Mission  │  ┌─────────────────────────────────────────────┐ │
│     Control  │  │                                             │ │
│              │  │     View-specific content                   │ │
│  🔍 Filtering│  │                                             │ │
│              │  │     - Charts & metrics                      │ │
│  💰 Revenue  │  │     - Data tables                           │ │
│              │  │     - Action buttons                        │ │
│  👥 Customers│  │     - Real-time updates                     │ │
│              │  │                                             │ │
│  📊 KPIs     │  └─────────────────────────────────────────────┘ │
│              │                                                   │
│  ✍️ Content  │  ┌─────────────────────────────────────────────┐ │
│              │  │           APPROVAL QUEUE BADGE              │ │
│  🧪 A/B Tests│  │           (if pending items)                │ │
│              │  └─────────────────────────────────────────────┘ │
│  ⚙️ Health   │                                                   │
│              │                                                   │
│  🏆 Compete  │                                                   │
│              │                                                   │
│  💎 Advocacy │                                                   │
│              │                                                   │
├──────────────┴──────────────────────────────────────────────────┤
│                    ALERT BANNER (if active alerts)               │
└─────────────────────────────────────────────────────────────────┘
```

## 8.2 Component Architecture

```typescript
// dashboard/src/app/layout.tsx

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AlertBanner } from '@/components/layout/AlertBanner';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <WebSocketProvider>
            <div className="flex h-screen bg-gray-50">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <AlertBanner />
                <main className="flex-1 overflow-y-auto p-6">
                  {children}
                </main>
              </div>
            </div>
          </WebSocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

## 8.3 State Management

```typescript
// dashboard/src/hooks/useKPIs.ts

import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { api } from '@/lib/api';

export function useKPIs(options?: { type?: string; dateRange?: DateRange }) {
  const { subscribe } = useWebSocket();

  const query = useQuery({
    queryKey: ['kpis', options],
    queryFn: () => api.get('/analytics/kpis', { params: options }),
    refetchInterval: 60_000, // Refetch every minute
  });

  // Real-time updates via WebSocket
  useEffect(() => {
    const unsubscribe = subscribe('kpi:updated', (data) => {
      query.refetch();
    });
    return unsubscribe;
  }, [subscribe, query]);

  return query;
}
```

## 8.4 User Flow Diagrams

### Flow 1: Manual Approval Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                     MANUAL APPROVAL FLOW                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. POST DETECTED                                                   │
│     ├─► Stream Monitor detects post matching keywords              │
│     └─► Post queued in PostgreSQL                                  │
│           │                                                         │
│           ▼                                                         │
│  2. ANALYSIS COMPLETE                                               │
│     ├─► Queue Processor analyzes post (4 signals)                  │
│     ├─► Decision made: Mode + Archetype selected                   │
│     └─► Reply generated with DeepSeek R1                           │
│           │                                                         │
│           ▼                                                         │
│  3. DASHBOARD ALERT                                                 │
│     ├─► Approval Queue badge updates (+1 pending)                  │
│     ├─► Real-time WebSocket notification to dashboard              │
│     └─► PM sees alert in Mission Control view                      │
│           │                                                         │
│           ▼                                                         │
│  4. HUMAN REVIEW                                                    │
│     ├─► PM navigates to Approvals view                             │
│     ├─► Sees split screen: Original post (left) | Generated reply (right) │
│     ├─► Reviews "Why this reply?" explanation                      │
│     └─► Checks predicted KPI impact                                │
│           │                                                         │
│           ▼                                                         │
│  5. DECISION OPTIONS                                                │
│     ├─► APPROVE → Goes to step 6                                   │
│     ├─► EDIT → Inline editor → Modified content → Step 6           │
│     ├─► REJECT → Reply discarded, feedback logged                  │
│     └─► REGENERATE → New DeepSeek call with instructions → Step 4  │
│           │                                                         │
│           ▼                                                         │
│  6. POSTING                                                         │
│     ├─► Rate limit check                                           │
│     ├─► Platform API call (Twitter/Reddit/Threads)                 │
│     ├─► Success: Reply posted with UTM tracking                    │
│     └─► Failure: Error message shown, retry option                 │
│           │                                                         │
│           ▼                                                         │
│  7. CONFIRMATION                                                    │
│     ├─► Dashboard shows "Posted successfully"                      │
│     ├─► Approval queue badge updates (-1 pending)                  │
│     ├─► Reply appears in Activity Feed with metrics                │
│     └─► PM can monitor reply performance in real-time              │
│                                                                     │
│  EDGE CASES HANDLED:                                                │
│  • Post deleted before posting → "Post no longer available" error  │
│  • API timeout during posting → Retry 3x, then queue for manual    │
│  • Multiple operators approving same reply → Lock + conflict alert │
│  • User blocks bot during approval → "User blocked" notification   │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Flow 2: KPI Investigation & Drill-Down

```
┌────────────────────────────────────────────────────────────────────┐
│                 KPI INVESTIGATION FLOW                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. ALERT TRIGGERED                                                 │
│     ├─► Automated alert: "CTR dropped below 1.5%"                  │
│     ├─► Email + Slack notification sent                            │
│     └─► Dashboard Alert Banner displays warning                    │
│           │                                                         │
│           ▼                                                         │
│  2. MISSION CONTROL REVIEW                                          │
│     ├─► PM opens dashboard (View 1: Mission Control)               │
│     ├─► Sees CTR metric card highlighted in red                    │
│     ├─► Clicks metric card for details                             │
│     └─► Navigates to Revenue Attribution view (View 3)             │
│           │                                                         │
│           ▼                                                         │
│  3. DRILL-DOWN ANALYSIS                                             │
│     ├─► View 3: Revenue Attribution                                │
│     │   ├─► Conversion funnel: Impression→Reply→Click→Convert     │
│     │   ├─► Identifies drop-off at "Reply→Click" stage             │
│     │   └─► Clicks "View by Archetype" breakdown                   │
│     │                                                               │
│     ├─► View 6: Content Quality                                    │
│     │   ├─► Sees "Checklist" archetype underperforming            │
│     │   ├─► Compares to "Confident Recommender" (higher CTR)      │
│     │   └─► Identifies pattern: Checklist too long for Twitter    │
│     │                                                               │
│     └─► Clicks specific reply ID to see full decision audit        │
│           │                                                         │
│           ▼                                                         │
│  4. DECISION AUDIT                                                  │
│     ├─► GET /api/v1/decisions/:id with full signal breakdown       │
│     ├─► Reviews: SSS=0.91, Mode=HELPFUL, Archetype=CHECKLIST       │
│     ├─► Sees original post content + author context                │
│     ├─► Reviews generated reply content                            │
│     └─► Checks outcome metrics: 0 clicks in 24 hours               │
│           │                                                         │
│           ▼                                                         │
│  5. CORRECTIVE ACTION                                               │
│     ├─► Navigate to A/B Testing Lab (View 7)                       │
│     ├─► Create experiment: "Short Checklist vs Current"            │
│     ├─► Define variants: Variant A (current), Variant B (50% shorter) │
│     ├─► Set metric: CTR, Duration: 7 days, Traffic: 50/50          │
│     └─► Start experiment                                           │
│           │                                                         │
│           ▼                                                         │
│  6. MONITORING                                                      │
│     ├─► Return to View 7 daily to check statistical significance   │
│     ├─► After 7 days: Variant B wins (CTR 2.3% vs 1.4%)           │
│     └─► Click "Promote Winner" → System auto-adjusts weights       │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Flow 3: Safety Escalation & Resolution

```
┌────────────────────────────────────────────────────────────────────┐
│                   SAFETY ESCALATION FLOW                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. SAFETY FLAG TRIGGERED                                           │
│     ├─► Post detected: "I want to die from this hangover"          │
│     ├─► Signal 1 runs → SSS = 0.78 (high solution-seeking)         │
│     ├─► Safety Protocol detects: "die" keyword                     │
│     └─► Distress Probability calculated: 0.62 (>0.45 threshold)    │
│           │                                                         │
│           ▼                                                         │
│  2. AUTOMATIC ESCALATION                                            │
│     ├─► Mode forced to: DISENGAGED                                 │
│     ├─► Escalation record created in database                      │
│     │   - Reason: SAFETY_AMBIGUITY                                 │
│     │   - Priority: CRITICAL                                       │
│     │   - Status: PENDING                                          │
│     └─► Alert sent: SMS + Email immediately                        │
│           │                                                         │
│           ▼                                                         │
│  3. HUMAN NOTIFICATION                                              │
│     ├─► PM receives SMS: "CRITICAL: Safety escalation pending"     │
│     ├─► Dashboard Alert Banner shows: "1 Critical Escalation"      │
│     └─► Escalation Queue badge updates                             │
│           │                                                         │
│           ▼                                                         │
│  4. MODERATOR REVIEW                                                │
│     ├─► PM navigates to Escalations Queue                          │
│     ├─► Sees escalation card with:                                 │
│     │   - Original post content highlighted                        │
│     │   - Safety flags: ["DEATH_MENTION"]                          │
│     │   - Distress Probability: 0.62                               │
│     │   - System decision: DISENGAGED                              │
│     └─► PM evaluates context                                       │
│           │                                                         │
│           ▼                                                         │
│  5. RESOLUTION OPTIONS                                              │
│     ├─► APPROVE DISENGAGEMENT                                       │
│     │   └─► Mark as resolved, note: "Correct - hyperbole but      │
│     │       safety-first approach appropriate"                     │
│     │                                                               │
│     ├─► OVERRIDE & ENGAGE (rare)                                   │
│     │   └─► PM manually creates gentle, empathetic reply           │
│     │       (if confident it's hyperbole, not crisis)              │
│     │                                                               │
│     ├─► FLAG FOR LEGAL REVIEW                                      │
│     │   └─► Escalate to legal team for policy guidance             │
│     │                                                               │
│     └─► UPDATE SAFETY PROTOCOL                                     │
│         └─► Add pattern to safety database if recurring            │
│           │                                                         │
│           ▼                                                         │
│  6. LEARNING FEEDBACK                                               │
│     ├─► Resolution notes logged in escalations table               │
│     ├─► If pattern recurring: Update safety-protocol.ts            │
│     └─► Future posts with pattern: Automatic handling per decision │
│                                                                     │
│  EDGE CASES HANDLED:                                                │
│  • SLA breach (>4 hours unresolved) → Escalate to manager          │
│  • Similar escalation within 1 hour → Pattern alert triggered      │
│  • PM unavailable → Assign to backup moderator automatically       │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Flow 4: Error State Handling

```
┌────────────────────────────────────────────────────────────────────┐
│                     ERROR STATE HANDLING                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SCENARIO A: API Timeout During Approval                            │
│  ├─► PM clicks "Approve" on reply                                  │
│  ├─► Backend calls Platform API → Timeout after 10s                │
│  ├─► Circuit breaker opens for platform                            │
│  ├─► Dashboard shows: "Twitter temporarily unavailable"            │
│  ├─► Reply remains in queue with status: RETRY_PENDING             │
│  ├─► Background worker retries every 5 minutes                     │
│  └─► Success on retry 3 → Reply posts → Dashboard notified         │
│                                                                     │
│  SCENARIO B: Post Deleted Before Reply Posts                        │
│  ├─► Reply approved and queued for posting                         │
│  ├─► Platform API returns: 404 Not Found (post deleted)            │
│  ├─► System logs: "Post abc123 deleted, reply aborted"             │
│  ├─► Dashboard shows: "Reply not posted - original post deleted"   │
│  ├─► Reply status: CANCELLED                                       │
│  └─► No retry attempted (graceful failure)                         │
│                                                                     │
│  SCENARIO C: Multiple Operators Simultaneous Approval               │
│  ├─► Operator A and B both review same reply                       │
│  ├─► Operator A clicks "Approve" at 10:00:00                       │
│  ├─► Operator B clicks "Approve" at 10:00:03                       │
│  ├─► Database optimistic locking detects conflict                  │
│  ├─► Operator A's approval succeeds, reply posts                   │
│  ├─► Operator B sees: "This reply was already approved by [A]"     │
│  └─► WebSocket sync updates both screens                           │
│                                                                     │
│  SCENARIO D: User Blocks Bot During Approval Window                 │
│  ├─► Reply pending approval for @user123                           │
│  ├─► User blocks @antone_vita on Twitter                           │
│  ├─► PM approves reply                                             │
│  ├─► Platform API returns: 403 Forbidden (user blocked)            │
│  ├─► System updates author: blocked=true, relationship_score=-0.30 │
│  ├─► Dashboard shows: "User blocked - reply not posted"            │
│  ├─► Future posts from @user123 → Auto-disengage                   │
│  └─► Author added to permanent blocklist                           │
│                                                                     │
│  SCENARIO E: Compliance Violation Detected Post-Approval            │
│  ├─► Reply approved by PM (human oversight missed violation)       │
│  ├─► Pre-posting compliance check runs                             │
│  ├─► Detects prohibited term: "clinically proven"                  │
│  ├─► Posting blocked automatically                                 │
│  ├─► Dashboard alert: "Compliance violation prevented"             │
│  ├─► Reply status: COMPLIANCE_REJECTED                             │
│  └─► PM notified to regenerate with compliant language             │
│                                                                     │
│  SCENARIO F: Database Connection Lost                               │
│  ├─► Worker processing posts → Database connection drops           │
│  ├─► Circuit breaker opens after 5 failures                        │
│  ├─► Workers pause processing, enter degraded mode                 │
│  ├─► Dashboard Health view shows: Database UNHEALTHY               │
│  ├─► Alert: "CRITICAL: Database unreachable"                       │
│  ├─► Circuit breaker retries connection every 30s                  │
│  └─► Connection restored → Workers resume automatically            │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## 8.5 Dashboard Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial dashboard load | <2s | Time to first contentful paint |
| View navigation | <500ms | Route transition time |
| Real-time WebSocket updates | <500ms | Server event → UI update latency |
| API response time | <200ms | p95 for dashboard queries |
| Chart rendering | <1s | Complex visualizations (10k data points) |
| Approval action feedback | <300ms | Button click → visual confirmation |

## 8.6 Accessibility Standards

While an internal tool, the dashboard follows basic accessibility practices:

- **Keyboard Navigation**: All actions accessible via keyboard shortcuts
- **Screen Reader Labels**: Proper ARIA labels on interactive elements  
- **Color Contrast**: WCAG AA compliance for text readability
- **Focus Indicators**: Clear visual focus states for keyboard users
- **Error Messages**: Descriptive, actionable error text (not just "Error")

## 8.7 Key Dashboard Views

### View 1: Mission Control

```typescript
// dashboard/src/app/page.tsx (Mission Control)

export default function MissionControl() {
  const { data: kpis } = useKPIs();
  const { data: activity } = useActivityFeed();
  const { data: alerts } = useAlerts();

  return (
    <div className="space-y-6">
      {/* Hero Metrics Row */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard 
          title="Posts Scanned (24h)" 
          value={kpis?.scanned} 
          trend={kpis?.scannedTrend} 
        />
        <MetricCard 
          title="Replies Posted" 
          value={kpis?.replies} 
          trend={kpis?.repliesTrend} 
        />
        <MetricCard 
          title="CTR" 
          value={`${kpis?.ctr}%`} 
          target={2.0}
          trend={kpis?.ctrTrend} 
        />
        <MetricCard 
          title="Revenue (24h)" 
          value={`$${kpis?.revenue}`} 
          trend={kpis?.revenueTrend} 
        />
        <MetricCard 
          title="Safety Score" 
          value={kpis?.safetyScore} 
          status={kpis?.safetyScore > 95 ? 'healthy' : 'warning'}
        />
      </div>

      {/* Activity Feed + Alerts */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ActivityFeed items={activity} />
        </div>
        <div>
          <AlertsWidget alerts={alerts} />
          <ApprovalQueueWidget />
        </div>
      </div>
    </div>
  );
}
```

### Approval Interface

```typescript
// dashboard/src/app/approvals/page.tsx

export default function ApprovalQueue() {
  const { data: pending } = usePendingApprovals();
  const approveMutation = useApproveMutation();
  const rejectMutation = useRejectMutation();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manual Approval Queue</h1>
        <Button 
          onClick={() => approveMutation.mutate({ 
            ids: pending?.filter(r => r.confidence > 0.9).map(r => r.id) 
          })}
        >
          Approve All High-Confidence
        </Button>
      </div>

      {pending?.map((reply) => (
        <ApprovalCard
          key={reply.id}
          reply={reply}
          post={reply.decision.post}
          author={reply.decision.post.author}
          onApprove={(edited) => approveMutation.mutate({ 
            id: reply.id, 
            editedContent: edited 
          })}
          onReject={(reason) => rejectMutation.mutate({ 
            id: reply.id, 
            reason 
          })}
          onRegenerate={() => {/* ... */}}
        />
      ))}
    </div>
  );
}
```

---
