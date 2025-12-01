# Architectural Blueprint: Antone - Autonomous AI Social Media Manager

**Document Purpose:** This document supersedes previous brainstorming notes and serves as the foundational architectural blueprint for **Antone**, an autonomous, learning AI designed to act as a full-fledged social media manager for the Vita brand.

---

## Section 1: The Core Mandate (The "Why")

Antone's development and behavior are governed by a core philosophy of autonomous evolution. It is not a static script, but a learning entity designed to master its environment through trial and error.

Its mandate is to continuously optimize its strategies to achieve two primary, sometimes competing, goals:

1.  **Goal A: Laser-Focused Sales:** To identify and engage potential customers with surgical precision, delivering the right message at the right time to drive conversions and revenue. Success is measured by **Commercial KPIs** (CTR, Add-to-Cart, Revenue-per-Reply).

2.  **Goal B: Viral, Loved Personality:** To become a famous, respected, and beloved internet entity. Antone will achieve this by providing genuine value, leveraging a unique brand of "accidentally funny" humor, and participating in online culture in a positive, high-engagement manner. Success is measured by **Love KPIs** (Follows, Positive Sentiment, Reposts, Moderator Permissions).

### 1.1. KPI Conflict Resolution Strategy

**Decision Stack for Conflicting Goals:**
1.  **Safety Override:** Safety Score (from Primary Safety Protocol) overrides everything. If an interaction is deemed unsafe, Antone disengages, regardless of sales or engagement potential.
2.  **Solution-Seeking Assessment:** If safe, Antone computes a Solution-Seeking Score (SSS) from Signal 1 (Linguistic Intent).
3.  **Mandatory Helpful Mode:** If SSS ≥ 0.82, Helpful Mode is mandatory, even in highly viral or public contexts. A Hybrid tone can soften delivery, but the core response must deliver utility and relevant product information.
4.  **Contextual Mode Selection:** If 0.55 ≤ SSS < 0.82, Antone checks public visibility (Engagement Velocity from Signal 3). If velocity is >5× the author's baseline average, Antone defaults to Engagement Mode, *unless* the author's Relationship Memory weight shows prior conversions or strong positive history (> +15), in which case a Hybrid Mode is chosen.
5.  **No Hard Pitch:** If SSS < 0.55, Antone will never hard-pitch a product. The response will be limited to Engagement Mode or Disengage Mode.

This hierarchy ensures that "Laser-Focused Sales" are always subordinate to the "Do no harm" principle, and the decision to activate Helpful Mode is tied to a quantifiable and auditable threshold.

### 1.2. Brand Personality Failure Modes & Guardrails

To mitigate risks associated with Antone's "accidentally funny" personality, the following guardrails are implemented, running *before* any Engagement-mode copy is approved for posting:

*   **Insensitive Humor:**
    *   **Failure Mode:** Jokes inadvertently touching upon sensitive topics such as health conditions, addiction, personal identity, or political/religious beliefs.
    *   **Guardrail:** A dedicated "Sensitive Context" pre-reply classifier will analyze proposed Engagement Mode replies. The score must be < 0.2 to allow the witty reply. If above, the reply is blocked, and an alternative (e.g., a neutral Engagement response or Disengage) is selected.
*   **"Cringe" Factor:**
    *   **Failure Mode:** Using outdated slang, mimicking demographics Antone doesn't genuinely belong to, or attempting humor that comes across as inauthentic or forced.
    *   **Guardrail:** A "Culture Freshness" model will tag phrases and meme references. Any phrase tagged as older than 120 days (unless explicitly whitelisted for timeless humor or brand-specific use) will trigger a rewrite of the Engagement Mode reply.
*   **"Dog-Whistle" Drift:**
    *   **Failure Mode:** A seemingly innocuous phrase or meme becoming politicized, co-opted by extremist groups, or otherwise taking on an unintended negative connotation in broader public discourse.
    *   **Guardrail:** Weekly ingestion of external "watchdog keyword lists" and trend analysis feeds. If a phrase is re-categorized as potentially problematic, an immediate system-wide block is enacted for that phrase, and relevant teams are notified.

### 1.3. Leading Indicators for "Love KPIs"

To predict the likelihood of achieving high "Love KPIs" within the critical initial 60 minutes post-reply, Antone will track the following leading indicators:

*   **Positive React Velocity:** A rolling 15-minute count of positive emoji reactions (e.g., 😂, ❤️, 👍) relative to total reactions on Antone's reply. A threshold of >60% positive reactions within this window indicates a high probability of future "Love" (e.g., shares, follows).
*   **Original Poster (OP) Response Latency:** The time in minutes until the Original Poster replies to Antone's comment with a positive or neutral response. A latency of <20 minutes is a strong predictor of sustained engagement and positive sentiment.
*   **Quote-to-Like Ratio (Positive Lexicon):** The ratio of quote posts (reposts with commentary) that contain a positive lexicon (as identified by sentiment analysis) versus the total number of quotes, measured within the first hour. A ratio > 0.4 within this timeframe correlates with future follower growth and positive brand association.
*   **Follower Ripple Effect:** A count of "second-degree" engagements, meaning interactions with Antone's reply from users who are direct followers or frequent engagers with the Original Poster. An early ripple count of >5 suggests high resonance within a relevant social network.

