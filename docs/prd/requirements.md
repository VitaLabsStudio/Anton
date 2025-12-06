# Requirements

## Functional

**FR1**: The system SHALL monitor Twitter/X, Threads, and Reddit for posts containing hangover-related keywords in real-time using platform streaming APIs or scheduled polling (5-15 minute intervals).

**FR2**: The system SHALL analyze each detected post using a Multi-Signal Analysis Core with four signal categories: (1) Linguistic Intent (solution-seeking language detection), (2) Author Context (relationship memory scoring), (3) Post Metrics & Velocity (engagement patterns), and (4) Semantic Topic (filtering pop culture/metaphors).

**FR3**: The system SHALL calculate a Decision Score for each post and select one of four operational modes: Helpful Mode (high solution-seeking), Engagement Mode (low solution-seeking, high visibility), Hybrid Mode (ambiguous intent), or Disengaged Mode (default/safety).

**FR4**: The system SHALL generate contextually appropriate, screenshot-worthy replies using eight rotating archetypes (Checklist, Myth-bust, Coach, Storylet, Humor-light, Credibility-anchor, Confident Recommender, Problem-Solution Direct) with platform-specific personality adaptation to avoid detection as templated responses.

**FR5**: The system SHALL enforce Primary Safety Protocol by immediately disengaging from posts containing sensitive topics (death, addiction recovery, medical emergencies, pregnancy, minors, "no self-promo" contexts) regardless of keyword matches.

**FR6**: The system SHALL maintain a persistent Relationship Memory database storing interaction history, author archetypes, and sentiment scores for all engaged users to inform future decision-making.

**FR7**: The system SHALL post replies to selected posts via platform APIs with transparent affiliation disclosure ("—Antone (Vita)") and comply with platform-specific constraints (≤320 chars for X/Threads, no links in restricted subreddits).

**FR8**: The system SHALL implement a Self-Correction Mechanism that monitors post-reply sentiment and autonomously deletes replies that meet stringent negative backlash criteria (sentiment <-0.75, velocity >3× baseline, trusted signal flag, no override tag).

**FR9**: The system SHALL track Commercial KPIs (reply-level CTR, landing page dwell time, add-to-cart rate, conversion rate, revenue per reply) using UTM-tagged links and e-commerce platform integration.

**FR10**: The system SHALL track Love KPIs (thanks/likes per reply, unsolicited follows per 100 replies, positive sentiment score, moderator permissions, creator reposts) via platform APIs and sentiment analysis.

**FR11**: The system SHALL track Safety KPIs (removal/report rate vs community baseline, platform strikes, Reddit karma trajectory, follower sentiment stability) and trigger alerts when thresholds are breached.

**FR12**: The system SHALL implement an autonomous A/B testing framework that experiments with message variants within pre-approved guardrails (no profanity, no unapproved claims, no targeting changes) and adjusts weighting based on KPI outcomes.

**FR13**: The system SHALL maintain a Claims Library approved by Legal containing all permitted scientific phrasing and soft benefits statements, with hard blocks on prohibited terms ("prevent", "cure", "treat", unsubstantiated "clinically proven").

**FR14**: The system SHALL escalate posts to human review queue when: (1) Safety ambiguity detected (Distress Probability >0.45), (2) Viral thread detected (>5× velocity spike), (3) Moderator warning received, or (4) Backlash spike exceeding auto-delete thresholds.

**FR15**: The system SHALL support Product Module architecture allowing future expansion to Sleep and Energy patches by swapping problem ontology, lexicon, and message blocks while reusing core intelligence and safety layers.

**FR16**: The system SHALL provide a web-based dashboard for human oversight displaying: real-time activity feed, KPI metrics (Commercial/Love/Safety), flagged interactions requiring review, and manual approval interface for replies in learning phase.

