# 13. Testing Strategy

## 13.1 Testing Pyramid

```
                    ┌─────────────┐
                    │   E2E Tests │  (10%)
                    │   Manual    │
                    └──────┬──────┘
               ┌───────────┴───────────┐
               │   Integration Tests   │  (30%)
               │   API + Database      │
               └───────────┬───────────┘
          ┌────────────────┴────────────────┐
          │          Unit Tests             │  (60%)
          │   Business Logic + Utilities    │
          └─────────────────────────────────┘
```

## 13.2 Unit Testing

```typescript
// backend/tests/unit/analysis/decision-engine.test.ts

import { DecisionEngine } from '../../../src/analysis/decision-engine';

describe('DecisionEngine', () => {
  let engine: DecisionEngine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  describe('mode selection', () => {
    it('should select HELPFUL mode when SSS >= 0.82', async () => {
      const result = await engine.analyzePost(
        mockPost({ content: 'What works for hangover headaches? Need help fast!' }),
        mockAuthor()
      );
      
      expect(result.mode).toBe('HELPFUL');
      expect(result.sssScore).toBeGreaterThanOrEqual(0.82);
    });

    it('should select DISENGAGED when safety flags present', async () => {
      const result = await engine.analyzePost(
        mockPost({ content: 'I want to die, this hangover is killing me' }),
        mockAuthor()
      );
      
      expect(result.mode).toBe('DISENGAGED');
      expect(result.safetyFlags).toContain('DEATH_MENTION');
    });

    it('should select ENGAGEMENT when viral and low SSS', async () => {
      const result = await engine.analyzePost(
        mockPost({ 
          content: 'My hangover has a hangover lol 😂', 
          metrics: { likes: 500, replies: 100 } 
        }),
        mockAuthor({ avgLikesPerHour: 10 }) // Viral: 50x baseline
      );
      
      expect(result.mode).toBe('ENGAGEMENT');
    });
  });

  describe('archetype selection', () => {
    it('should select CHECKLIST for high SSS desperate posts', async () => {
      const result = await engine.analyzePost(
        mockPost({ content: 'Desperate, need hangover cure tips NOW' }),
        mockAuthor()
      );
      
      expect(result.archetype).toBe('CHECKLIST');
    });

    it('should prefer CREDIBILITY_ANCHOR for healthcare pros', async () => {
      const result = await engine.analyzePost(
        mockPost({ content: 'What\'s the science behind hangover cures?' }),
        mockAuthor({ archetypeTags: ['healthcare_pro'] })
      );
      
      expect(result.archetype).toBe('CREDIBILITY_ANCHOR');
    });
  });
});
```

## 13.3 Integration Testing

```typescript
// backend/tests/integration/api/decisions.test.ts

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/db';

describe('Decisions API', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$executeRaw`TRUNCATE TABLE decisions, posts, authors CASCADE`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/decisions', () => {
    it('should return paginated decisions', async () => {
      // Seed test data
      await seedTestDecisions(20);

      const response = await request(app)
        .get('/api/v1/decisions')
        .query({ limit: 10 })
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.decisions).toHaveLength(10);
      expect(response.body.hasMore).toBe(true);
    });

    it('should filter by mode', async () => {
      const response = await request(app)
        .get('/api/v1/decisions')
        .query({ mode: 'HELPFUL' })
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      response.body.decisions.forEach((d: Decision) => {
        expect(d.mode).toBe('HELPFUL');
      });
    });
  });

  describe('POST /api/v1/replies/:id/approve', () => {
    it('should approve and post reply', async () => {
      const reply = await seedPendingReply();

      const response = await request(app)
        .post(`/api/v1/replies/${reply.id}/approve`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reply.approvalStatus).toBe('APPROVED');
      expect(response.body.posted).toBe(true);
    });
  });
});
```

## 13.4 Test Coverage Requirements

| Area | Target Coverage | Critical Paths |
|------|-----------------|----------------|
| Decision Engine | 90% | Mode selection, safety checks |
| Reply Generator | 85% | Compliance validation |
| Safety Protocol | 100% | All safety flags |
| Platform Clients | 80% | Auth, rate limiting |
| API Routes | 80% | Auth, validation |
| Overall | 80% | - |

---
