# Epic 4: Learning Loop & Optimization

**Epic Goal**: Build an autonomous learning system with advanced statistical methods, causal inference, and adaptive optimization that tracks Commercial, Love, and Safety KPIs, identifies Community Champions (3+ positive engagements), implements Thompson Sampling for rapid A/B testing, uses platform-specific segmentation, and surfaces actionable insights in a comprehensive 10-view master dashboard. This epic delivers a statistically rigorous learning system that eliminates false positives (reducing from 30-40% to <12%), accelerates convergence (from 8-12 weeks to 3-4 weeks), and enables true causal understanding while building advocate relationships. Deliverable: Bot continuously improves based on real signal (not noise), runs adaptive experiments, identifies advocates, and self-optimizes with scientific rigor—transparent human oversight via master dashboard.

## Story 4.1: Commercial KPI Tracking

**As a** product manager,  
**I want** to track Commercial KPIs (CTR, conversions, revenue) for all posted replies,  
**so that** I can measure the bot's commercial effectiveness and ROI.

**Acceptance Criteria:**

1. KPI tracking service at `@backend/analytics/commercial-kpis.ts`
2. UTM-tagged links generated for all product mentions: `?utm_source=antone&utm_campaign={platform}&utm_content={reply_id}`
3. Google Analytics integration to track:
   - Reply-level CTR (clicks per reply)
   - Landing page dwell time (session duration)
   - Add-to-cart events
   - Conversion events (purchases)
4. E-commerce platform webhook integration (Shopify/WooCommerce) for transaction data
5. Revenue attribution: Link transactions to reply_id via UTM parameters (7-day window)
6. KPIs calculated and stored in `kpi_metrics` table daily
7. Dashboard displays: CTR trends, conversion funnel, revenue per reply, top-performing replies
8. Target thresholds flagged: CTR <2%, conversion <8%, RPR <$0.50 trigger alerts
9. Integration test: Simulate click-through and purchase, verify attribution

---

## Story 4.2: Love KPI Tracking

**As a** product manager,  
**I want** to track Love KPIs (thanks, likes, follows, sentiment) for all interactions,  
**so that** I can ensure the bot builds a trusted, beloved brand personality.

**Acceptance Criteria:**

1. Love KPI service at `@backend/analytics/love-kpis.ts`
2. Platform APIs polled hourly for reply engagement data:
   - Likes, hearts, upvotes per reply
   - Text responses analyzed for "thanks", "helpful", positive sentiment
   - New followers correlated to reply timestamps
3. Sentiment analysis using OpenAI: Classify responses as positive (>0.6), neutral (0.4-0.6), negative (<0.4)
4. Leading indicators tracked (first 60 minutes post-reply):
   - Positive React Velocity (>60% positive reactions)
   - OP Response Latency (<20 min)
   - Quote-to-Like Ratio (>0.4 positive quotes)
5. Love KPIs calculated: Thanks/Likes %, Follows per 100 replies, Positive sentiment %
6. Dashboard displays: Sentiment trends, most-loved replies, follower growth
7. Target thresholds flagged: Thanks/Likes <12%, Sentiment <75%, Follows <3 per 100
8. Creator reposts manually logged (auto-detection future enhancement)
9. Integration test: Simulate positive engagement, verify KPI updates

---

## Story 4.3: Safety KPI Tracking

**As a** compliance officer,  
**I want** to track Safety KPIs (removals, reports, strikes) across all platforms,  
**so that** I can detect reputation risks early and maintain platform compliance.

**Acceptance Criteria:**

1. Safety KPI service at `@backend/analytics/safety-kpis.ts`
2. Platform APIs monitored for negative signals:
   - Reddit: Comment removals, downvote ratios, mod warnings
   - Twitter: Reports, restricted reach indicators
   - Threads: Content violations, reduced distribution
