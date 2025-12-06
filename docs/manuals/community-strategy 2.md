# r/VitaWellness Community Strategy (Manual-First)

Manual-only approach for seeding and moderating r/VitaWellness. No bots, no automation, and every interaction is human-approved.

## Guardrails
- No automated posting or commenting.
- Cite sources for any health or supplement claims; avoid product pitching.
- Use Reddit native analytics; do not build or rely on a custom dashboard.
- Respect platform rules and subreddit-specific guidelines before engaging externally.

## Weekly Content Calendar (10-Week Seed)
- Cadence: 1 post per week, Sundays 10:00 ET (adjust to mod-preferred window if needed).
- Queue source: `backend/src/data/content-library.json` (ids below).
- Voice: Educational, neutral tone, no sales CTAs, include sources in-body.

| Week | Library Id | Title | Format | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | science-of-hangovers-body | The Science of Hangovers: What Really Happens to Your Body | Text post | Human | Close comments if brigading appears. |
| 2 | hydration-myths-debunked | Hydration Myths Debunked: What Actually Helps | Text post | Human | Pin top comment summarizing sources. |
| 3 | vitamin-cofactors-alcohol-metabolism | Vitamin Cofactors: The Science of Alcohol Metabolism | Text post | Human | Add NAD (Not A Doctor) disclaimer. |
| 4 | prevention-strategies-evidence-based | Prevention Strategies: Evidence-Based Pre-Drinking Tips | Text post | Human | Emphasize pacing and safety. |
| 5 | b-vitamins-and-hangovers | B-Vitamins and Hangovers: What the Research Says | Text post | Human | Include small study caveats. |
| 6 | transdermal-vs-oral-supplements | Transdermal vs Oral Supplements: Absorption Science Explained | Text post | Human | Invite anecdotes; remind evidence limits. |
| 7 | electrolyte-balance-beyond-water | Electrolyte Balance: More Than Just Water | Text post | Human | Pair with practical hydration tips. |
| 8 | nad-depletion-aging | NAD+ Depletion: Why Hangovers Get Worse With Age | Text post | Human | Avoid anti-aging claims. |
| 9 | recovery-timeline-hour-by-hour | Recovery Timeline: Hour-by-Hour What Your Body Does | Text post | Human | Include rest + hydration reminders. |
| 10 | hangover-cures-fact-vs-fiction | Common Hangover Cures: Fact vs Fiction | Text post | Human | Debunk myths; link back to library ids. |

## Engagement Protocol (80/20 Split)
- Target mix: 80% comments in external subs (e.g., r/hangover, r/hydration) / 20% in r/VitaWellness.
- Daily loop (20-30 minutes):
  - Scan approved subs, filter by relevance, and leave 3-5 helpful comments with sources.
  - Record links in tracking sheet for accountability.
  - Avoid top-level replies on medical crisis posts; direct to professional care.
- Karma safety:
  - Skip posting if account karma < 100 or age < 30 days (aligns with `karma-gate` policy).
  - Never reuse templated replies; personalize and keep concise.

## Moderator Outreach (Starts Week 8)
- Inputs: share 6-8 week metrics (uniques, pageviews, member growth, removal rate) and three sample posts.
- Steps:
  1. DM mods with a short intro, intent (education-focused), and opt-out offer.
  2. Ask for specific guidance on tone, allowed links, and weekly cadence.
  3. Document any mod feedback in the tracking sheet (Notes column).
- Copy deck: 1-page overview with mission, guardrails, and past engagement examples (create before outreach).

## Baseline Metrics (Native Reddit)
- Track weekly: Unique visitors, Pageviews, Members/Subscribers.
- Track per-post: Upvotes, Comments, Saves, Reports, Removal reason (if any).
- Track engagement mix: External comments placed vs. r/VitaWellness comments (to enforce 80/20).
- Source of truth: Reddit native Mod Insights (no custom dashboard).

### Tracking Sheet
- Google Sheets template (make a copy): https://docs.google.com/spreadsheets/d/1VitaWellnessRedditMetricsTemplate/copy
- Backup CSV to import if needed: `docs/manuals/reddit-tracking-template.csv`
- Suggested columns: Week, Date Range, Library Id, Reddit URL, Action (Post/Comment), External Comments, Internal Comments, Members, Unique Visitors, Pageviews, Saves, Reports, Notes.

## Runbook Snippets
- Before posting: verify karma threshold, reread subreddit rules, ensure sources are included.
- After posting: log link + metrics baseline, set reminder to return for replies within 24h.
- If a post is removed: record reason verbatim, pause posting for that subreddit, and adjust messaging.
