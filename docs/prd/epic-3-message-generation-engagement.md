# Epic 3: Message Generation & Engagement

**Epic Goal**: Implement the message generation system that creates contextually appropriate, screenshot-worthy replies using eight rotating archetypes (including Confident Recommender and Problem-Solution Direct), ensures compliance with Claims Library, adapts personality per platform (Twitter witty, Reddit detailed, Threads casual), implements competitive defensive positioning, integrates dynamic social proof signatures, and posts replies to Twitter/X, Reddit, and Threads. This epic also implements the Self-Correction Mechanism for autonomous post deletion and the manual approval dashboard for human-in-the-loop oversight during the learning phase. Deliverable: Bot generates high-quality, story-worthy, compliant replies optimized per platform and posts them to social platforms (initially requiring manual approval before posting).

## Story 3.1: Claims Library & Compliance Engine

**As a** legal/compliance officer,  
**I want** a centralized Claims Library with approved phrasing and prohibited terms,  
**so that** all bot-generated messages comply with regulatory requirements and avoid medical claims.

**Acceptance Criteria:**

1. Claims Library JSON file created at `@backend/data/claims-library.json`
2. Library structure defined:
   - `approved_phrases`: Array of pre-approved scientific statements
   - `prohibited_terms`: Array of banned words ("prevent", "cure", "treat", "clinically proven")
   - `soft_benefits`: Array of compliant positioning statements ("designed to support", "formulated to")
3. Compliance validation function at `@backend/compliance/validator.ts`
4. Function checks generated messages against prohibited terms (hard block)
5. Function validates scientific claims match approved phrases (fuzzy matching allowed)
6. Non-compliant messages rejected with specific violation logged
7. Unit tests with 50+ examples validate compliance rules
8. Dashboard endpoint `/api/compliance/library` allows viewing/editing Claims Library
9. All changes to Claims Library require legal team approval (manual workflow documented)

---

## Story 3.2: Message Archetype Templates with Performance Tracking

**As a** content creator,  
**I want** eight distinct message archetypes with multiple variants each, including screenshot-worthy content and comprehensive performance tracking,  
**so that** replies feel human, varied, naturally shareable, and the learning system can optimize archetype selection based on robust statistical analysis.

**Acceptance Criteria:**

1. Message templates defined at `@backend/data/message-archetypes.json`
2. **Eight archetypes implemented** (with performance tracking integration):
   - **Checklist**: 2-3 actionable steps, zero jargon
   - **Myth-bust**: One misconception corrected gently, non-scolding
   - **Coach**: "If you have 10 minutes: do X; if 30: add Y"
   - **Storylet**: 20-30 word relatable scenario + tip
   - **Humor-light**: Kind, never snarky ("Your future self asked me to send water")
   - **Credibility-anchor**: "Here's the simple mechanism..." (no over-claiming, includes testimonials from FR20)
   - **Confident Recommender** (NEW): First-person advocacy ("I keep Vita patches in my bag for exactly this. They're transdermal so they work when your stomach can't handle pills. Worth trying: [link]")
   - **Problem-Solution Direct** (NEW): Educational + assertive ("Hangover = dehydration + vitamin depletion. Vita patches deliver both through your skin. Worked for me and 10k+ others: [link]")
3. Each archetype has 8-12 variants for variety
4. **Screenshot-Worthy Design Principles** (Story-worthy content from FR19):
   - Memorable opening hooks ("Your liver is basically a bouncer dealing with way too many guests right now")
   - Quotable one-liners ("Hangovers are just your body sending you an invoice for last night")
   - Visual structure: Line breaks, emojis (used sparingly), numbered lists
   - Shareable wisdom: "Save this for your next morning-after" positioning
5. Templates use placeholder syntax: `{{empathy_opener}}`, `{{practical_tip}}`, `{{product_mention}}`, `{{cta}}`, `{{testimonial}}`
6. Platform-specific versions: short (X/Threads ≤320 chars), full (Reddit ≤500 chars)
7. Archetype rotation enforced: No same archetype used twice in 10 consecutive replies (managed by Story 2.10)
8. Template selection considers author archetype (e.g., "healthcare" → credibility-anchor preferred)
9. **Social Proof Integration** (FR20):
   - Dynamic signature: "—Antone (Vita) | Helped {{post_count}} people feel better this month"
   - Testimonial rotation in Credibility-anchor: Real user quotes (pre-approved)
10. Unit tests validate all templates render without placeholder errors
11. **Performance Tracking Integration** (supports Epic 4 Story 4.6):
    - Each reply stores archetype in `replies.archetype` field
    - Archetype performance metrics collected via feedback pipeline (Story 4.4)
    - Performance calculated using Winsorized mean (robust to viral outliers)
    - Minimum 50 replies per archetype required for performance comparison
    - Archetype rankings updated weekly with statistical confidence
    - Dashboard displays archetype performance with confidence intervals

