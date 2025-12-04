# Reddit Karma Building Manual

**BUS-001 Compliance: NO AUTOMATED KARMA FARMING**

This document outlines the **manual** process for building Reddit karma to meet the minimum threshold required for bot posting.

---

## Why This Matters

Reddit's community-first philosophy means accounts with low karma are often restricted or shadow-banned. To ensure the bot can post replies without getting flagged or banned, the account must:

1. **Karma ≥ 100** (combined comment + link karma)
2. **Account Age ≥ 30 days**

The bot enforces a **Karma Gate** that blocks all posting until these thresholds are met. This is a **non-negotiable safety feature** to prevent platform ToS violations.

---

## Current Status

Check the bot's current karma status:

```bash
cd backend
npm run worker:logs
```

Look for log entries like:

```
KarmaGate BLOCKED: Insufficient karma: 15 < 100. Manual karma building required.
```

Or check directly via Reddit client verification.

---

## Manual Karma Building Strategy

### Phase 1: Legitimate Community Engagement (Weeks 1-2)

**Goal**: Build 50-100 karma through genuine participation in approved subreddits.

**Approved Subreddits** (from `backend/src/platforms/reddit/subreddit-config.ts`):
- r/hangover
- r/hangovercures

**Activities**:

1. **Comment on existing posts** (5-10 comments/day)
   - Share personal experiences with hangovers (without medical claims)
   - Ask clarifying questions
   - Provide encouragement and empathy
   - Example: "Oof, I feel you. I find that drinking coconut water and taking a walk helps me. Hope you feel better soon!"

2. **Reply to other comments** (3-5 replies/day)
   - Build genuine conversations
   - Stay on-topic
   - Avoid promotional language

3. **Upvote relevant content** (10-20 upvotes/day)
   - Support helpful posts
   - Signal good content to the community

### Phase 2: Establish Credibility (Weeks 3-4)

**Goal**: Reach 100+ karma and demonstrate consistent, helpful presence.

**Activities**:

1. **Create quality posts** (1-2 posts/week)
   - Share hangover prevention tips (backed by science)
   - Ask thoughtful questions about recovery methods
   - Example: "What's your go-to hangover breakfast? Looking for protein-rich options."

2. **Continue commenting** (5-10 comments/day)
   - Focus on posts asking for advice
   - Always include NAD (Not A Doctor) disclaimers
   - Link to peer-reviewed sources when discussing supplements

3. **Build relationships**
   - Follow up on previous conversations
   - Remember and reference past discussions
   - Show genuine interest in helping others

---

## Do's and Don'ts

### ✅ DO:
- Engage authentically with the community
- Share personal experiences (without medical claims)
- Use NAD disclaimers for health-related advice
- Upvote helpful content
- Ask questions
- Be patient (karma takes time)

### ❌ DON'T:
- Post promotional links or product mentions
- Farm karma in unrelated subreddits
- Use automated karma-farming scripts (this will get the account banned)
- Post "karma-farming" low-effort comments (e.g., "This!", "Same!")
- Cross-post excessively
- Engage in controversial or political discussions
- Make medical claims without disclaimers

---

## Monitoring Progress

### Check Karma Status

Via Reddit API (from bot logs):
```bash
npm run worker:logs | grep "karma"
```

Via Reddit directly:
1. Log in to the bot's Reddit account
2. Click on profile icon → View Profile
3. Check combined karma (post + comment)

### Milestones

- **Week 1**: 20-30 karma
- **Week 2**: 50-70 karma
- **Week 3**: 80-90 karma
- **Week 4**: 100+ karma ✅

---

## When Threshold is Met

Once karma ≥ 100 and account age ≥ 30 days:

1. **Verify via logs**:
   ```bash
   npm run worker:logs
   ```
   Look for: `KarmaGate PASSED: Reddit posting allowed`

2. **Monitor initial posts**:
   - Watch for any shadow-bans or flags
   - Check post visibility in target subreddits
   - Monitor moderation actions

3. **Maintain karma**:
   - Continue engagement even after bot is active
   - Don't let account become "post-only"
   - Respond to replies on bot posts

---

## Emergency Procedures

### If Account Gets Suspended

1. **Stop all bot activity immediately**
   ```bash
   npm run worker:stop
   ```

2. **Review suspension reason** (Reddit will send a message)

3. **Appeal if appropriate** (via Reddit's appeal process)

4. **Document issue** in `backend/logs/reddit-incidents.log`

5. **Wait for resolution** before re-enabling

### If Karma Drops Below Threshold

1. **Bot will auto-block posting** (Karma Gate activates)

2. **Investigate cause**:
   - Downvoted comments?
   - Removed posts?
   - Community backlash?

3. **Resume manual engagement** to rebuild karma

---

## References

- Reddit's Content Policy: https://www.redditinc.com/policies/content-policy
- Reddit's Spam Guidelines: https://reddit.zendesk.com/hc/en-us/articles/360043504051-What-constitutes-spam-Am-I-a-spammer-
- Karma explanation: https://reddit.zendesk.com/hc/en-us/articles/204511829-What-is-karma-

---

## Contact

If you need guidance on karma building strategy, contact the project maintainer.

**Last Updated**: 2025-12-04
**Next Review**: 2025-12-18 (or when karma threshold is met)
