# 10. Security Architecture

## 10.1 Authentication & Authorization

```typescript
// backend/src/api/middleware/auth.ts

import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Role-based access
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

## 10.2 Secrets Management

```yaml
# Environment variables (stored in .env, never committed)
# Production: Docker secrets or AWS Secrets Manager

# Platform API Keys
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
TWITTER_BEARER_TOKEN=

REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REFRESH_TOKEN=

THREADS_ACCESS_TOKEN=

# LLM API
DEEPSEEK_API_KEY=

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/antone

# Authentication
JWT_SECRET=

# External Services
HEALTHCHECKS_IO_UUID=
CLOUDFLARE_TUNNEL_TOKEN=
```

## 10.3 Data Security

1. **No PII Storage**: Only public platform handles and post IDs stored
2. **Redaction in Logs**: API keys, tokens never logged
3. **Encryption at Rest**: PostgreSQL with encrypted volumes
4. **Encryption in Transit**: HTTPS via Cloudflare Tunnel

---
