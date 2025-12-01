# Epic 6: Competitive Intelligence & Market Positioning

**Epic Goal**: Implement comprehensive competitive intelligence capabilities that monitor competitor mentions, deploy defensive positioning strategies, track market share of voice, and surface product gap insights. This epic enables Anton to position Vita effectively against competitors while gathering valuable market intelligence for product strategy. Deliverable: Fully integrated competitive monitoring system with automated defensive replies, market intelligence dashboard, and product strategy insights.

## Story 6.1: Competitor Keyword Tracking & Database

**As a** the system,  
**I want** to maintain a comprehensive competitor database and track their mentions across all platforms,  
**so that** we have real-time visibility into competitive landscape and discussion patterns.

**Acceptance Criteria:**

1. Competitor database table created: `competitors` with fields:
   - `id`, `name`, `category` (rehydration/pills/iv-therapy/home-remedy)
   - `primary_mechanism` (oral/IV/topical)
   - `price_point` (low/mid/high)
   - `brand_keywords`: Array of mention variations
2. **Competitor Library** seeded with initial data:
   - **Rehydration**: LiquidIV, Drip Drop, Pedialyte, Gatorade, Nuun, Electrolit
   - **Hangover Pills**: ZBiotics, Flyby, AfterDrink, Cheers, DHM Detox, Blowfish, Morning Recovery
   - **IV Therapy**: The I.V. Doc, Revive, HydroMed, Reset IV, IVBoost
   - **Home Remedies**: "hair of the dog", activated charcoal, pickle juice, coconut water, coffee
3. Keyword variations tracked per competitor:
   - LiquidIV: "liquid IV", "liquid i.v.", "liquidiv", "LMNT"
   - ZBiotics: "zbiotics", "z-biotics", "probiotic hangover"
   - Typos and abbreviations handled
4. Competitive mentions table: `competitive_mentions` with:
   - Post reference, competitor detected, sentiment (positive/negative/neutral)
   - User satisfaction indicator (satisfied/unsatisfied/questioning)
   - Positioning opportunity score (0-1)
5. Stream Monitor (Story 1.7) extended to flag competitive mentions
6. Dashboard query: "Show all mentions where user expressed dissatisfaction with competitor"
7. Weekly competitor report: Volume trends, sentiment shifts, emerging competitors
8. Integration test: Post mentioning "LiquidIV didn't help", verify detection and flagging

---

## Story 6.2: Defensive Positioning Reply System

**As a** the system,  
**I want** to generate and deploy polite, educational defensive positioning replies when competitors are mentioned,  
**so that** Vita's unique value proposition is understood without attacking competitors.

**Acceptance Criteria:**

1. Defensive positioning integrated with Story 3.11 (Competitive Defensive Positioning Replies)
2. **Positioning Decision Logic**:
   - User dissatisfied with competitor → High priority positioning (within 30 min)
   - User asking about competitor → Educational comparison (within 60 min)
   - User satisfied with competitor → Light positioning or skip (avoid appearing desperate)
3. **Competitor-Specific Messaging** (from Story 3.11):
   - Pull competitor data from database (mechanism, price point)
   - Generate customized comparison highlighting Vita's differentiation
   - Always acknowledge competitor strengths before positioning Vita
4. **Rate Limiting & Quality Control**:
   - Max 5 competitive replies per day per competitor (FR24)
   - Never reply multiple times in same thread
   - If 3+ competitive replies in 24hrs, escalate to human review
5. **Archetype Override**:
   - Competitive posts always use Problem-Solution Direct or Credibility-anchor
   - Never use Humor-light or Storylet (stay educational)
6. Positioning replies tagged in database: `reply_type: "competitive_positioning"`
7. A/B testing framework applies to competitive replies:
   - Test soft vs assertive positioning
   - Test mechanism explanation vs benefit focus
8. Dashboard shows: Competitive reply performance vs standard reply performance
9. Unit tests validate polite tone (no negative competitor language)
10. Integration test: User posts "ZBiotics didn't work", verify positioning reply generated

