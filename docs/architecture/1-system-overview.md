# 1. System Overview

## 1.1 Purpose

Antone is an autonomous AI social media manager that operates 24/7 across Twitter/X, Reddit, and Threads to spread awareness for Vita's transdermal patches. The system monitors social platforms for relevant conversations, analyzes posts using multi-signal intelligence, generates contextually appropriate replies, and continuously learns from outcomes.

## 1.2 Current State Baseline

**Existing Vita Social Presence:**
- Twitter/X: No account exists
- Reddit: No account exists  
- Threads: No account exists
- Current follower count: 0 across all platforms
- Historical engagement data: None (greenfield project)
- Manual engagement results: N/A (no prior social media presence)

**Market Opportunity:**
- Estimated 20-30k hangover-related posts per week across target platforms
- 70-80% of high-intent posts occur outside traditional work hours (missed by human-only management)
- Competitor social engagement: Minimal automation detected; mostly traditional paid ads

## 1.3 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANTONE SYSTEM ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  Twitter/X API   │    │   Reddit API     │    │  Threads API     │       │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘       │
│           │                       │                       │                  │
│           └───────────────────────┼───────────────────────┘                  │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     STREAM MONITOR WORKER                            │    │
│  │  • Keyword Filtering (200+ terms)                                   │    │
│  │  • Spam Pre-filtering                                               │    │
│  │  • Platform-specific polling                                        │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      POSTGRESQL DATABASE                             │    │
│  │  • Post Queue          • Decisions           • Replies              │    │
│  │  • Authors             • KPI Metrics         • Experiments          │    │
│  │  • Competitors         • Champions           • Audit Logs           │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     DECISION ENGINE API                              │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │    │
│  │  │  Signal 1   │ │  Signal 2   │ │  Signal 3   │ │  Signal 4   │   │    │
│  │  │ Linguistic  │ │  Author     │ │  Metrics    │ │  Semantic   │   │    │
│  │  │  Intent     │ │  Context    │ │  Velocity   │ │  Topic      │   │    │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │    │
│  │         └────────────────┼────────────────┼────────────────┘        │    │
│  │                          ▼                                          │    │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │
│  │  │              DECISION SCORE & MODE SELECTION                 │   │    │
│  │  │  • Safety Protocol    • Temporal Intelligence                │   │    │
│  │  │  • Power User Detection • Competitive Detection              │   │    │
│  │  │  • Archetype Selection                                       │   │    │
│  │  └─────────────────────────────────────────────────────────────┘   │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     REPLY GENERATOR                                  │    │
│  │  • DeepSeek R1 Integration    • Claims Library Validation           │    │
│  │  • Archetype Templates        • Platform Personality Adaptation     │    │
│  │  • Social Proof Integration   • Compliance Engine                   │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     PLATFORM POSTING SERVICES                        │    │
│  │  • Twitter Poster      • Reddit Poster       • Threads Poster       │    │
│  │  • Rate Limiting       • UTM Tagging         • Error Handling       │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     LEARNING & ANALYTICS ENGINE                      │    │
│  │  • KPI Tracking (Commercial/Love/Safety)                            │    │
│  │  • A/B Testing Framework      • Strategy Weight Adjustment          │    │
│  │  • Self-Correction Mechanism  • Algorithm Drift Detection           │    │
│  │  • Community Champions Tracking                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     NEXT.JS DASHBOARD                                │    │
│  │  • 10-View Master Dashboard   • Real-time WebSocket Updates         │    │
│  │  • Manual Approval Interface  • Human Escalation Queue              │    │
│  │  • KPI Visualization          • Competitive Intelligence View       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     CLOUDFLARE TUNNEL                                │    │
│  │  • Secure Remote Access (https://antone.yourdomain.com)             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.4 Key Design Principles

1. **Modular Architecture**: Each component has a single responsibility and can be developed/tested independently
2. **Event-Driven Processing**: Posts flow through a queue for async processing, enabling scalability
3. **Safety-First Design**: Safety protocols are enforced at multiple layers with hard-coded guardrails
4. **Continuous Learning**: Every interaction feeds back into optimization loops
5. **Cost-Efficient**: Self-hosted deployment with DeepSeek R1 keeps costs at $25-35/month
6. **Transparent & Auditable**: Complete decision trails for compliance and debugging

## 1.5 MVP Definition & Scope

**MVP Scope (Epics 1-3):**
- **Epic 1**: Foundation & Core Infrastructure - Project setup, Docker deployment, database, platform authentication, stream monitoring
- **Epic 2**: Multi-Signal Analysis & Decision Engine - 4-signal intelligence, decision scoring, mode selection, safety protocols
- **Epic 3**: Message Generation & Engagement - Reply generation, compliance validation, platform posting with manual approval workflow

**Post-MVP Optimization (Epics 4-6):**
- **Epic 4**: Learning Loop & Optimization - A/B testing, autonomous learning, 10-view dashboard
- **Epic 5**: Production Hardening & Safety - Advanced monitoring, alerting, human escalation
- **Epic 6**: Competitive Intelligence & Market Positioning - Competitor tracking, market intelligence

**MVP Success Criteria:**
- Bot can authenticate with all 3 platforms
- Bot can detect posts via 200+ keyword filtering
- Bot can analyze posts using 4-signal intelligence
- Bot can generate compliant, platform-specific replies
- Human operators can review and approve replies via dashboard (Views 1, 5, 8 minimum)
- Bot can post approved replies and track basic KPIs

**Phased Deployment:**
- **Phase 1 (Weeks 1-4)**: Epic 1 - Foundation complete
- **Phase 2 (Weeks 5-9)**: Epic 2 - Decision engine operational (analyze but don't post)
- **Phase 3 (Weeks 10-13)**: Epic 3 - Manual approval workflow, begin posting
- **Phase 4 (Weeks 14+)**: Epics 4-6 - Autonomous operation with learning loops

## 1.6 Explicitly OUT OF SCOPE for V1

The following features are intentionally excluded from V1 to maintain focus:

**Platform & Content:**
- ❌ Multi-language support (English only)
- ❌ Image/video content generation (text replies only)
- ❌ Facebook, Instagram, TikTok support (Twitter/X, Reddit, Threads only)
- ❌ Voice/audio engagement
- ❌ Stories/Reels engagement

**Infrastructure:**
- ❌ Mobile app for dashboard (web responsive only)
- ❌ Kubernetes orchestration (Docker Compose sufficient for V1)
- ❌ Multi-region deployment (single self-hosted instance)
- ❌ Real-time streaming APIs (polling is sufficient)

**Analytics:**
- ❌ Advanced predictive analytics (basic trend analysis only)
- ❌ Machine learning model training (use pre-trained DeepSeek R1)
- ❌ Custom NLP models (use DeepSeek for all text analysis)
- ❌ Real-time click stream analysis (daily batch attribution)

**Product Modules:**
- ❌ Sleep patch support (V2 expansion)
- ❌ Energy patch support (V2 expansion)
- ❌ Multi-product concurrent operation (single product focus)

**Advanced Features:**
- ❌ Automated influencer outreach campaigns
- ❌ User-generated content curation
- ❌ Podcast/blog monitoring
- ❌ Sentiment analysis across non-target platforms
- ❌ Predictive trending topic identification

**Compliance & Legal:**
- ❌ GDPR compliance tooling (US-only, internal tool)
- ❌ Multi-jurisdiction regulatory support
- ❌ Automated legal review workflows

---
