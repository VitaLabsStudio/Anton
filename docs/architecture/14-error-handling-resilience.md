# 14. Error Handling & Resilience

## 14.1 Error Classification

```typescript
// backend/src/errors/index.ts

export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Platform errors (5xx external)
  TWITTER_API_ERROR = 'TWITTER_API_ERROR',
  REDDIT_API_ERROR = 'REDDIT_API_ERROR',
  THREADS_API_ERROR = 'THREADS_API_ERROR',
  DEEPSEEK_API_ERROR = 'DEEPSEEK_API_ERROR',
  
  // Internal errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  COMPLIANCE_ERROR = 'COMPLIANCE_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public context?: Record<string, unknown>
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}
```

## 14.2 Circuit Breaker Pattern

```typescript
// backend/src/utils/circuit-breaker.ts

export class CircuitBreaker {
  private failures = 0;
  private lastFailure?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private name: string,
    private threshold: number = 5,
    private timeout: number = 30_000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure!.getTime() > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError(
          ErrorCode.PROCESSING_ERROR,
          `Circuit breaker ${this.name} is OPEN`,
          503
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = new Date();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      logger.warn(`Circuit breaker ${this.name} opened`);
    }
  }
}

// Usage
const twitterCircuit = new CircuitBreaker('twitter', 5, 60_000);
await twitterCircuit.execute(() => twitterClient.search(query));
```

## 14.3 Retry Strategy

```typescript
// backend/src/utils/retry.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { 
    maxRetries = 3, 
    backoff = 'exponential',
    initialDelay = 1000,
    maxDelay = 30_000,
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      if (!isRetryable(error)) break;
      
      const delay = calculateDelay(attempt, backoff, initialDelay, maxDelay);
      logger.warn(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`, { error });
      
      await sleep(delay);
    }
  }

  throw lastError!;
}

function isRetryable(error: Error): boolean {
  // Network errors, timeouts, 5xx responses are retryable
  if (error instanceof AppError) {
    return error.statusCode >= 500 || error.code === ErrorCode.RATE_LIMITED;
  }
  return true;
}
```

## 14.4 Graceful Degradation

```typescript
// backend/src/workers/stream-monitor.ts

export class StreamMonitor {
  private platformStatus: Record<Platform, 'healthy' | 'degraded' | 'down'> = {
    TWITTER: 'healthy',
    REDDIT: 'healthy',
    THREADS: 'healthy',
  };

  async pollPlatform(platform: Platform): Promise<void> {
    try {
      const posts = await this.getPlatformClient(platform).poll();
      this.platformStatus[platform] = 'healthy';
      await this.processPostsBatch(posts);
    } catch (error) {
      this.handlePlatformError(platform, error);
      
      // Continue with other platforms - graceful degradation
      if (this.getHealthyPlatformCount() === 0) {
        logger.error('All platforms down');
        await alertService.send({
          severity: 'critical',
          message: 'All social platforms unreachable',
        });
      }
    }
  }

  private handlePlatformError(platform: Platform, error: Error): void {
    this.platformStatus[platform] = 'down';
    
    logger.error(`Platform ${platform} failed`, { 
      error,
      remainingHealthy: this.getHealthyPlatformCount(),
    });
    
    // Increase poll interval for failed platform
    this.adjustPollInterval(platform, 2.0);
  }
}
```

---