---

## Story 3.3: Reply Generator with DeepSeek Integration

**As a** the system,  
**I want** to generate contextually appropriate, screenshot-worthy replies by combining archetypes with DeepSeek-powered customization,  
**so that** each message feels personalized, naturally shareable, and compliant.

**Acceptance Criteria:**

1. Reply generator created at `@backend/generation/reply-generator.ts`
2. Function accepts: decision object, post content, author data, selected archetype, power_user flag, temporal_context
3. **DeepSeek R1 API integration** for content generation:
   - Prompt engineering: "Generate a [archetype] reply that is screenshot-worthy and shareable..."
   - Empathy opener customized to post sentiment and time-of-day
   - Practical tips relevant to specific symptoms mentioned
   - Product mention adjusted for mode (Helpful: detailed with link, Hybrid: casual mention, Engagement: none)
4. **Story-Worthy Content Enhancement** (from FR19):
   - Memorable hooks: "Your liver is basically..." style openers
   - Quotable wisdom: One-liner gems users want to share
   - Visual structure: Strategic line breaks, emojis (1-2 max), bullet points
   - Shareable positioning: "Save this for next time" framing
5. **Dynamic Social Proof** (FR20):
   - Fetch current help count from database: `SELECT COUNT(*) FROM replies WHERE posted_at > NOW() - INTERVAL '30 days'`
   - Signature format: "—Antone (Vita)
   - Testimonial injection for Credibility-anchor: Rotate approved user quotes
6. **Confident Product Positioning** (FR17 update):
   - Assertive CTAs: "Worth trying: [link]" vs old "If you're curious..."
   - First-person advocacy: "I keep Vita patches in my bag for exactly this"
   - Benefit-driven: "They're transdermal so they work when your stomach can't handle pills"
7. Compliance validation run on generated reply (reject if prohibited terms detected)
8. Platform formatting applied: Character limits enforced (X/Threads ≤320, Reddit ≤500)
9. **Power User Special Handling** (FR21):
   - Power users get extra polish: Second DeepSeek pass for refinement
   - Tone adjustment: More professional, less casual
   - Priority archetypes only (top 3 performers)
10. Reply written to `replies` table with: decision_id, content, archetype, generated_at, is_power_user, help_count_at_generation
11. Processing time <3 seconds per reply (DeepSeek + compliance check)
12. Self-confidence scoring: DeepSeek returns confidence (0-1); <0.85 triggers human review queue
13. Integration test: Generate 20 replies from test decisions, verify variety, compliance, and shareability
14. Generated replies surface in dashboard for manual review with "Shareability Score" indicator

---

## Story 3.4: Platform Posting Service - Twitter/X

**As a** the system,  
**I want** to post approved replies to Twitter/X using API v2,  
**so that** @antone_vita can engage with users on Twitter.

**Acceptance Criteria:**

1. Twitter posting service created at `@backend/platforms/twitter/poster.ts`
2. Function accepts reply ID and posts content as reply to original tweet
3. Rate limiting enforced (300 posts per 15 minutes)
4. Error handling for API failures (thread locked, user blocked us, tweet deleted)
5. Posted reply metadata captured: tweet_id, posted_at, initial_metrics (0 likes/replies)
6. Reply status updated in database: `posted_at` timestamp, `platform_post_id`
7. Posting failures logged with reason and retried up to 2 times
8. Integration test (staging): Post test reply to controlled test tweet, verify success
9. Manual approval required before posting (approval workflow in Story 3.6)

---

## Story 3.5: Platform Posting Service - Reddit & Threads

**As a** the system,  
**I want** to post approved replies to Reddit and Threads,  
**so that** u/antone_vita and @antone_vita can engage across all target platforms.

**Acceptance Criteria:**

1. Reddit posting service at `@backend/platforms/reddit/poster.ts`:
   - Post comment as reply to submission or comment
   - Rate limiting (60 requests per minute)
   - Subreddit-specific rules enforced (no links if restricted)
   - Error handling (removed by automod, user deleted post)
2. Threads posting service at `@backend/platforms/threads/poster.ts`:
   - Post reply via Threads API (or fallback HTTP client)
   - Rate limiting (200 requests per hour)
   - Character limit enforcement (500 chars)
   - Error handling (user blocked, thread unavailable)
