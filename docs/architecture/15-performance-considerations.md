# 15. Performance Considerations

## 15.1 Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Post analysis (all 4 signals) | <500ms | p95 latency |
| Reply generation (DeepSeek) | <3s | p95 latency |
| Database queries | <100ms | p95 latency |
| API response time | <200ms | p95 latency |
| Queue processing throughput | 100+ posts/minute | sustained |

## 15.2 Optimization Strategies

### Parallel Signal Processing

```typescript
// All 4 signals run in parallel
const [sss, ars, evs, trs] = await Promise.all([
  analyzeLinguisticIntent(post.content),
  analyzeAuthorContext(author),
  analyzePostVelocity(post, author),
  analyzeSemanticTopic(post.content),
]);
```

### Database Query Optimization

```typescript
// Use Prisma's include for eager loading
const decisions = await prisma.decision.findMany({
  where: { mode: 'HELPFUL' },
  include: {
    post: {
      include: { author: true }
    },
    replies: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
});

// Use raw queries for complex aggregations
const metrics = await prisma.$queryRaw`
  SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as count,
    AVG(composite_score) as avg_score
  FROM decisions
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY DATE_TRUNC('hour', created_at)
  ORDER BY hour
`;
```

### Caching Strategy

```typescript
// Cache author data (frequently accessed)
const authorCache = new Map<string, { author: Author; expiresAt: number }>();

async function getAuthor(platformId: string, platform: Platform): Promise<Author> {
  const cacheKey = `${platform}:${platformId}`;
  const cached = authorCache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.author;
  }
  
  const author = await prisma.author.findUnique({
    where: { platform_platformId: { platform, platformId } },
  });
  
  if (author) {
    authorCache.set(cacheKey, { 
      author, 
      expiresAt: Date.now() + 5 * 60_000  // 5 min TTL
    });
  }
  
  return author;
}
```

---