These metrics will feed into a live "Love Probability Score" for monitoring and can inform Antone's subsequent adaptive behaviors, such as whether to follow up or amplify a particular interaction.

---

## Section 2: Platform Architecture (The "How")

Antone is not a simple reply-bot script. It is a persistent, autonomous agent with its own presence on social media.

*   **Dedicated Accounts:** Antone will operate its own dedicated accounts on each target platform (e.g., `@antone_vita` on Twitter/X and Threads, `u/antone_vita` on Reddit).
*   **Full Platform Actor:** The AI must have the technical capability to perform the full range of actions a human user can, including, but not limited to:
    *   Posting original content (e.g., value-posts on hydration).
    *   Replying to posts.
    *   Liking and Retweeting/Reposting.
    *   Sending and Replying to Direct Messages (DMs).
    *   Saving/Bookmarking posts for later analysis.
    *   **Crucially:** Accessing and interpreting its own account analytics (e.g., Twitter Analytics) to inform its learning loop.

### 2.1. Analytics Access Plan & Risks

To ensure Antone can access and interpret its own account analytics to inform its learning loop, a multi-tiered approach is defined, along with associated risks:

*   **Plan A: Official APIs:**
    *   **Description:** Utilizing official platform APIs (e.g., Twitter v2, Meta Graph API) where available to retrieve basic engagement counts, impressions, and user data.
    *   **Risk Profile:** Fully compliant with platform terms of service; very low risk of account suspension.
    *   **Limitation:** Granularity of data is often limited, and detailed analytics (like profile views or reach beyond direct engagement) may not be available for standard accounts.

*   **Plan B: Headless Browser Automation (for Calibration):**
    *   **Description:** Employing headless browser automation (e.g., Playwright) to programmatically log into Antone's own social media accounts and scrape data from analytics dashboards nightly.
    *   **Risk Profile:** Medium risk. Approximately 20% chance of rate-limiting, and 5–10% chance of account suspension if detection patterns look bot-like.
    *   **Mitigation:** This plan will be used sparingly and primarily for *calibration* purposes, not continuous operation. It will incorporate sophisticated randomization of actions, user-agent rotation, and strict throttling. Human fallback and oversight will be mandatory.

*   **Plan C: Inferential Analytics from Public Data:**
    *   **Description:** Inferring analytics by analyzing publicly available data points (likes, replies, retweets/reposts over time) combined with follower count to approximate impressions, reach, and engagement patterns.
    *   **Risk Profile:** Very low risk of account suspension as it relies solely on public data.
    *   **Limitation:** Lower accuracy and relies on proxies rather than direct metrics.

*   **Implementation Strategy:** Antone will default to **Plan A** wherever official APIs provide sufficient data. Where APIs are insufficient for continuous operation, it will fall back to **Plan C**. **Plan B** will be used * sparingly* and under strict manual oversight for periodic calibration and validation of Plan C's inferential models.

### 2.2. Cost & Scalability Formula + V1 Estimate

The monthly operational cost (C) of Antone can be estimated using the following formula:

**C = P * (I * K) + (S * D)**

Where:
*   **P:** Number of platforms Antone is active on.
*   **I:** Average number of interactions analyzed (posts scanned) per platform per month.
*   **K:** Estimated compute cost per interaction analysis (inference + logging). For V1, estimated at $0.0009.
*   **S:** Storage cost per GB for data (e.g., S3 at $0.12/GiB).
*   **D:** Total data volume for Relationship Memory (KB) and operational logs (GB).

**V1 Cost Estimate (Initial Deployment):**
*   **Platforms (P):** 2 (Twitter/X and Reddit)
*   **Interactions Analyzed (I):** 50,000 interactions per platform (total 100,000)
*   **Compute Cost (P * I * K):** 2 * (50,000 * $0.0009) = $90/month
*   **Storage (D):**
    *   Relationship Memory: Approximately 30,000 users * 2 KB/user = 60 MB
    *   Operational Logs: Estimated 40 GB/month
    *   Total Data Volume (approx.): 40 GB
*   **Storage Cost (S * D):** $0.12/GiB * 40 GiB ≈ $5/month

**Total Estimated Monthly Baseline Cost for V1:** ~$95/month (excluding human labor, data annotation costs, and development/maintenance).

### 2.3. Data Needed to Model Platform Algorithms

To allow Antone to not only react but also intelligently anticipate and optimize its content for platform algorithms, it needs to collect specific data per post and engagement:

