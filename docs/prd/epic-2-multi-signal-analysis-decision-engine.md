# Epic 2: Multi-Signal Analysis & Decision Engine

**Epic Goal**: Implement the core intelligence of Antone by building the Multi-Signal Analysis engine that evaluates posts across four signal categories (Linguistic Intent, Author Context, Post Metrics, Semantic Topic), detects power users (>5k followers), implements temporal intelligence (time-of-day optimization), monitors competitive mentions, calculates Decision Scores, and selects operational modes with formal archetype selection logic. This epic delivers a "thinking" bot that can analyze and score posts, prioritize high-impact users, optimize timing, detect competitive opportunities, and make strategic engagement decisions—without actually posting yet. The decision audit trail in the database provides transparency and supports learning in future epics.

## Story 2.1: Signal 1 - Linguistic Intent Analyzer

**As a** the decision engine,  
**I want** to analyze post text for solution-seeking language patterns,  
**so that** I can calculate a Solution-Seeking Score (SSS) indicating whether the user wants help or is just venting/joking.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/signal-1-linguistic.ts`
2. **DeepSeek R1 API integration** for text classification with GPT-4 fallback:
   - Primary: DeepSeek R1 (`deepseek-reasoner` model) - $0.55/1M input tokens
   - Fallback: GPT-4 if DeepSeek fails or confidence <0.85
   - Client: `@backend/clients/deepseek.ts`
3. Prompt engineering: Classify text as `high_solution` (0.82-1.0), `moderate` (0.55-0.82), or `low_solution` (0.0-0.55)
4. Examples from project brief used to train prompt (e.g., "What actually works to stop a hangover headache fast?" = high)
5. Function returns SSS score as float between 0.0-1.0
6. Unit tests with 20+ example posts validate score accuracy (>85% match expected categories)
7. Processing time <2 seconds per post (cached results for duplicate text)
8. Errors handled gracefully (API timeout → default to 0.5 moderate score)

---

## Story 2.2: Signal 2 - Author Context Engine

**As a** the decision engine,  
**I want** to retrieve and score author relationship history from database,  
**so that** I can calculate an Author Relationship Score (ARS) reflecting past positive/negative interactions.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/signal-2-author.ts`
2. Function queries `authors` table by platform + handle
3. Archetypes from bio/history parsed (e.g., "healthcare", "comedian", "parent")
4. Positive signals weighted: prior thanks (+0.15), link click (+0.10), purchase (+0.25)
5. Negative signals weighted: block (-0.30), report (-0.40), hostile reply (-0.20)
6. Base ARS for unknown authors: 0.50 (neutral)
7. Function returns ARS score between 0.0-1.0
8. Unit tests validate scoring logic with mock author data
9. New authors created in `authors` table if not exists

---

## Story 2.3: Signal 3 - Post Metrics & Velocity Calculator

**As a** the decision engine,  
**I want** to analyze post engagement metrics relative to author baseline,  
**so that** I can calculate an Engagement Velocity Score (EVS) distinguishing private pleas from viral performances.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/signal-3-velocity.ts`
2. Post metrics fetched from platform APIs (likes, replies, retweets/reposts)
3. Author baseline calculated from recent post history using **Robust Statistics** (Winsorized mean) to prevent skew from viral outliers
4. Velocity score = (current engagement rate) / (baseline rate)
5. EVS categories: silent plea (<1.0×), normal (1.0-2.0×), moderate (2.0-5.0×), viral (>5.0×)
6. Temporal context considered (post age, time of day, day of week)
7. Function returns EVS as float (ratio value, e.g., 0.5 or 8.3)
8. Unit tests with mock post data validate velocity calculation
9. Missing baseline (new author) defaults to EVS = 1.0

---

## Story 2.4: Signal 4 - Semantic Topic Filter

**As a** the decision engine,  
**I want** to filter out posts using hangover keywords metaphorically (movies, memes, work stress),  
**so that** I disengage from irrelevant contexts and avoid embarrassing misinterpretations.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/signal-4-semantic.ts`
2. **DeepSeek R1 API integration** for topic classification with GPT-4 fallback:
   - Primary: DeepSeek R1 for semantic topic detection
   - Fallback: GPT-4 if DeepSeek fails
   - Processing: Parallel with Signal 1 for efficiency
3. Examples from project brief incorporated (e.g., "John Wick movie hangover" → "Movie Marathon" → disengage)
4. Topic Relevance Score (TRS) returned: 1.0 (actual hangover), 0.0 (metaphor/unrelated)
5. Named Entity Recognition (NER) detects movie/song titles (capitalized phrases)
6. Metaphor patterns detected: "inbox hangover", "crypto hangover", "meeting nausea"
7. Function executes in <2 seconds (parallel with Signal 1 if possible)
8. Unit tests with 30+ metaphor examples achieve >90% accuracy
9. Ambiguous cases (0.4-0.6) logged for human review