3. Community baseline calculated: Average removal/report rate for each subreddit/topic
4. Antone's removal rate compared to baseline (target: <1.0× baseline)
5. Reddit karma trajectory tracked (target: +50/month)
6. Platform strikes logged with severity (warning, restriction, suspension)
7. Self-deletion events tracked (target: <2% of product-mention replies)
8. Dashboard displays: Safety alerts, removal trends, karma graph, strike history
9. Critical alerts: ANY platform strike triggers immediate notification
10. Integration test: Simulate removal event, verify alert triggered

---

## Story 4.4: Feedback Collection Pipeline

**As a** the learning system,  
**I want** to collect comprehensive outcome data for every posted reply,  
**so that** I can correlate decisions, messages, and results for learning.

**Acceptance Criteria:**

1. Feedback collector at `@backend/analytics/feedback-collector.ts`
2. Service runs every 30 minutes, enriches `replies` table with outcome data:
   - Platform metrics (likes, replies, shares)
   - Sentiment analysis results
   - Commercial outcomes (clicks, conversions)
   - Safety signals (removals, reports)
3. Timeline data captured: 15min, 60min, 24hr, 7day windows
4. Feedback stored in `replies.metrics_json` for historical analysis
5. Data schema: `{likes: 12, sentiment: 0.82, ctr: 0.03, removed: false}`
6. Correlation table created: Links decision scores → message archetype → outcomes
7. Missing data handled gracefully (platform API failures don't block collection)
8. Dashboard query endpoint `/api/feedback/{reply_id}` returns full timeline
9. Integration test: Post reply, collect feedback after 30min, verify data complete

---

## Story 4.5: Thompson Sampling A/B Testing Framework (Priority 2)

**As a** the learning system,  
**I want** to run adaptive A/B tests using Thompson Sampling (multi-armed bandit),  
**so that** I discover which strategies perform best 2-3x faster while minimizing traffic waste on losing variants.

**Acceptance Criteria:**

1. Thompson Sampling engine at `@backend/learning/thompson-sampling.ts`
2. **Multi-Armed Bandit Implementation**:
   - Beta distribution tracking: `Beta(successes + 1, failures + 1)` for each variant
   - Dynamic traffic allocation based on real-time performance
   - Probability calculation: P(A > B) via Monte Carlo simulation (10,000 draws)
   - Winner declaration when P(A > B) > 95% confidence threshold
3. **Experiment Definition Structure**:
   - `experiment_id`, `variant_a`, `variant_b`, `metric` (ctr, sentiment, etc.)
   - Starting split: 50/50, then dynamically adjusts based on performance
   - Minimum samples per variant: 50 (then can declare winner)
   - Guardrails: No prohibited terms, no safety protocol changes
4. **Adaptive Traffic Allocation**:
   - If Variant A winning: Shifts to 70/30, then 85/15, then 95/5 as confidence grows
   - If results ambiguous: Maintains 50/50 split for exploration
   - Real-time adjustment every 100 decisions
5. **Convergence Speed**:
   - Target: 5-7 days to conclusion (vs 14 days fixed split)
   - Stop early if winner clear (saves testing time)
   - Continue if results close (ensures statistical rigor)
6. **Results Reporting**:
   - Mean performance for each variant with credible intervals
   - Effect size (Cohen's d) and practical significance assessment
   - Traffic allocation history visualization
   - Regret calculation: "Wasted" traffic on inferior variant
7. Experiment catalog: Test empathy openers, CTA phrasing, archetype rotation frequency
8. Forbidden experiments hard-coded (profanity, unsubstantiated claims, targeting changes)
9. Dashboard displays: Active experiments with real-time confidence, results archive, winning variant performance
10. Unit tests validate Beta distribution sampling and probability calculations
11. Integration test: Simulate 1,000 decisions with 5% vs 3% CTR, verify correct winner selected

---

## Story 4.6: Advanced Weight Optimization with Statistical Safeguards (Priorities 1-3)

**As a** the learning system,  
**I want** to adjust signal weights and archetype preferences using statistically rigorous methods that eliminate false positives and enable causal understanding,  
**so that** the bot continuously improves based on real signal rather than noise.

**Acceptance Criteria:**

### Priority 1: Critical Improvements (Week 1)

1. **Minimum Sample Size Validation** (`@backend/learning/weight-optimizer.ts`):
   - Validate sample sizes before any weight adjustment:
     - Signal weights: Require 100+ decisions per signal range
     - Archetype comparison: Require 50+ replies per archetype
     - Keyword optimization: Require 30+ posts per keyword
     - Platform segmentation: Require 75+ decisions per platform
   - Skip weight adjustment if <3 out of 4 signal segments have sufficient data
   - Log skip events to `weight_adjustment_logs` table with reason
   - Dashboard shows "Waiting for sufficient data" with ETA estimate
   - Integration test: Seed 80 decisions, verify weight adjustment skipped

2. **Robust Statistics Module** (`@backend/utils/robust-statistics.ts`):
   - Implement Winsorized mean (cap values at 5th/95th percentiles)
   - Implement Tukey's outlier detection (1.5× IQR method)
   - Implement trimmed mean (remove top/bottom 10%)
   - Replace ALL arithmetic means with Winsorized mean in learning operations
   - Detect and flag outliers for logging (don't remove, but down-weight)
   - Unit tests: Validate [0.02, 0.03, 0.02, 0.85, 0.03] → Winsorized mean ≈0.03 (not 0.19)
   - Integration test: Seed data with 1 viral post, verify archetype performance not skewed

3. **Statistical Inference Module** (`@backend/utils/statistical-inference.ts`):
   - Calculate 95% confidence intervals for all performance metrics
   - Compute Cohen's d effect size for all comparisons
   - Report t-test results with both p-value and effect size
   - Reject improvements if p < 0.05 BUT effect size < 0.2 (negligible)
   - Dashboard displays: "CTR improved +23% (±5%), Cohen's d = 0.67 (medium effect)"
   - Unit tests: Validate confidence interval calculation accuracy
   - Integration test: Compare two archetypes, verify both CI and effect size reported

### Priority 2: High-Impact Enhancements (Weeks 2-3)

4. **Platform & Temporal Segmentation** (`@backend/learning/segmented-optimizer.ts`):
   - Segment data by:
     - Platform (TWITTER, REDDIT, THREADS)
     - Time of day (MORNING 6-12, AFTERNOON 12-18, EVENING 18-24, NIGHT 0-6)
     - Day of week (WEEKDAY, WEEKEND)
     - Combined (e.g., "TWITTER_MORNING", "REDDIT_WEEKEND")
   - Store segment-specific weights in `segmented_weights` table
   - Optimize each segment independently if sufficient data (50+ decisions)
   - Fall back to platform weights if combined segment has insufficient data
   - Fall back to global weights if platform segment has insufficient data
   - Discovery insights: "Reddit prefers detailed educational content (+0.15 SSS weight)"
   - Dashboard shows performance by segment with heatmap visualization
   - Integration test: Seed Twitter data (high EVS preferred) vs Reddit (high SSS preferred), verify different optimal weights

5. **Adaptive Learning Rates** (same file):
   - Base rate: ±10% per week
   - Adjust based on:
     - Sample size: More data → Multiply by √(actual/min), max 2.0×
     - Consistency: Same direction 3+ weeks → Multiply by 1.5×
     - Volatility: High variance (>0.3) → Multiply by 0.5×
     - Effect size: Large effect (>0.20) → Multiply by 1.3×
   - Final rate capped at 5-30% range
   - Example: 200 samples + consistent trend + large effect = 10% × 1.4 × 1.5 × 1.3 = 27.3% change
   - Log learning rate calculation to `weight_adjustment_logs.details_json`
   - Integration test: Simulate high-confidence scenario, verify >10% adjustment; volatile scenario verify <10%

### Priority 3: Advanced Capabilities (Weeks 4-8)

6. **Causal Inference via Randomization** (`@backend/learning/causal-inference.ts`):
   - Randomize 10% of decisions:
     - Store predicted mode before randomization
     - Choose random mode (HELPFUL, ENGAGEMENT, HYBRID)
     - Mark decision with `is_randomized_experiment = true`
     - Store in `randomized_experiments` table
   - Weekly analysis (after 200+ randomized decisions):
     - Compare predicted outcome vs actual outcome
     - Test if signal is truly causal: `|actual_effect - predicted_effect| < 0.05`
     - Flag spurious correlations: "ARS appears non-causal (confounded by author profession)"
   - Dashboard shows: "Signals validated as causal: SSS ✓, ARS ✗ (confounder detected), EVS ✓, TRS ✓"
   - Integration test: Simulate confounder scenario, verify detection

7. **Meta-Learning Tracker** (`@backend/learning/meta-learner.ts`):
   - After each weight adjustment:
     - Record predicted improvement (e.g., "+15% CTR expected")
     - Store baseline performance
     - Create entry in `learning_events` table
   - One week later:
     - Measure actual improvement
     - Calculate accuracy: `1 - |actual - predicted|`
     - Update `learning_events.accuracy`
   - Weekly meta-learning report:
     - Overall learning accuracy (target: >85%)
     - Recommendation: "Increase min sample size" if accuracy <70%
     - Recommendation: "Reduce learning rate" if more failures than successes
   - Auto-tune parameters (with human approval initially):
     - If accuracy <70% for 3 weeks → Increase min sample size by 50%
     - If >50% adjustments hurt performance → Reduce base learning rate to 5%
   - Dashboard shows: "Learning accuracy this month: 87% (on track)"
   - Integration test: Record adjustment, simulate outcome, verify accuracy calculation

8. **Ensemble Methods** (optional enhancement):
   - Combine multiple optimization approaches:
     - Grid search optimizer
     - Bayesian optimizer
     - Current weight-based optimizer
   - 80/20 train/validation split
   - Average top 2 methods' recommendations
   - Cross-validation to prevent overfitting

### General Requirements

9. Weight changes capped at final learning rate (5-30% per week after all multipliers)
10. All weight changes logged to `weight_adjustment_logs` with full reasoning
11. Dashboard displays: Signal weight evolution graph, archetype performance table, learning health metrics
12. Manual override available: PM can lock weights if desired
13. Unit tests validate:
    - Sample size validation logic
    - Robust statistics calculations
    - Confidence interval accuracy
    - Adaptive learning rate multipliers
    - Causal inference detection
14. Integration tests validate:
    - False positive reduction (seed noisy data, verify no premature adjustments)
    - Outlier resistance (seed viral post, verify minimal impact)
    - Segmentation discovery (seed platform-specific patterns, verify detection)
    - Meta-learning tracking (record → measure → validate accuracy)

---

## Story 4.7: Algorithm Modeling & Drift Detection

**As a** the learning system,  
**I want** to detect platform algorithm changes by monitoring impression/ranking shifts,  
**so that** I can adapt strategies when platforms change their rules.

**Acceptance Criteria:**

1. Algorithm monitor at `@backend/learning/algorithm-monitor.ts`
2. Baseline performance calculated for each platform (impressions, reply ranking)
3. Weekly comparison: Current week vs. baseline (rolling 30-day average)
4. Drift detected if >20% degradation in impressions OR >2 positions drop in reply ranking
5. Alert triggered: "Potential Twitter algorithm change detected - impressions down 25%"
6. Drill-down analysis: Which signal patterns or archetypes affected most
7. Dashboard displays: Algorithm drift alerts, impression trends by platform
8. Human escalation: Significant drift (>30%) requires PM review before strategy changes
9. Integration test: Simulate impression drop, verify drift detection alert

---

## Story 4.8: Master Dashboard Implementation with Learning Health View

**As a** product manager,  
**I want** a comprehensive 10-view master dashboard that visualizes every aspect of bot performance including learning system health,  
**so that** I have total visibility into learning rigor, false positive rates, statistical confidence, and system optimization progress.

**Acceptance Criteria:**

1. **View 1: Mission Control** implemented at `/dashboard`
   - Hero metrics (24hr): Posts scanned, Replies posted, CTR, Revenue, Safety Score
   - Live activity feed: Real-time stream of bot actions (scan, filter, analyze, reply)
   - Active alerts widget: Critical/Warning/Info badges
   - **Learning Health Summary**: False positive rate, learning stability, last weight adjustment

2. **View 2: Filtering Funnel Intelligence** implemented at `/dashboard/filtering`
   - Visual funnel: Scanned (100k) → Matched (30k) → Spam Filtered → Queued
   - Keyword performance table: Volume, engagement rate, and revenue per keyword
   - Platform breakdown: Match rates for Twitter vs Reddit vs Threads
   - Spam filter accuracy metrics

3. **View 3: Revenue Attribution** implemented at `/dashboard/revenue`
   - Full conversion funnel: Impression → Reply → Click → Visit → Conversion
   - Top revenue-generating replies list (with links to context)
   - Revenue attribution by Archetype, Platform, and Time-of-day

4. **View 4: Customer Journey** implemented at `/dashboard/customers`
   - Lifecycle stages: New vs Engaged vs Converted vs Loyal users
   - Repeat engagement rate and Cohort retention charts
   - Time-to-conversion histogram

5. **View 5: Triple Bottom Line KPIs** implemented at `/dashboard/kpis`
   - 3-column scorecard (Commercial | Love | Safety)
   - 30-day trend lines for all 9 core KPIs
   - Target vs Actual indicators

6. **View 6: Content Quality** implemented at `/dashboard/content`
   - Archetype performance comparison (CTR, Love Score, Revenue)
   - **Robust Statistics Display**: Show both arithmetic mean and Winsorized mean
   - **Outlier Analysis**: Flag replies where outliers significantly affected results
   - Content pattern correlations (Length, Emojis, Questions)
   - Tone analysis distribution

7. **View 7: A/B Testing Lab** implemented at `/dashboard/experiments`
   - **Thompson Sampling Experiments**: Real-time traffic allocation visualization
   - Active experiment cards with statistical confidence (P(A > B) percentage)
   - Credible intervals displayed as error bars on bar charts
   - Effect size badges: Color-coded (green=large, yellow=medium, gray=small/negligible)
   - Winning variant identification with recommendation: "Strong evidence to promote Variant A (d=0.85)"
   - Regret tracking: "Saved 340 users from seeing inferior variant vs fixed split"
   - Experiment history with convergence speed comparison

8. **View 8: System Health** implemented at `/dashboard/health`
   - Component status indicators (Online/Offline/Degraded)
   - Real-time queue depth and wait times
   - Cost tracking: Real-time DeepSeek spend vs monthly budget
   - Error logs and Rate limit usage
   - **Learning System Health** (NEW):
     ```
     ┌─────────────────────────────────────────────────────────┐
     │ LEARNING SYSTEM HEALTH                                  │
     ├─────────────────────────────────────────────────────────┤
     │                                                          │
     │ False Positive Rate: 9.2% ✓ (Target: <12%)             │
     │ Learning Stability: Stable ✓ (Volatility: 0.04)        │
     │ Last Weight Adjustment: 2 days ago                      │
     │                                                          │
     │ Sample Size Health:                                     │
     │   ├─ Weight Adjustment: 127/100 ✓ Sufficient           │
     │   ├─ Archetype Comparison: 48/50 ⚠ Marginal (ETA: 2d) │
     │   ├─ Keyword Optimization: 42/30 ✓ Sufficient          │
     │   └─ Platform Segmentation: 89/75 ✓ Sufficient         │
     │                                                          │
     │ Active Experiments: 2 (1 near conclusion)              │
     │ Meta-Learning Accuracy: 87% ✓ (Target: >85%)           │
     │ Causal Validation: 3/4 signals validated ✓             │
     │                                                          │
     │ Recent Adjustments:                                     │
     │   └─ Dec 1: Twitter SSS weight +12% (CI: ±4%)         │
     │      Effect: d=0.71 (medium), Confidence: 97%          │
     │                                                          │
     └─────────────────────────────────────────────────────────┘
     ```

9. **View 9: Competitive Intelligence** implemented at `/dashboard/competitive`
   - Share of Voice Chart: Vita mentions vs competitor mentions over time
   - Competitor Mention Breakdown: Which competitors most discussed
   - Competitive Conversion Opportunities: Posts where competitors mentioned but user unsatisfied
   - Defensive Positioning Performance: CTR and conversion rate on competitive replies
   - Market Intelligence Insights: Top complaints, product gaps, sentiment analysis
   - Competitive Reply Queue: Pending replies (manual approval)
   - Rate Limit Tracking: Competitive replies today vs 5/day limit

10. **View 10: Advocacy & Community Champions** implemented at `/dashboard/advocacy`
    - Community Champions Leaderboard: Top 20 by engagement
    - DM Campaign Performance: Sent, accepted, declined, converted
    - Advocate Impact Tracking: UGC reach and amplification
    - Power User Engagement Status
    - Testimonial Library: Approved quotes
    - Viral Content Tracking: Most-shared replies

11. **General Dashboard Requirements**:
    - Real-time updates (WebSocket) for critical metrics
    - Date range picker for all analytical views
    - Export capability (CSV/PDF) for reports
    - Responsive design (Desktop primary, Tablet readable)
    - Navigation: All 10 views accessible from sidebar with icon indicators
    - **Statistical Literacy**: All metrics show confidence intervals, effect sizes, and sample sizes where applicable

---

## Story 4.9: Adaptive Keyword Optimization & Learning

**As a** the learning system,  
**I want** to track keyword performance and automatically optimize the filtering taxonomy with statistical rigor,  
**so that** the system continuously improves recall while minimizing false positives.

**Acceptance Criteria:**

1. Keyword performance tracking service at `@backend/learning/keyword-optimizer.ts`
2. **Weekly Analysis with Sample Size Validation**:
   - Require minimum 30 posts per keyword for optimization
   - Skip keywords with insufficient data
   - Use Winsorized mean for engagement metrics (resistant to viral outliers)
3. Metrics tracked per keyword:
   - Posts detected (volume)
   - Replies generated (engagement from keyword matches)
   - Engagement rate (replies / posts) with 95% confidence interval
   - False positive rate (human-flagged as irrelevant)
   - CTR and conversion rate (commercial value)
4. **Keyword Weight Adjustment Algorithm**:
   - High performers (engagement >15%, sufficient data): Increase weight by 1.2×
   - Low performers (false positive >30%, sufficient data): Decrease weight by 0.8×
   - Dormant keywords (0 matches in 30 days): Flag for removal
   - Confidence-based adjustments: Larger changes for keywords with more data
5. **New Keyword Discovery**:
   - Extract common 2-3 word phrases from top 50 engaging posts
   - Calculate potential value: Estimated volume × engagement rate
   - Suggest new keywords for human approval (don't add automatically)
   - Provide statistical justification: "Phrase 'brain fog remedy' appears in 15 high-engagement posts"
6. Dashboard displays keyword performance table:
   - Sortable by engagement rate, false positive rate, volume
   - Color-coded: Green (winners), Yellow (neutral), Red (losers)
   - Shows confidence intervals for engagement metrics
   - Flags keywords with insufficient data
7. Manual override: PM can lock keyword weights if desired
8. Automated monthly report: "Top 10 keywords by engagement" and "Suggested new keywords"
9. Integration test: Simulate 30 days of data, verify weight adjustments correct and statistically justified
10. A/B test framework: Test new keyword candidates with 10% traffic before full rollout

---

## Story 4.10: LLM-Ready Data Export for Continuous Improvement

**As a** product manager,  
**I want** to export all dashboard data in a structured, token-efficient JSON format,  
**so that** I can feed it into an external LLM (like GPT-4 or Claude 3) to get actionable optimization suggestions.

**Acceptance Criteria:**

1. **Export Button** added to Mission Control: "Export for AI Analysis"
2. **Data Payload Structure** (JSON) includes:
   - **System Context**: Current configuration, active archetypes, safety thresholds
   - **Performance Summary**: Last 30 days of KPIs (Commercial, Love, Safety)
   - **Learning System Health**: False positive rate, learning accuracy, statistical confidence
   - **Filtering Funnel**: Keyword performance data (top 50 winners/losers)
   - **Content Analysis**: Top 20 best/worst replies with full text and outcome metrics
   - **A/B Test Results**: Active and completed experiment data with statistical details
   - **Segmentation Insights**: Platform/time-specific performance patterns
   - **Error Logs**: Summary of recent system health issues
3. **Format Optimization**:
   - Minified JSON to save context window space
   - Clear key names for LLM understanding
   - Timestamps in ISO 8601 format
   - Statistical context included (CIs, effect sizes, sample sizes)
4. **Security Redaction**: Automatically redact PII (user handles, specific IDs)
5. **Prompt Template Generation**: Include "System Prompt" file:
   - "You are an expert AI optimization consultant reviewing Antone's performance..."
   - "Identify 3 specific changes to improve CTR with statistical justification..."
   - "Suggest 5 new keywords based on successful replies with volume estimates..."
6. **Download Package**: ZIP containing `antone_performance_data.json` and `analysis_prompt.md`
7. **API Endpoint**: `GET /api/export/llm-bundle` generates package on demand

---

## Story 4.11: Community Champions Identification & Engagement

**As a** the learning system,  
**I want** to identify users who consistently engage positively with Anton and autonomously reach out with personalized gift offers,  
**so that** we convert happy users into brand advocates and product testers.

**Acceptance Criteria:**

1. **Community Champion Tracker** service at `@backend/analytics/community-champions.ts`
2. Service runs daily, analyzing last 30 days of interactions
3. **Champion Identification Criteria** (from FR19):
   - User has engaged positively with Anton 3+ times (likes, thanks, "helpful" replies)
   - Sentiment analysis: >0.7 average positive sentiment across interactions
   - No negative signals (blocks, reports, hostile replies)
   - Active account (posted within last 7 days)
4. **Engagement Tier Classification**:
   - **Bronze Champion**: 3-5 positive interactions
   - **Silver Champion**: 6-10 positive interactions
   - **Gold Champion**: 11+ positive interactions OR power user (>5k followers) with 3+ positive interactions
5. **Automated DM Campaign** (from FR19):
   - Trigger: User qualifies as Bronze+ Champion
   - Message template: "Hey [name], I noticed you've found my hangover tips helpful a few times! You seem to vibe with what we do. Would you be interested in trying our Vita patches? We'd love your honest feedback. DM me your address and I'll send you some samples!"
   - Rate limiting: Max 5 DMs per day (avoid spam appearance)
   - Opt-out tracking: If user doesn't respond or declines, never DM again
6. **Champion Relationship Management**:
   - Champions table: `community_champions` with tier, engagement_history, dm_sent, response_status
   - Status tracking: Pending, Accepted, Declined, Converted, Advocate
   - Advocate status: User posts unprompted positive content about Vita
7. **Follow-Up Strategy**:
   - If user accepts samples: Track 7-day follow-up ("How are the patches working for you?")
   - If user posts review: Thank them publicly + offer referral discount code
   - If user becomes advocate: Add to VIP list (priority responses, early product access)
8. **ROI Tracking**:
   - Champion conversion rate: % who accept samples → purchase
   - Advocacy amplification: Reach of their positive posts about Vita
   - Cost per champion: Sample cost vs lifetime value
9. Dashboard displays (View 10):
   - Champion leaderboard: Top 20 by engagement frequency
   - DM campaign performance: Sent, accepted, declined, conversion rates
   - Advocate impact: Reach and engagement of their Vita mentions
10. Manual override: PM can manually promote users to Champion status
11. Integration test: Simulate 3+ positive interactions, verify DM trigger

---