**FR17**: The system SHALL enforce Cadence & CTA Balance by maintaining at least 1 helpful no-link reply for every 2-3 product-mention replies across platforms and using confident-yet-respectful phrasing ("I keep Vita patches in my bag for exactly this. They're transdermal so they work when your stomach can't handle pills. Worth trying: [link]").

**FR18**: The system SHALL implement Controlled Assertiveness Protocol for correcting misinformation with circuit-breaker rules (max 2 replies per thread, exit on escalation keywords, disengage on third-party hostility).

**FR19**: The system SHALL track Community Champions by identifying users who positively engage with Anton 3+ times (likes, thanks, helpful reactions) and autonomously DM them: "You seem to vibe with what we do! Would you try our patches? We'd love your honest feedback."

**FR20**: The system SHALL implement Social Proof Integration by including dynamic post count in reply signatures ("—Antone (Vita) | Helped 1,247 people feel better this month") and rotating approved user testimonials within Credibility-anchor archetype replies.

**FR21**: The system SHALL implement Power User Prioritization by detecting high-follower accounts (>5k followers) or verified badges, then applying premium engagement: accelerated response time (<30 minutes vs 90 minutes), top-performing archetypes only, follow-up engagement on subsequent posts, and personalized gift outreach ("We'd love to send you samples—DM us your address").

**FR22**: The system SHALL implement Reddit Karma Farming by prioritizing pure-value replies (no product mentions) during the first 2 weeks to build trust and achieve 500+ karma before posting product links, and participating strategically in high-traffic subreddits (r/AskReddit, r/LifeProTips) with helpful general advice to establish credibility.

**FR23**: The system SHALL implement Temporal Intelligence by adjusting monitoring intensity based on time-of-need patterns (3× monitoring during Sunday 6-11am peak suffering window), pre-positioning preventive content on Thursday evenings ("Weekend coming up? Here's a science-backed prevention tip..."), and activating holiday targeting campaigns (New Year's Day, St. Patrick's Day, July 4th).

**FR24**: The system SHALL implement Competitive Intelligence Monitoring by tracking mentions of competing products (LiquidIV, Drip Drop, ZBiotics, Flyby), deploying polite defensive positioning when competitors are mentioned ("Those work via rehydration; Vita uses transdermal delivery which bypasses your upset stomach"), and gathering market intelligence on competitor strengths/weaknesses for product strategy insights.

**FR25**: The system SHALL implement Advanced Statistical Safeguards (Priority 1) including: (1) Minimum sample size validation (100+ decisions for weight adjustments, 50+ for archetype comparison, 30+ for keyword optimization), automatically skipping learning operations when insufficient data is available; (2) Robust outlier detection using Winsorized mean and Tukey's method to prevent viral posts from skewing performance metrics; (3) Confidence interval calculation (95% CI) and Cohen's d effect size reporting for all A/B test results to distinguish statistical significance from practical importance.

**FR26**: The system SHALL implement Multi-Armed Bandit Optimization (Priority 2) using Thompson Sampling for A/B testing, dynamically allocating traffic based on real-time performance (shifting traffic away from losing variants), achieving 2-3x faster experiment convergence (5-7 days vs 14 days fixed split) and minimizing regret by showing inferior variants to fewer users.

**FR27**: The system SHALL implement Platform & Temporal Segmentation (Priority 2) with separate signal weights for each platform (Twitter, Reddit, Threads), time of day (Morning, Afternoon, Evening, Night), and combined contexts (e.g., "Twitter-Morning"), discovering platform-specific optimization opportunities (estimated +20-30% performance improvement) and adapting strategies to temporal patterns.

**FR28**: The system SHALL implement Adaptive Learning Rates (Priority 2) that adjust weight change magnitudes (5-30% range vs fixed 10%) based on: sample size (larger samples = higher confidence = larger changes), consistency (same direction 3+ weeks = increase rate), volatility (high variance = decrease rate), and effect size (large improvements = faster adoption), achieving faster convergence while maintaining stability.

