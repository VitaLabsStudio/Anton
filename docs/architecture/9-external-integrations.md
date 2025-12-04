# 9. External Integrations

## 9.1 Platform API Clients

### Twitter/X Integration

```typescript
// backend/src/platforms/twitter/client.ts

import { TwitterApi } from 'twitter-api-v2';
import { RateLimiter } from '../../utils/rate-limiter';

export class TwitterClient {
  private client: TwitterApi;
  private rateLimiter: RateLimiter;

  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });

    // 300 posts/15min, 900 reads/15min
    this.rateLimiter = new RateLimiter({
      read: { max: 900, windowMs: 15 * 60 * 1000 },
      write: { max: 300, windowMs: 15 * 60 * 1000 },
    });
  }

  async search(query: string, options: SearchOptions): Promise<Tweet[]> {
    await this.rateLimiter.acquire('read');
    
    const result = await this.client.v2.search(query, {
      max_results: options.maxResults,
      since_id: options.sinceId,
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      'user.fields': ['verified', 'public_metrics'],
      expansions: ['author_id'],
    });

    return result.data.data || [];
  }

  async reply(tweetId: string, content: string): Promise<string> {
    await this.rateLimiter.acquire('write');
    
    const result = await this.client.v2.reply(content, tweetId);
    return result.data.id;
  }

  async verifyCredentials(): Promise<boolean> {
    try {
      await this.client.v2.me();
      return true;
    } catch {
      return false;
    }
  }
}
```

### Reddit Integration

```typescript
// backend/src/platforms/reddit/client.ts

import Snoowrap from 'snoowrap';

export class RedditClient {
  private client: Snoowrap;
  private rateLimiter: RateLimiter;

  constructor() {
    this.client = new Snoowrap({
      userAgent: 'Antone/1.0.0 (by /u/antone_vita)',
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
    });

    // 60 requests/min
    this.rateLimiter = new RateLimiter({
      default: { max: 60, windowMs: 60 * 1000 },
    });
  }

  async searchSubreddits(subreddits: string[], query: string): Promise<Submission[]> {
    await this.rateLimiter.acquire('default');
    
    const results: Submission[] = [];
    
    for (const sub of subreddits) {
      const posts = await this.client
        .getSubreddit(sub)
        .search({ query, time: 'day', sort: 'new' });
      results.push(...posts);
    }

    return results;
  }

  async comment(submissionId: string, content: string): Promise<string> {
    await this.rateLimiter.acquire('default');
    
    const submission = await this.client.getSubmission(submissionId);
    const comment = await submission.reply(content);
    return comment.id;
  }

  async getKarma(): Promise<number> {
    const me = await this.client.getMe();
    return me.comment_karma + me.link_karma;
  }
}
```

## 9.2 Integration Failure Matrix

Comprehensive error handling strategy for all external integrations:

| Integration | Failure Mode | Detection | Handling Strategy | Recovery Time | Fallback |
|-------------|--------------|-----------|-------------------|---------------|----------|
| **Twitter API** | Rate limit exceeded | 429 response | Queue requests, retry after reset window | 15 minutes | Continue Reddit/Threads |
| **Twitter API** | Authentication failed | 401 response | Alert critical, refresh token | Manual intervention | Halt Twitter operations |
| **Twitter API** | Post deleted/unavailable | 404 response | Skip reply, log event | Immediate | Cancel reply gracefully |
| **Twitter API** | User blocked bot | 403 response | Update author blocklist, permanent disengage | Immediate | Skip user forever |
| **Reddit API** | Rate limit exceeded | HTTP 429 | Queue with exponential backoff | 1 minute | Continue Twitter/Threads |
| **Reddit API** | Comment removed by mod | Post success, later 404 | Log removal, update safety KPIs | N/A | Flag for review |
| **Reddit API** | Subreddit banned | 403 response | Remove from monitoring list | Permanent | Skip subreddit |
| **Threads API** | API unavailable | Connection timeout | Retry 3x, then circuit breaker | 5 minutes | Log warning, continue others |
| **DeepSeek API** | Timeout | Request timeout (30s) | Retry 3x with exponential backoff | 90 seconds | Escalate to human approval |
| **DeepSeek API** | Quality issue | Low confidence (<0.85) | Regenerate with refined prompt | 10 seconds | Escalate to human |
| **DeepSeek API** | Rate limit | 429 response | Queue with priority management | Variable | Delay non-critical analysis |
| **DeepSeek API** | Cost budget exceeded | Daily spend >$5 | Pause analysis, alert PM | Manual review | Switch to cheaper model |
| **Database** | Connection lost | Connection error | Circuit breaker, retry with backoff | 30 seconds | Alert critical, halt processing |
| **Database** | Query timeout | Query >10s | Cancel query, use cached data | Immediate | Degraded mode |
| **Database** | Disk full | Write error | Alert critical, archive old data | Manual intervention | Read-only mode |
| **Google Analytics** | Tracking failed | Network error | Log locally, retry hourly | 1 hour | Manual upload later |
| **Healthchecks.io** | Ping failed | Network error | Retry next cycle | 5 minutes | Email notification only |
| **Cloudflare Tunnel** | Connection dropped | Tunnel down | Auto-reconnect every 30s | 30 seconds | Local access only |

**Circuit Breaker Configuration:**
- **Threshold**: 5 consecutive failures
- **Timeout**: 30 seconds for APIs, 60 seconds for database
- **Half-Open Test**: Single request after timeout to test recovery
- **Metrics**: Track circuit breaker state changes in monitoring

**Retry Configuration:**
- **Max Retries**: 3 for transient errors, 0 for permanent errors (4xx)
- **Backoff**: Exponential (1s → 2s → 4s → 8s)
- **Jitter**: ±20% randomization to prevent thundering herd

## 9.3 DeepSeek R1 Integration

```typescript
// backend/src/clients/deepseek.ts

import axios from 'axios';

export class DeepSeekClient {
  private baseUrl = 'https://api.deepseek.com/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY!;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: 'deepseek-reasoner', // DeepSeek R1
        messages: [
          { role: 'system', content: 'You are Antone, a helpful wellness assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 500,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const message = response.data.choices[0].message;
    
    return {
      content: message.content,
      confidence: this.extractConfidence(message),
      usage: response.data.usage,
    };
  }

  // Fallback to alternative model if needed
  async generateWithFallback(prompt: string): Promise<GenerateResult> {
    try {
      return await this.generate(prompt);
    } catch (error) {
      logger.warn('DeepSeek failed, using fallback', { error });
      return this.fallbackGenerate(prompt);
    }
  }
}
```

---