3. Both services update `replies` table with platform-specific post IDs
4. Posted replies logged with initial metrics (karma, hearts)
5. Integration tests post to staging accounts, verify visibility
6. Platform failures degrade gracefully (log error, don't crash system)

---

## Story 3.6: Manual Approval Dashboard Integration

**As a** human operator,  
**I want** a streamlined approval interface integrated into the Master Dashboard,  
**so that** I can efficiently review, edit, and approve replies while seeing their predicted impact.

**Acceptance Criteria:**

1. **Approval Queue Widget** integrated into Mission Control (View 1)
   - Shows pending count badge
   - Quick-preview of top 3 pending replies
2. **Dedicated Review View** at `/dashboard/approvals`
   - Split screen: Post context (left) vs Generated reply (right)
   - "Why this reply?" explanation box (DeepSeek reasoning)
   - Predicted KPI impact (e.g., "Predicted CTR: 2.4%")
3. **Action Interface**:
   - **Approve**: One-click publish
   - **Edit**: Inline text editor with character count
   - **Reject**: Dropdown for reason (Safety, Irrelevant, Low Quality)
   - **Regenerate**: Request new draft with specific instruction
4. **Bulk Actions**: "Approve all high-confidence (>90%)" button
5. **Mobile-friendly** review mode for on-the-go approvals
6. **Audit Trail**: All human edits logged to improve future generation
7. **Safety Warnings**: Highlight specific phrases that triggered safety flags
8. **Real-time status**: Updates immediately when another operator approves a reply

---

## Story 3.7: Self-Correction Mechanism

**As a** the system,  
**I want** to autonomously delete my own posts that receive severe negative backlash,  
**so that** I can minimize reputation damage from mistakes without human intervention.

**Acceptance Criteria:**

1. Self-correction service at `@backend/services/self-correction.ts`
2. Service monitors posted replies every 15 minutes for sentiment/backlash
3. Negative signals collected:
   - Sentiment analysis of text responses (target: <-0.75)
   - Report/removal events from platform APIs
   - Trusted user flags (verified users, moderators)
4. Deletion triggers (ALL must be met):
   - Sentiment <-0.75 across ≥30 unique replies OR mod warning
   - Negativity Velocity >3× baseline average
   - At least one trusted signal flag
   - No "override" tag (for Controlled Assertiveness posts)
5. If triggered: Delete post via platform API, log incident, flag for human review
6. Escalation: Severe backlash (>100 negative replies) triggers immediate alert
7. Unit tests validate deletion logic doesn't trigger on minor negative feedback
8. Integration test: Simulate backlash scenario, verify deletion occurs
9. Self-deletion rate tracked in Safety KPIs (<2% target)

---

## Story 3.8: Relationship Memory Updates

**As a** the system,  
**I want** to update author relationship scores based on post-reply outcomes,  
**so that** future interactions benefit from learned preferences and history.

**Acceptance Criteria:**

1. Relationship update service at `@backend/services/relationship-updater.ts`
2. Service runs hourly, processes posted replies with outcome data
3. Positive signals update author score:
   - "Thanks" in text response: +0.15
   - Like/upvote on reply: +0.05
   - Link click (UTM tracking): +0.10
   - Purchase attributed: +0.25
4. Negative signals update author score:
   - Block/mute: -0.30
   - Report: -0.40
   - Hostile text response: -0.20
5. Author archetypes updated based on new bio/post data
6. `authors` table `history_json` column stores interaction timeline
7. Relationship scores capped at 0.0-1.0 range
8. Unit tests validate score updates for various outcome scenarios
9. Dashboard shows author relationship score trends over time

---

## Story 3.9: Controlled Assertiveness Protocol

**As a** the system,  
**I want** to politely correct misinformation when detected,  
**so that** I provide factual education without appearing argumentative.

**Acceptance Criteria:**

1. Misinformation detection at `@backend/analysis/misinformation-detector.ts`
2. Common myths cataloged: "hair of the dog", "greasy food cures", unproven remedies
3. Detection uses DeepSeek to classify if post contains misinformation
4. If myth detected AND SSS ≥0.55: Generate Myth-bust archetype reply
5. Circuit-breaker rules enforced:
   - Max 2 replies per thread (no extended arguments)
   - Exit on escalation keywords ("bot", "shill", "scam", profanity)
   - Third-party hostility triggers immediate disengage
6. Assertive replies tagged with "override" flag (prevents self-deletion on minor pushback)
7. Factual claims sourced from Claims Library with citation links
8. Unit tests validate myth detection accuracy (>85% precision)
9. Manual review queue flags all Controlled Assertiveness posts for human oversight

---

## Story 3.10: Platform-Specific Personality Adaptation

**As a** the system,  
**I want** to adapt Anton's personality, tone, and success metrics based on each platform's unique culture,  
**so that** engagement feels native to Twitter/X, Reddit, and Threads rather than one-size-fits-all.

**Acceptance Criteria:**

1. Platform personality module created at `@backend/generation/platform-personality.ts`
2. **Twitter/X Personality**:
   - Tone: Witty, fast-paced, conversational
   - Format: Tight writing (≤280 chars ideal), strategic line breaks
   - Engagement strategy: Reply to original post + 2-3 follow-up replies in thread conversation
   - Quote tweets: For viral posts (EVS >5.0×), quote tweet with educational value
   - Emojis: Moderate use (1-2 per reply)
   - Thread participation: If OP responds, continue conversation (max 3 total replies)
   - Success metrics: Likes, quote tweets, follower growth
3. **Reddit Personality**:
   - Tone: Detailed, helpful, academic-casual hybrid
   - Format: Longer posts (300-500 chars), bullet points, bold headers
   - Engagement strategy: In-depth first reply + follow-up if asked questions
   - Karma building: Upvote quality responses, participate in discussions
   - Subreddit awareness: Adapt to sub rules (no links in r/stopdrinking, formal in r/AskDocs)
   - Comment depth: Willing to reply to reply threads (not just top-level)
   - Success metrics: Upvotes, comment karma, "helpful" replies
4. **Threads Personality**:
   - Tone: Warm, casual, Instagram-adjacent (more personal)
   - Format: Short-medium (200-320 chars), visual appeal
   - Visual strategy: Leverage Instagram crossover → suggest infographics in future
   - Emojis: More liberal use (2-3 per reply, align with Instagram culture)
   - Hashtag integration: Use 1-2 relevant hashtags (#hangoverhelp #wellnesstips)
   - Engagement strategy: Single helpful reply, like original post
   - Success metrics: Hearts, shares to Stories, DM conversations
5. **Platform-Specific Archetype Preferences**:
   - Twitter: Humor-light, Storylet, Confident Recommender (fast, punchy)
   - Reddit: Credibility-anchor, Problem-Solution Direct, Coach (detailed, educational)
   - Threads: Storylet, Humor-light, Confident Recommender (relatable, visual)
6. Platform context passed to reply generator: `{platform: "twitter", personality_mode: "witty_fast"}`
7. Dashboard tracks performance by platform: Compare CTR, sentiment, engagement by platform
8. Unit tests validate platform-specific formatting and tone adjustments
9. Integration test: Generate same decision on all 3 platforms, verify distinct personalities

---

## Story 3.11: Competitive Defensive Positioning Replies

**As a** the system,  
**I want** to generate polite, educational replies when competitors are mentioned,  
**so that** Anton positions Vita's unique value without attacking competitors.

**Acceptance Criteria:**

1. Competitive reply generator at `@backend/generation/competitive-replies.ts`
2. Function triggered when Story 2.12 detects competitor mention
3. **Positioning Message Templates** (from FR24):
   - **vs. Rehydration products** (LiquidIV, Drip Drop, Pedialyte):
     "Those work via rehydration; Vita uses transdermal delivery which bypasses your upset stomach and doesn't require water when you're nauseous. Different mechanisms: [link to science explainer]"
   - **vs. Hangover pills** (ZBiotics, Flyby):
     "Pills can be tough when your stomach's already upset. Vita patches deliver through your skin, so nothing to swallow or digest. Worth comparing: [link]"
   - **vs. IV therapy** (The I.V. Doc):
     "IV therapy works but requires an appointment and costs $100-200. Vita patches deliver similar nutrients transdermally for a fraction of the cost, right when you need it. [link]"
   - **vs. Home remedies** ("hair of the dog", pickle juice):
     "Traditional remedies have anecdotal support but limited science. Vita patches deliver research-backed ingredients (B-vitamins, glutathione precursors) through your skin. Here's the science: [link]"
4. **Tone Guidelines**:
   - Never say: "X doesn't work" or "X is bad"
   - Always say: "X works via [mechanism]; Vita uses [different mechanism]"
   - Educational, not combative: "Different approaches for different needs"
   - Acknowledge competitor strengths: "Those are popular for good reason, and here's how Vita is different..."
5. **Rate Limiting** (from Story 2.12):
   - Max 5 competitive replies per day per competitor
   - Never reply to same competitor thread multiple times
   - If >3 competitive mentions in one day, alert PM: "High competitive activity detected"
6. **Archetype Selection**:
   - Preferred: Problem-Solution Direct, Credibility-anchor
   - Avoid: Humor-light, Storylet (stay educational)
7. Competitive replies tagged: `{reply_type: "competitive_positioning", competitor: "LiquidIV"}`
8. Dashboard tracking: Competitive conversion rate, share of voice shifts
9. Unit tests validate polite tone and factual accuracy (no claims violations)
10. Integration test: Simulate competitor mention, verify positioning reply generated

---