---

## Story 2.5: Decision Score Calculation & Mode Selection with Segmented Weights

**As a** the decision engine,  
**I want** to combine all four signal scores using context-specific weights and select operational mode,  
**so that** the bot chooses the appropriate engagement strategy optimized for each platform and time context.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/decision-engine.ts`
2. **Segmented Weight Retrieval** (integrated with Story 4.6 Priority 2):
   - Query `segmented_weights` table for context-specific weights
   - Priority order: Combined segment (e.g., "TWITTER_MORNING") → Platform → Global fallback
   - If segment has insufficient data (<50 decisions), fall back to parent segment
   - Implementation: `getWeights(context: { platform, timestamp })` returns most specific available weights
   - Database query: `SELECT * FROM segmented_weights WHERE segment_type = ? AND segment_key = ?`
   - Fallback logic: Try combined → Try platform → Use global defaults
3. Composite Decision Score calculation:
   - If TRS < 0.5 → Disengage (metaphor/unrelated topic)
   - Else: Context-weighted average using segmented weights (retrieved from `segmented_weights` table)
   - **Robustness check**: Ensure weights are based on sufficient sample sizes (as per Epic 4 Story 4.6)
   - Example: Twitter morning may use (SSS×45% + ARS×20% + EVS×25% + TRS×10%)
   - Example: Reddit evening may use (SSS×50% + ARS×30% + EVS×10% + TRS×10%)
4. Mode selection logic implemented per project brief decision stack:
   - SSS ≥ 0.82 → **Helpful Mode** (mandatory)
   - 0.55 ≤ SSS < 0.82 AND EVS > 5.0× → **Engagement Mode** (unless ARS > 0.70 → **Hybrid**)
   - SSS < 0.55 → **Engagement Mode** or **Disengaged** (no hard pitch)
   - Any safety flag → **Disengaged Mode**
5. Decision object created with:
   - All scores (SSS, ARS, EVS, TRS)
   - Composite score
   - Selected mode
   - Segment used for weights (e.g., "TWITTER_MORNING")
   - Timestamp
6. Decision written to `decisions` table with foreign key to `posts`
7. Unit tests validate:
   - Mode selection for 50+ scenario combinations
   - Segmented weight retrieval and fallback logic
   - Weight application correctness
8. Integration test: Process sample post from queue → retrieve correct segment weights → store decision in database
9. Dashboard query endpoint `/api/decisions` returns recent decisions with scores and segment context

---

## Story 2.6: Primary Safety Protocol

**As a** the decision engine,  
**I want** to detect sensitive topics and immediately force Disengaged Mode,  
**so that** the bot never engages with posts about death, addiction recovery, medical emergencies, or minors.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/safety-protocol.ts`
2. Keyword detection for sensitive topics:
   - Death/harm: "suicide", "kill myself", "die", "funeral"
   - Addiction: "AA meeting", "recovery", "relapse", "sober"
   - Medical: "ER", "hospital", "chest pain", "seizure"
   - Minors: "high school", "college freshman", "underage"
   - Pregnancy: "pregnant", "breastfeeding"
3. Distress Probability calculation using OpenAI sentiment + author history
4. Safety flags added to decision object: `safety_flags: ["death_mention"]`
5. Any safety flag present → Mode forced to **Disengaged**, override all other signals
6. Decision logged with safety_reason for audit
7. Unit tests with 40+ sensitive examples trigger disengage (100% accuracy required)
8. False positives (hyperbole) logged for refinement but still disengage (conservative default)

---

## Story 2.7: Post Queue Processor Service

**As a** the system,  
**I want** a service that continuously processes unprocessed posts from the queue,  
**so that** posts detected by the Stream Monitor are analyzed and decisions are made asynchronously.

**Acceptance Criteria:**

1. Service created at `@backend/services/queue-processor.ts`
2. Service runs on interval (every 30 seconds) querying `posts` WHERE `processed_at IS NULL`
3. For each post:
   - Execute all 4 signals in parallel (Promise.all for speed)
   - Run Safety Protocol check
   - Calculate Decision Score and select mode
   - Write decision to `decisions` table
   - Update post with `processed_at` timestamp
4. **Error handling with retry logic**:
   - Failed posts marked with `error_message` in posts table
   - Retry strategy: Max 3 attempts with exponential backoff (1s → 2s → 4s)
   - Permanent failures (4xx errors): No retry, mark as failed
   - Transient failures (5xx, timeout): Retry with backoff
   - Circuit breaker: After 5 consecutive failures, pause processing for 30s
   - Error tracking: Increment `error_count` field, log to structured logger with request_id