**FR29**: The system SHALL implement Causal Inference & Meta-Learning (Priority 3) by: (1) Randomizing 10% of decisions to detect spurious correlations vs true causal relationships, comparing predicted outcomes to actual outcomes to identify confounding variables; (2) Tracking learning accuracy by recording predicted improvements for each weight adjustment and measuring actual improvement 1 week later, automatically tuning learning parameters if accuracy falls below 70%; (3) Ensemble methods combining multiple optimization algorithms (grid search, Bayesian, genetic) with cross-validation to prevent overfitting.

**FR30**: The system SHALL implement a Context Intelligence Engine that gates deep retrieval for high-potential posts (default: Decision Score >0.65 or power-user/competitor overrides), constructs platform-specific conversation graphs (parents, siblings, root, participant roles), runs thread-level safety and tone-flow analysis, optimizes tokens via dialogue normalization, similarity clustering, and summarization with tiered modes (Light/Standard/Full) and budget-aware ordering, re-evaluates the Decision with context-informed recommendations (proceed/adjust/abort, stance diversity + “answered well” detection), and outputs a structured prompt-ready context bundle (must-keep/nice-to-have/constraints/strategy/red-flags, ≤900 tokens) for the reply generator while respecting API/tokens through caching and budget controls.

## Non-Functional

**NFR1**: The system SHALL be deployed on self-hosted infrastructure using Docker Compose (user's PC: i5 6-core, 32GB RAM, 1TB storage) with zero infrastructure cost, or AWS Lightsail ($35-40/month) if migrating for production reliability.

**NFR2**: The system SHALL achieve 95% uptime during peak engagement windows (Friday 22:00 - Sunday 13:00 local time, especially Saturday-Sunday 06:00-11:00).

**NFR3**: The system SHALL process each post analysis (Multi-Signal Analysis) in less than 500ms to enable near-real-time engagement.

**NFR4**: The system SHALL support horizontal scaling to handle 100,000+ posts analyzed per week across 3 platforms with room to scale to 5+ platforms.

**NFR5**: The system SHALL use DeepSeek R1 API ($0.55/1M input, $2.19/1M output) for linguistic analysis and message generation with fallback to GPT-5 mini ($0.25/1M input, $2.00/1M output) if quality issues detected (target: $25-35/month LLM cost with maximum reach strategy processing 20-30k posts/week).

**NFR6**: The system SHALL store all decisions, scores, and generated messages in audit logs with 90-day retention for compliance and improvement analysis.

**NFR7**: The system SHALL implement rate limiting per platform to avoid API quota violations: Twitter (300 posts/15min), Reddit (60 requests/min), Threads (200 requests/hour).

**NFR8**: The system SHALL respond to high-intent posts within 90 minutes of posting to maximize "moment of need" relevance (80% target for posts <2 hours old), with priority response time of <30 minutes for power user posts (>5k followers or verified badges).

**NFR9**: The system SHALL use environment-based configuration (development, staging, production) with secrets managed via Docker secrets (local) or AWS Secrets Manager (cloud).

**NFR10**: The system SHALL provide comprehensive logging with structured JSON format for monitoring, debugging, and performance analysis.

**NFR11**: The system SHALL implement graceful degradation: if one platform API fails, continue operation on remaining platforms without system-wide failure.

**NFR12**: The system SHALL be maintainable by a single developer with clear code documentation, modular architecture, and comprehensive test coverage (>80% unit test coverage).

**NFR13**: The system SHALL implement maximum reach filtering strategy prioritizing customer acquisition over cost optimization: (1) Expanded keyword taxonomy (200+ terms across 9 categories: symptoms, drinking context, recovery intent, wellness, slang), (2) Permissive filtering (process all keyword matches, filter only obvious spam), (3) DeepSeek R1 for quality decisions on all candidates (target: process 20-30k posts/week at $25-35/month, reaching 1,500-2,500 potential customers/week vs 800-1,200 with narrow approach).

---