---

## Story 6.3: Market Share of Voice Dashboard

**As a** product manager,  
**I want** a dedicated dashboard view tracking Vita's share of voice vs competitors,  
**so that** I can monitor brand visibility and competitive positioning effectiveness.

**Acceptance Criteria:**

1. Integrated into Dashboard View 9 (Story 4.8 - Competitive Intelligence)
2. **Share of Voice Metrics**:
   - Total hangover solution mentions per week
   - Vita mentions vs top 5 competitors (stacked bar chart)
   - Trend over 90 days: Is Vita gaining or losing share?
3. **Sentiment Comparison**:
   - Vita sentiment score vs competitor average sentiment
   - Positive/neutral/negative breakdown per brand
4. **Competitive Conversion Funnel**:
   - Competitor mentioned → Anton replied → User responded → User clicked Vita link → Conversion
   - Conversion rate: competitive positioning vs standard replies
5. **Competitor Deep Dive**:
   - Click any competitor → See all mentions, sentiment distribution, top complaints
   - Filter by: Satisfied users, dissatisfied users, questioning users
6. **Market Intelligence Insights** (auto-generated weekly):
   - "LiquidIV complaints spike 35% this week (mostly about sugar content)"
   - "ZBiotics price point mentioned negatively 12× ($35 perceived as expensive)"
   - "Pedialyte most mentioned but sentiment declining (-15% this month)"
7. **Positioning Effectiveness**:
   - CTR on competitive replies vs standard replies
   - Conversion rate: competitive positioning leads
   - Average time-to-conversion: competitive vs organic
8. Export capability: "Download Competitive Intelligence Report (Last 30 Days)"
9. Real-time alerts: "Competitor surge: Flyby mentions up 200% today"
10. Integration test: Seed competitive data, verify dashboard calculations correct

---

## Story 6.4: Product Gap Analysis & Strategy Insights

**As a** product manager,  
**I want** automated insights into problems competitors don't solve and user pain points,  
**so that** I can inform Vita's product roadmap and positioning strategy.

**Acceptance Criteria:**

1. Product gap analyzer at `@backend/analytics/product-gap-analyzer.ts`
2. Service runs weekly, analyzing last 30 days of competitive mentions
3. **Complaint Extraction**:
   - NLP analysis of posts mentioning competitors + negative sentiment
   - Extract common complaints: "too expensive", "tastes bad", "doesn't work fast enough", "need prescription"
   - Categorize by: Price, Efficacy, Convenience, Taste, Side effects
4. **Unmet Needs Detection**:
   - Posts where user tried competitor + still seeking solutions
   - Posts asking "anything better than [competitor]?"
   - Posts combining multiple products (unmet need indicator)
5. **Mechanism Gap Analysis**:
   - Which delivery mechanisms are users frustrated with? (oral pills, drinks)
   - Vita's transdermal advantage highlighting opportunities
6. **Dashboard View** (part of View 9):
   - **Top 10 Competitor Complaints** (sortable by frequency)
   - **Unmet Needs Board**: Problems users mention that no competitor solves
   - **Vita Advantage Opportunities**: Where Vita's mechanism directly addresses pain points
7. **Strategic Recommendations** (auto-generated):
   - "15% of LiquidIV complaints mention taste → Opportunity: Highlight patches have no taste"
   - "ZBiotics price point ($35) seen as barrier → Vita's $24 is competitive advantage"
   - "Users frustrated with swallowing pills when nauseous → Transdermal messaging opportunity"
8. **Product Roadmap Feed**:
   - Export insights for product team: "Users requesting faster-acting solutions"
   - Feature gap identification: "10 users asked about energy patches (future product line)"
9. Monthly automated report emailed to PM: "Competitive Intelligence & Product Gaps Summary"
10. Integration test: Seed competitive complaint data, verify gap analysis accurate

---

---