5. Service logs throughput metrics (posts processed per minute)
6. Integration test: Seed queue with 10 posts, verify all processed within 1 minute
7. Service deployed as Docker Compose persistent service with restart policy
8. Dashboard shows queue depth metric (unprocessed posts count)

---

## Story 2.8: Decision Audit & Logging

**As a** product manager,  
**I want** complete audit trails of all decisions with signal breakdowns,  
**so that** I can analyze bot behavior, debug incorrect decisions, and support learning improvements.

**Acceptance Criteria:**

1. All decisions stored in `decisions` table with JSON columns for signal details:
   - `signals_json`: {sss: 0.87, ars: 0.45, evs: 2.3, trs: 0.92}
   - `mode`: "helpful" | "engagement" | "hybrid" | "disengaged"
   - `safety_flags`: ["none"] or ["death_mention"]
2. **Structured logging** (Pino) for all decision steps:
   - Format: JSON with level, timestamp, service, version
   - Request tracing: All logs include unique `request_id` propagated through all services
   - Log levels: DEBUG (dev only), INFO (normal), WARN (safety triggers), ERROR (failures)
   - Redaction: API keys, tokens, user PII automatically redacted
   - Transport: stdout for Docker capture with rotation
3. Log levels: INFO (decision made), WARN (safety trigger), ERROR (processing failure)
4. Dashboard endpoint `/api/decisions/:id` returns full decision detail including post text
5. Decision retention: 90 days in database, then archived to volume storage
6. Searchable by platform, mode, date range, author
7. Sample queries: "Show all decisions with SSS > 0.9 that selected Disengaged mode" (for debugging)

---

## Story 2.9: Temporal Intelligence Engine

**As a** the decision engine,  
**I want** to adjust monitoring intensity and engagement strategies based on time-of-day and calendar patterns,  
**so that** Anton engages users during peak need windows and maximizes response effectiveness.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/temporal-intelligence.ts`
2. **Peak Suffering Window Detection**:
   - Sunday 6-11am: 3× monitoring frequency (poll every 5 min vs 15 min)
   - Saturday-Sunday mornings: Priority queue processing (process these posts first)
3. **Thursday Prevention Campaign**:
   - Thursday 5-9pm: Proactive search for "weekend plans", "going out tonight" posts
   - Deploy prevention-focused archetypes: "Weekend coming up? Here's science-backed prevention..."
   - Lower SSS threshold (0.40 instead of 0.55) for prevention content
4. **Holiday Targeting Calendar**:
   - Pre-configured dates: New Year's Day, St. Patrick's Day, July 4th, Thanksgiving Eve, Halloween
   - 2 days before holiday: Prevention content boosted
   - Holiday morning: Maximum monitoring (5× normal frequency)
5. **Time-of-Day Archetype Adjustment**:
   - Late night (10pm-2am): More empathetic, less promotional tone
   - Morning (6-11am): More urgent, actionable advice (Checklist, Coach)
   - Afternoon (2-6pm): Reflective, educational content (Credibility-anchor)
6. Temporal context stored in decision JSON: `{temporal_context: "sunday_peak", monitoring_multiplier: 3.0}`
7. Dashboard shows temporal performance: CTR by hour-of-day, day-of-week heatmap
8. Unit tests validate time-based adjustments trigger correctly
9. Configuration file for holiday calendar at `@backend/config/temporal-calendar.json`

---

## Story 2.10: Archetype Selection Engine

**As a** the decision engine,  
**I want** a formalized archetype selection algorithm based on mode, author context, and post content,  
**so that** archetypes are chosen systematically rather than randomly, optimizing for engagement.

**Acceptance Criteria:**

1. Module created at `@backend/generation/archetype-selector.ts`
2. **Mode-Based Archetype Pool** defined:
   - **Helpful Mode** → Checklist, Coach, Credibility-anchor, Confident Recommender, Problem-Solution Direct
   - **Engagement Mode** → Humor-light, Storylet (no product mention)
   - **Hybrid Mode** → Myth-bust, Storylet, Coach, Confident Recommender (soft mention)
3. **Author Context Refinement**:
   - Healthcare professional detected → Credibility-anchor preferred (2× weight)
   - Parent/Family → Coach or Storylet
   - Young adult/Student (age <25 inferred) → Humor-light, Storylet
   - Comedian/Creative (bio contains "comedian", "artist") → Humor-light
4. **Content Triggers** (override priority):
   - Post contains misinformation → **Myth-bust** (mandatory)
   - Post asks "does X work?" → **Credibility-anchor** or **Problem-Solution Direct**
   - Post expresses desperation ("help", "desperate") → **Checklist** or **Coach**
   - Post is joking/venting (no question marks) → **Humor-light** or **Storylet**
5. **Rotation Enforcement**:
   - Track last 10 archetypes used globally in memory cache or Redis
   - Mechanism: Queue data structure with FIFO, max size 10
   - Never repeat same archetype within 10 consecutive replies
   - Exception: Myth-bust can interrupt rotation anytime (override flag)
   - Implementation: `archetypeRotation.canUse(archetype)` returns boolean
6. **Power User Override** (from FR21):
   - Users with >5k followers → Use ONLY top 3 performing archetypes (based on Love + Commercial KPI data)
   - Verified badges → Prefer **Confident Recommender** or **Credibility-anchor** (authoritative tone)
7. Function returns: `{archetype: "Checklist", reason: "Helpful mode + desperation detected", confidence: 0.92}`
8. Archetype performance tracked per decision for learning loop (Epic 4)
9. Unit tests validate selection logic for 30+ scenario combinations
10. Dashboard shows archetype distribution and performance comparison

---

## Story 2.11: Power User Detection & Prioritization

**As a** the decision engine,  
**I want** to detect high-impact power users and apply premium engagement strategies,  
**so that** Anton maximizes brand amplification through influencer-scale audiences.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/power-user-detector.ts`
2. **Power User Criteria** (any of these qualify):
   - Follower count >5,000 on any platform
   - Verified badge (Twitter Blue checkmark, Reddit trophy, Threads verified)
   - Engagement rate >3% (likes per post / followers)
   - Creator/Influencer in bio keywords ("influencer", "creator", "brand ambassador")