*   **Input Features (Antone's Actions & Context):**
    *   **Timestamp:** Time and date of Antone's post/reply.
    *   **Day-of-Week:** Day when the action was taken.
    *   **Mode Used:** The operational mode Antone selected (Helpful, Engagement, Hybrid).
    *   **Content Features:** Length of reply, sentiment score, specific keyword clusters used, presence/type of attachments (image, video, link), presence/type of call-to-action.
    *   **Target Author Archetype Tag:** The classification of the user Antone engaged with.
*   **Output Features (Platform Response):**
    *   **Impressions:** Actual impressions if available via APIs (Plan A).
    *   **Engagement Timeline:** High-resolution timeline of likes/replies/reposts per minute for a defined period (e.g., first 60 minutes, first 24 hours).
    *   **Ranking Position:** The reply order index (e.g., if it's the 5th reply in a thread).
    *   **New-Follower Clicks/Ratio:** The number of new followers gained directly after a post, or the ratio of new followers to total post engagements.
    *   **Share Velocity:** Rate at which the post is reshared/retweeted.

**Modeling Approach:**
This data will be used with techniques such as gradient-boosted trees or time-series regression to predict "Impression Lift" and "Reply Ranking" based on Antone's actions. Storing and analyzing residuals (the difference between predicted and actual performance) will be critical for detecting shifts in platform algorithms, allowing Antone to adapt its strategy.

---

## Section 3: The Learning & Evolution Engine

This section defines the "brain" of Antone. The primary directive is to design a system that learns, rather than a system that is exhaustively programmed.

### 3.1. The Multi-Signal Analysis Core

At the heart of the engine is a sophisticated analysis core that assesses every potential interaction against four signal categories to produce a **Decision Score**.

*   **Signal 1: Linguistic Intent:** Analyzes the text for "solution-seeking" language.
    *   **Sub-Signals:** Grammatical Mood (questions vs. statements), Keyword Modifiers ("help," "tips" vs. "lol," "smh"), Emotional Valence (distress vs. humor), Verb Tense (present/future vs. past).
*   **Signal 2: Author Context:** Leverages a persistent "Relationship Memory" to score the author of the post.
    *   **Sub-Signals:** Interaction History (past helpful/humorous interactions), Bio Keywords ("student," "health" vs. "comedian," "memes"), Historical Post Style (baseline personality type).
*   **Signal 3: Post Metrics & Velocity:** Analyzes the social physics of the post to differentiate private pleas from public performances.
    *   **Sub-Signals:** Engagement Velocity (rate of likes/shares vs. author's average), Reply-to-Like Ratio (discussion vs. broadcast).
*   **Signal 4: Semantic Topic:** Uses advanced NLP to understand the *true* underlying topic of the conversation.
    *   **Sub-Signals:** Topic Modeling (Health vs. Travel Frustration), Named Entity Recognition (to exclude song titles, movie quotes, etc.).

### 3.2. Mode Selection Logic

Based on the Decision Score from the analysis core, Antone will select one of four operational modes for its reply.

1.  **Helpful Mode:** Triggered by high solution-seeking intent. Delivers empathy, education, and a soft product pitch.
2.  **Engagement Mode:** Triggered by low solution-seeking intent but high public visibility (e.g., high velocity). Delivers non-promotional, witty, "accidentally funny" humor.
3.  **Hybrid Mode:** A nuanced mode for situations with high emotion (positive or negative) but ambiguous intent. Allows for a sympathetic or joking reply that *may* still contain a very casual, low-key product mention.
4.  **Disengaged Mode:** The default action. Antone will not reply if the confidence score for any other mode is too low, or if a safety protocol is triggered.

### 3.3. The Feedback & Learning Loop

Antone must learn from every single interaction.

*   **Performance Monitoring:** After every action, Antone will monitor the results against its KPIs (e.g., "Did this reply get a high ratio of likes?", "Did the user reply with 'thanks'?", "Was the link clicked?", "Was the comment deleted by a moderator?").
*   **Self-Correction Mechanism:** The bot must have the ability to detect significant negative backlash (e.g., a spike in negative replies, a high ratio of reports). Upon detection, it should be able to automatically **delete its own post** and flag the interaction for internal review to learn from the mistake.

#### 3.3.1. Bias Audit Process for "Decision Score"

To prevent the "Decision Score" from inadvertently creating biases (e.g., systematically deprioritizing certain user demographics), a rigorous audit process will be implemented:

*   **Weekly Shadow Audit:** A weekly shadow audit will be performed on 5% of posts Antone ignored. These ignored posts will be run through a "counterfactual" Decision Score model where the "Author Context" signal is effectively neutralized (e.g., its weight is zeroed out).
*   **Bias Detection:** If more than 10% of these counterfactually analyzed posts *would have been engaged* had the Author Context signal been absent, it triggers a deeper inspection into which author archetypes are being suppressed or disproportionately affected.
*   **Monthly Fairness Report:** A monthly fairness report will quantify interaction coverage by available demographic proxies (e.g., inferred gender, region if available) and topic clusters. This report will guide adjustments to signal weights or the addition of "diversity bonuses" to counteract identified biases.

#### 3.3.2. Self-Correction Anti-Gaming Conditions

To prevent the "Self-Correction Mechanism" (post deletion) from being maliciously "gamed" by coordinated negative campaigns or competitors, the following stringent, multi-factor conditions must *all* be met before Antone autonomously deletes its own post:

1.  **Severe Negative Sentiment:** A Sentiment Score of < -0.75 across a minimum of ≥30 unique replies *or* a direct warning/request from a platform moderator/admin.
2.  **Negative Velocity Spike:** Negativity Velocity (rate of negative replies/reports) must be >3× the baseline average for that specific interaction type.
3.  **Trusted Signal Flag:** At least one "trusted signal" must flag the reply. A trusted signal is defined as an action by a verified user, a platform moderator, or a pre-approved sentinel account.
4.  **No Override Tag:** The interaction must *not* have an explicit "override" tag, which would be applied when Antone intentionally takes a firm stance (e.g., under the Controlled Assertiveness Protocol) where some negative feedback is anticipated.

If all conditions 1, 2, and 3 are satisfied, and condition 4 is *not*, Antone will proceed with self-deletion. Otherwise, the interaction is immediately escalated to a human review queue for manual intervention.

### 3.4. Autonomous Experimentation

Antone is mandated to proactively seek improvement. The engine will include a framework for autonomously designing and executing A/B tests on its own strategies (e.g., "Does this new opener style for hangovers result in a higher 'Love' score?").

#### 3.4.1. Guardrails for Autonomous A/B Testing

To ensure "Autonomous Experimentation" operates within strict ethical and brand safety boundaries, the following guardrails are enforced:

*   **Forbidden Experiment Categories:** The A/B testing engine is hard-coded *not* to test the following:
    *   Tone shifts involving profanity, politically charged language, or unsubstantiated health claims (unless explicitly approved by regulatory and legal teams).
    *   Targeting changes that alter the fundamental Safety thresholds defined in Section 4.
    *   Call-to-Action (CTA) intensity variations beyond a predefined, approved range (e.g., experiments that increase the percentage of posts containing a hard sales pitch beyond a certain limit).
    *   Experiments involving the use of personal data in ways not explicitly approved by privacy policies.

*   **Brand Safety Classifier & Human Gating:** Any new experimental branch (e.g., a new reply style, a novel engagement strategy) must first be run through an automated "Brand Safety Classifier." If it passes, a human gating process is required for final approval before deployment to production. Unapproved experimental branches will never reach the live environment.

---

## Section 4: Core Operational Protocols & Constraints

### 4.1. V1 Product Scope: HANGOVER-SUPPORT ONLY

**CRITICAL CONSTRAINT:** Upon initial deployment, Antone's entire learning and engagement engine is to be focused **exclusively on the Hangover-Support Product Module**. It will be programmed to recognize and engage *only* with conversations related to the next-day effects of alcohol. It will explicitly ignore and disengage from all other topics, including sleep, focus, and energy, until future product modules are formally activated.

#### 4.1.1. V1 Scope Leakage Response

To handle instances where users inquire about topics outside the V1 "Hangover-Support ONLY" scope, a specific pre-written response (`B+`) will be used to acknowledge the user's broader needs while reaffirming Antone's current focus:

**Pre-written Response (B+):**
"Right now I’m laser-focused on helping folks recover from last night. If sleep or focus tips would help you, I can pass the request to the Vita humans so they can follow up. In the meantime, here’s a hangover-friendly step that usually makes rest easier…"

This approach acknowledges the user's request, clearly reaffirms Antone's V1 scope, and then gracefully pivots back to its area of expertise with a relevant, helpful suggestion, avoiding a hard refusal and maintaining a positive brand interaction.

### 4.2. Primary Safety Protocol: Disengage on Sensitive Topics

To protect the brand and users, Antone is hard-coded to immediately enter **Disengaged Mode** if its semantic analysis detects highly sensitive topics, regardless of keyword matches. This protocol overrides all other logic.
*   **No-Go Topics:** Any mention of death, harm, significant illness, addiction recovery, mental health crises, or other topics that would be inappropriate for a brand to comment on. The bot's default behavior is always extreme caution.

#### 4.2.1. Safety Grey Area Detection

To navigate the ambiguities of sensitive topics (e.g., hyperbole vs. genuine distress), Antone will employ a sophisticated "Distress Probability" calculation:

*   **Distress Probability Calculation:** The semantic engine will calculate a Distress Probability score by combining advanced language models (trained on identifying genuine distress) with the author's historical posting patterns.
*   **Hyperbole Detection:** If a phrase contains keywords typically associated with death or self-harm, but the author's historical posts indicate a predominantly humorous or hyperbolic style (e.g., Distress Probability score < 0.3), the phrase will be marked as potential hyperbole. In such cases, any witty replies will be subject to *manual approval* before posting to ensure brand safety.
*   **Auto-Disengage & Human Check:** If the Distress Probability score is > 0.45, or if the author's history is unknown, Antone will immediately auto-disengage from the conversation. The interaction will be logged and flagged for human review within a defined Service Level Agreement (SLA) timeframe (see Section 17 for details on Human-in-the-Loop workflow). This ensures a conservative approach to potential sensitive topics.

### 4.3. Controlled Assertiveness Protocol

This protocol, allowing for firm responses to misinformation, is retained as a core operational capability but is subject to all higher-level safety protocols. (Details from previous brainstorming are to be retained here).

#### 4.3.1. Controlled Assertiveness Circuit-Breaker

To prevent public arguments from escalating and potentially damaging the brand during "Controlled Assertiveness" engagements, specific circuit-breaker rules will be applied:

*   **Reply Limit:** Antone will engage in a maximum of 2 replies per thread when operating in assertive mode. This limits the duration of potential contention.
*   **Escalation Keyword Trigger:** If a user's reply contains specific escalation keywords (e.g., "bot," "shill," "scam," profanity, or overtly hostile language), Antone will immediately switch to an "Exit Script":
    *   **Exit Script:** "Appreciate the convo—dropping a link to the factual source and stepping back so the thread can stay chill." Antone will then Disengage from the thread.
*   **Third-Party Hostility:** If a third party joins the conversation and introduces hostile language or behavior, Antone will cease engagement, log the incident, and optionally direct message platform moderators if deemed necessary.


---

## Section 5: Foundational Training Data (Hangover Module)

With the core learning architecture now defined, this section will contain the initial brainstorming lists of keywords, phrases, and scenarios for the initial **Hangover-Support Module**. These examples will serve as the foundational training data for the new engine.

### 5.1. Signal 1: Linguistic Intent Examples

#### High Solution-Seeking (Helpful Mode signals)
*   “What actually works to stop a hangover headache fast?”
*   “Need advice: dry heaving since 7 a.m.—what do I take?”
*   “Help, I have a client call in an hour and last night won.”
*   “Best science-backed way to rehydrate after tequila, go.”
*   “Every remedy I try fails—any real hangover cures?”
*   “How do I stop the shakes without chugging more coffee?”
*   “Someone explain how to calm the nausea without meds?”
*   “Is there a vitamin patch or supplement that truly helps?”
*   “I’m stuck at work feeling dizzy—what do I eat or drink?”
*   “Any tips for clearing brain fog after too much wine?”
*   “What’s the fastest route to functioning after bottomless mimosas?”
*   “How do you stay productive if you wake up hungover?”
*   “I need to drive later—how do I recover safely?”
*   “Serious question: what’s the order for water, electrolytes, food?”
*   “Any hacks for preventing the Sunday hangover from ruining Monday?”
*   “Who has a go-to morning routine for post-party survival?”
*   “How long should I wait before exercising if I’m still feeling it?”
*   “Is there something better than Pedialyte for recovery?”
*   “Do hydration patches actually help or is it placebo?”
*   “My stomach’s on fire—any gentle remedies?”
*   “I can’t keep food down. What do I sip instead?”
*   “Need to look alive for a photoshoot—what reduces puffiness fast?”
*   “Should I be taking magnesium or B vitamins after drinking?”
*   “Seeking legit science on why I’m still foggy 12 hours later.”
*   “Please share the anti-hangover routine that never fails you.”
*   “I’m getting motion sick just sitting. What calms it?”
*   “Is there a smarter night-before protocol to prevent this?”
*   “Can someone DM me their hydration stack for post-party mornings?”
*   “SOS: I have zero appetite but need energy—what do I consume?”
*   “Need to bounce back for travel day—best recovery essentials?”
*   “I’ve tried greasy food, didn’t help. What next?”
*   “Is it normal to feel anxious in a hangover? Any fixes?”
*   “What’s the right balance of caffeine vs. electrolytes?”
*   “Looking for products that work better than traditional sports drinks.”
*   “Need a checklist for getting out of bed without the spins.”
*   "Comparing hangover products, anyone have one that actually works on nausea?"
*   "I have to be a human at a family thing in 2 hours, what's the emergency protocol?"
*   "What's the difference between a hydration multiplier and a regular sports drink for recovery?"
*   "My usual hangover routine isn't cutting it anymore, need to upgrade."
*   "Has anyone tried those IV drips for hangovers? Wondering if a patch is a better option."

#### Low Solution-Seeking (Engagement Mode signals)
*   “Hangover level: just stared at orange juice for five minutes.”
*   “My brain is on airplane mode and the pilot quit.”
*   “Sunday tradition: regret, carbs, and Netflix.”
*   “If hydration was graded, I’d be expelled.”
*   “Current vibe: whispering to my liver, ‘We good?’”
*   “Every cell in my body is emailing HR about last night.”
*   “Hangovers are just adult detention.”
*   “Someone steal my wine club card before I renew it.”
*   “Brain fog so thick I keep rereading my own tweets.”
*   “My stomach is writing slam poetry about tequila.”
*   “If brunch could apologize on my behalf, that’d be great.”
*   “Canceling all plans until my soul returns.”
*   “Hangover soundtrack is just one long sigh.”
*   “Why is water moving slower today?”
*   “My group chat is incriminating so I’ll just nap.”
*   “Current personality: blanket burrito.”
*   “Wore sunglasses indoors so people can’t see the chaos.”
*   “Hangover mode: negotiating chores with future me.”
*   “Counting how many times I’ve said ‘never again’ this month.”
*   “The bar tab was a love letter to chaos.”
*   “My dog is judging me harder than my friends.”
*   “Hangover is just karma with a headache.”
*   “Trying to decode last night’s Instagram story like it’s the Da Vinci Code.”
*   “Post-party energy level: potato.”
*   “Chef’s special today: iced coffee with a side of life choices.”
*   “My liver and I are on a trial separation.”
*   “Hangover cure = memes and silence.”
*   “I’ve spent 20 minutes deciding between couch or bed.”
*   “The sunlight outside clearly wants me gone.”
*   “Mimosas betrayed me but I’ll be back.”
*   “If adulthood had a scent, it’d be stale tequila.”
*   “Living off toast, vibes, and denial.”
*   “My timeline is 90% brunch photos and 10% regrets.”
*   “Hangover aesthetic: hoodie, ice pack, distant stare.”
*   “Manifesting hydration without effort.”
*   "My hangover has a hangover."
*   "Currently accepting applications for a new brain. This one is... used."
*   "Shout out to the pizza I ordered last night for being my only friend this morning."
*   "I've reached the point of my hangover where I'm watching conspiracy theory documentaries."
*   "My body is a temple, but last night it was a bouncy castle at a rave."

### 5.2. Signal 2: Author Context Examples & Archetypes

To generate a reliable "Author Context" score, Antone will build and maintain an internal **"Author Scorecard"** for users it encounters. This scorecard will be populated with weighted tags based on the following archetypes and historical signals.

#### High "Helpful" Score Profiles (Prioritize Helpful/Hybrid Modes)
*   **Healthcare & Wellness Pros:** Bio mentions `healthcare`, `med student`, `nutritionist`, `RN`, `EMT`, `Researcher`, `PhD Candidate`.
*   **Quantified Selfers:** Bio mentions `Bio-hacker`, `supplement nerd`, or posts often include data from fitness trackers.
*   **Fitness Creators:** Regularly post about workout/recovery routines.
*   **Parents:** Posts often mention juggling kids, family life, and a need for practical fixes.
*   **High-Stakes Professionals:** Users identified as pilots, surgeons, or those with frequent early morning meetings.
*   **Event-Specific Planners:** Users identified as brides, grooms, or event planners asking for recovery tips for a group.
*   **Positive History:** Users who have previously thanked Antone, clicked a link, or replied positively.

#### High "Engagement" Score Profiles (Lean Towards Engagement/Hybrid Modes)
*   **Professional Entertainers:** Verified comedians, meme accounts, satire writers, musicians, DJs.
*   **Party Lifestyle Influencers:** Share humorous regret posts, often related to nightlife or events.
*   **Community/Group Accounts:** College humor pages, sports fan pages, meme aggregators.
*   **"Chaos Coordinators":** Bios include `shitposter`, `meme curator`, `chaos coordinator` or similar self-deprecating humor.
*   **Unrelated Brand Accounts:** Brands from other industries (e.g., tech, fashion) bantering about common cultural moments like "Monday scaries."

#### Hybrid / Ambiguous Profiles (Tread Carefully; Rely on Other Signals)
*   **Mixed-Content Influencers:** Wellness or foodie bloggers who mix genuine questions with jokes and sponsored posts.
*   **Remote Workers / Digital Nomads:** Complain about symptoms (e.g., fatigue, headache) but often in the context of a "lifestyle flex."
*   **Hospitality Workers:** Complain about long shifts and feeling drained but may not be explicitly asking for a solution.
*   **Competitor-Adjacent:** Influencers sponsored by competing hydration or supplement products.

#### Low Trust / Disengage Profiles
*   **Burner Accounts:** Freshly created accounts with zero history or followers.
*   **Known Trolls:** Accounts that Antone has previously flagged for negative, aggressive, or nonsensical engagement.
*   **Safety Protocol Triggers:** Users whose posts mention self-harm, addiction relapse, or other topics covered by the Primary Safety Protocol.
*   **Bad Faith Actors:** Accounts that seem to exist only to bait brands, spread misinformation, or flag content (e.g., copyright trolls).

#### Historical Signal Modifiers (Applied to all profiles)
*   **Positive Weight (`+`):** User has previously clicked Antone’s links, used a coupon code, replied "thanks" or "ordered," asked a follow-up question, or invited Antone into a private chat.
*   **Negative Weight (`-`):** User has previously blocked Antone, reported a comment, replied with hostile language, or engaged in bad-faith arguments.

### 5.3. Signal 3: Post Metrics & Velocity Scenarios

This signal analyzes the social physics of the post itself, combining various metrics to infer if the context is a private plea for help or a public performance.

#### 1. Component: Engagement Velocity (speed vs. baseline)

*   **Silent Plea (Helpful):**
    *   **Scenario:** Post 3 hours old, 2 likes, 0 replies. Author's average: 50 likes/hour.
    *   **Logic:** Flag as a personal vent deserving Helpful Mode even if the author has a mid-size following. Low velocity relative to baseline signals a personal appeal.
*   **Viral Joke (Engagement):**
    *   **Scenario:** Post 15 minutes old, 400 likes, 120 replies. Author's average: 20 likes/hour.
    *   **Logic:** Auto Engagement Mode; treat as a stage performance. High velocity signals a public spectacle.
*   **High Velocity, High Pain (Helpful override):**
    *   **Scenario:** Post 10 minutes old, 150 likes, 40 replies. Text includes: “Need to drive my kid to urgent appointment and I’m still dizzy.”
    *   **Logic:** Velocity signals engagement, but content screams solution-seeking with high stakes. **Force Helpful Mode** even in a public context. *Guardrail: Only override when the author directly describes immediate physical discomfort or imminent obligation.*
*   **Spike After Share (Hybrid):**
    *   **Scenario:** Original post was slow (5 likes in 2 hours) until a celebrity RT triggered 200 likes in 5 minutes.
    *   **Logic:** Treat the root author as a Helpful target but craft the response mindful of the now-public stage (Hybrid Mode tone).
*   **Velocity Crash (Disengage):**
    *   **Scenario:** Post surges then stalls after controversial replies/mod warnings.
    *   **Logic:** If alerts mention “stop promoting,” drop it from the queue.

#### 2. Component: Discussion Ratio (reply vs. like mix)

*   **Low Ratio Broadcast (Engagement):**
    *   **Scenario:** 800 likes, 10 replies.
    *   **Logic:** People are largely nodding at a meme/statement. Respond with witty Engagement Mode, no advice.
*   **High Ratio Debate (Avoid unless critical):**
    *   **Scenario:** 40 likes, 70 replies arguing about “hair of the dog” cures.
    *   **Logic:** Default to Disengage. However, if misinformation (e.g., “drink bleach”) appears, the **Controlled Assertiveness Protocol** kicks in with a factual Helpful tone. If the debate is a "myth spiral," Antone can enter with a Controlled Assertiveness/Helpful blend: *“Jumping in with a gentle reminder that ‘hair of the dog’ actually prolongs symptoms; here’s a safer sequence.”*
*   **Help Thread, Low Likes (Helpful):**
    *   **Scenario:** 5 likes, 25 replies, each giving home remedies.
    *   **Logic:** Insert Helpful Mode if no one has mentioned safe, practical steps; cite empathy then concise tips to reset the conversation.
*   **OP Responding Heavily (Hybrid/Helpful):**
    *   **Scenario:** OP replies to every commenter, discussion ratio >1.0, showing active need.
    *   **Logic:** Join with Helpful Mode, referencing OP’s own clarifications to avoid redundancy.
*   **Moderator Request (Helpful/Disengage):
    *   **Scenario:** Mods jump in requesting factual sources. Discussion ratio spikes.
    *   **Logic:** If Antone has community permission, a data-backed Helpful reply earns trust. If the high ratio is clearly hostility, Antone should Disengage.

#### 3. Component: Shareability Index (reposts vs. likes)

*   **Low Share / High Like Joke (Engagement):**
    *   **Scenario:** 500 Reposts / 1000 Likes (Index = 0.5).
    *   **Logic:** People are chuckling quietly. Antone can drop a light, personal-sounding quip in Engagement Mode.
*   **High Share / Lower Like Joke (Engagement - Viral Potential):**
    *   **Scenario:** 1000 Reposts / 500 Likes (Index = 2.0).
    *   **Logic:** The post is being used as a banner statement. Antone’s Engagement Mode reply should be crafted as a quotable add-on that travels with the shares.
*   **Information Cascade (Helpful):**
    *   **Scenario:** A factual PSA gets shared more than liked (e.g., “Don’t mix acetaminophen with alcohol”).
    *   **Logic:** Antone should respond with a credibility-anchored Helpful snippet, as the shareability makes Antone’s reply part of the public service.
*   **Meme Remix Storm (Engagement):**
    *   **Scenario:** High shareability because people are quote-tweeting with their own jokes.
    *   **Logic:** Antone can reply with a creative twist, aligning with the meme energy.
*   **Brand Call-Outs Going Viral (Disengage/Escalate)::**
    *   **Scenario:** Shareability is driven by outrage (e.g., “Brand X patch is dangerous”).
    *   **Logic:** Escalates to **Controlled Assertiveness Protocol** (human review required before reply).

#### 4. Component: Temporal Context (time/day vs. topic)

*   **Classic Window (Helpful):**
    *   **Scenario:** 6–11 AM weekend posts.
    *   **Logic:** High Helpful weighting; queue for fast response.
*   **Late-Night Complaints (Hybrid/Engagement):**
    *   **Scenario:** 1 AM "already feeling tomorrow" posts.
    *   **Logic:** Use Engagement Mode unless user explicitly asks for prevention tips, then drop proactive Helpful advice.
*   **Weekday Lunch-Hour Posts (Helpful/Hybrid):**
    *   **Scenario:** Posts during typical lunch breaks.
    *   **Logic:** Suggests workplace discomfort; keep tone discreet, helpful, low-key CTA.
*   **Out-of-Window Anomalies (Caution/Engagement)::**
    *   **Scenario:** 10 PM Tuesday "so hungover."
    *   **Logic:** Might be sarcasm; check author history + linguistic cues. Boost Engagement probability, or trust linguistic intent for Helpful if strong.
*   **Holiday Spikes (Helpful Override):**
    *   **Scenario:** New Year’s Day 4 PM posts.
    *   **Logic:** Valid for Helpful (people recovering late). Build per-holiday temporal overrides.
*   **Time-Zone Mismatch (Contextual):**
    *   **Scenario:** A post at "10 PM Tuesday" from a user in Tokyo.
    *   **Logic:** If platform location cues are available, infer the user's local time. If data is missing, rely on language first but note the time anomaly in the score.

#### Composite Scenarios Triggering Mode Shifts

*   **Helpful Override:** Low velocity + high pain language + morning timing (even if author is a comedian) → engage with full Helpful stack.
*   **Engagement Lock:** High velocity + low discussion ratio + weekend midnight → comedic Engagement reply only, no pitch.
*   **Hybrid Caution:** Moderate velocity + high discussion ratio + OP previously thanked Antone → craft Hybrid (empathetic plus micro-tip) to keep relationship.
*   **Disengage Triggers:** High reply ratio with hostile tone; posts older than 12 hours unless viral; multiple moderators already involved; shareability > likes fueled by outrage.

### 5.4. Signal 4: Semantic Topic Scenarios

This signal provides a critical filter to prevent Antone from misinterpreting keywords in unrelated contexts. For each case, the classifier should flag the keyword, the true topic, and the resulting action (usually Disengage).

#### 1. Category: Pop Culture / Entertainment
*   **Logic:** Disengage when keywords are part of a known media title, lyric, or quote. Prioritize proper nouns and capitalization as indicators.
*   **Scenarios:**
    *   “I’ve got a hangover from bingeing all three John Wick movies last night.” → **Topic: Movie Marathon**
    *   “Listening to ‘Headache’ by Grouper on loop, what a mood.” → **Topic: Music Reference** (Song: "Headache" by Queens of the Stone Age, Beck's "Nausea," Taio Cruz's "Hangover")
    *   “Ted Mosby’s hangover speech lives rent-free in my brain.” → **Topic: TV Dialogue Quote** (from *How I Met Your Mother*)
    *   “Watching the F1 race gave me pure nausea—those camera angles!” → **Topic: Sports Commentary**
    *   “Just finished reading Sartre's *Nausea*.” → **Topic: Literature Reference**
    *   “My brain is doing the Windows error noise.” (Metaphor for headache) → **Topic: Meme/Humor**

#### 2. Category: Metaphor / Figurative Language
*   **Logic:** Disengage when symptoms are used to describe abstract concepts like stress, emotions, or technical issues.
*   **Scenarios:**
    *   “My inbox is a hangover I’ll never recover from.” → **Topic: Work Stress**
    *   “This board meeting is causing a full-body nausea response.” → **Topic: Corporate Stress**
    *   “Kids’ science fair prep is a multi-day headache.” → **Topic: Parenting Logistics**
    *   “Dating apps are emotional hangovers.” → **Topic: Relationship Drama**
    *   “Election coverage is a constant headache.” → **Topic: Political Commentary**
    *   “Crypto dip hangover.” → **Topic: Financial Markets**
    *   “Marvel Phase 5 is a superhero hangover.” → **Topic: Pop Culture Commentary**

#### 3. Category: Domain-Specific Jargon
*   **Logic:** Disengage when keywords are used as slang or technical terms within a professional context.
*   **Scenarios:**
    *   “Day two of hacking this build pipeline and my brain feels hungover.” → **Topic: Software Development (Technical Debt)**
    *   “That last-minute deployment created a huge deployment hangover for the team.” → **Topic: Software/IT”**
    *   “We’re all feeling the conference hangover this week.” → **Topic: Marketing/Events”**
    *   “Dealing with this discovery dump is giving me document nausea.” → **Topic: Legal Jargon”**
    *   “The ‘post-vaccine hangover’ is real.” (Slang for immune response) → **Topic: Medical Slang (Caution/Disengage)”**
    *   “That new game patch created a meta hangover.” → **Topic: Gaming Jargon”**

#### 4. Category: Compound & Secondary Topics
*   **Logic:** Disengage if the symptom is a minor detail (<25% of the text) in a story about a larger, unrelated primary topic.
*   **Scenarios:**
    *   “Red-eye flight lost my luggage and left me with a pounding headache.” → **Primary Topic: Airline Complaint”**
    *   “Arguing with Comcast for an hour gave me nausea.” → **Primary Topic: Customer Service Rant”**
    *   “My toddler threw up in the car; now I’ve got a headache and no coffee.” → **Primary Topic: Parenting Mishap”**
    *   “My boss dropped a project bomb on me at 5 PM Friday; instant migraine.” → **Primary Topic: Office Rant”**

#### 5. Category: Brand & Product Name Collisions
*   **Logic:** Disengage when a keyword is part of a proper brand name, product, or project. Use regex and capitalization as cues.
*   **Scenarios:**
    *   “Grabbing a ‘Hangover Burger’ for lunch.” → **Topic: Food/Menu Item”**
    *   “Going to Dizzy’s Club tonight to see some jazz.” → **Topic: Venue/Event”**
    *   “Has anyone tried that ‘Headache’ indie perfume?” → **Topic: Competing/Unrelated Product”**
    *   “Our internal bug bash is called ‘Project Headache’.” → **Topic: Internal Codenames”**
    *   “Just funded the ‘Nausea’ NFT Collection.” → **Topic: Crypto/NFTs”**

#### 6. Category: Medical Contexts Outside Scope
*   **Logic:** Immediately disengage and, if appropriate, escalate to a human or provide a pre-approved, non-promotional resource link via the Safety Protocol.
*   **Scenarios:**
    *   “Chemotherapy is leaving me with all-day ‘hangover’ symptoms.” → **Topic: Serious Medical Treatment”**
    *   “My migraine disorder is flaring—this hangover analogy is accurate.” → **Topic: Chronic Condition”**
    *   “Woke up with a fever and a brutal headache.” → **Topic: Illness Symptoms (not hangover-related)”**