3. Power user flag added to `authors` table: `is_power_user: boolean`, `power_tier: "micro" | "macro" | "mega"`
4. **Tier Classification** (stored in `authors.power_tier` enum):
   - MICRO: 5k-50k followers
   - MACRO: 50k-500k followers
   - MEGA: >500k followers
   - Implementation: Calculate tier during power user detection, store in database for future use
5. **Premium Engagement Protocol** (from FR21):
   - Response time target: <30 minutes (vs 90 min standard)
   - Priority queue: Power user posts processed first
   - Archetype restriction: Top 3 performing only (tracked in Story 4.8)
   - Follow-up engagement: Like their next 2 posts within 24 hours
   - Gift outreach trigger: After 1 positive interaction, send DM: "We'd love to send you samples—DM us your address"
6. Power user interactions logged separately for ROI analysis
7. Dashboard alert: "Power User Detected: @username (52k followers) - Post queued for premium response"
8. Manual override: PM can mark specific users as power users regardless of metrics
9. Unit tests validate detection criteria and prioritization logic
10. Integration test: Simulate power user post, verify <30 min response time

---

## Story 2.12: Competitive Intelligence Detector

**As a** the decision engine,  
**I want** to detect mentions of competing products in posts and trigger defensive positioning strategies,  
**so that** Anton educates users about Vita's unique value proposition when competitors are discussed.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/competitive-detector.ts`
2. **Competitor Product Library** seeded in `competitors` database table (also available at `@backend/data/competitors.json` for initial seeding):
   - Rehydration brands: LiquidIV, Drip Drop, Pedialyte, Gatorade, Nuun
   - Hangover pills: ZBiotics, Flyby, AfterDrink, Cheers, DHM Detox
   - IV therapy: The I.V. Doc, Revive, HydroMed
   - Home remedies tracked: "hair of the dog", activated charcoal, pickle juice
3. Competitor detection in post text using fuzzy matching (handles typos, variations)
4. **Competitive Context Analysis**:
   - Positive mention: "LiquidIV works great for me" → Soft positioning
   - Question: "Does Drip Drop actually work?" → Educational comparison
   - Negative mention: "ZBiotics didn't help" → Strong positioning opportunity
5. **Defensive Positioning Strategy** (from FR24):
   - Tone: Polite, educational (never attack competitors)
   - Message template: "Those work via [mechanism]; Vita uses transdermal delivery which bypasses your upset stomach and doesn't require water when you're nauseous."
   - Differentiation focus: Transdermal vs oral, convenience, science-backed
6. Competitive posts flagged in decision: `{competitor_detected: "LiquidIV", positioning_opportunity: "high"}`
7. Mode adjustment: Competitive posts trigger **Hybrid** or **Helpful** mode (never pure Engagement)
8. Preferred archetype: **Problem-Solution Direct** or **Credibility-anchor**
9. Rate limiting: Max 5 competitive replies per day per competitor (avoid appearing obsessive)
10. Dashboard tracking: Competitor share of voice, Vita mention rate, competitive conversion opportunities
11. Unit tests validate competitor detection across 50+ mention variations
12. Market intelligence logged: Which competitors are most discussed? What complaints do users have?

---
