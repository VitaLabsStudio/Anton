import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appConfig } from '../src/config/app-config';
import { RedditClient } from '../src/platforms/reddit/client';
import type Snoowrap from 'snoowrap';

type Submission = Snoowrap.Submission;

const redditTestMocks = vi.hoisted(() => {
  const scheduleReadMock = vi.fn(async (fn: () => Promise<unknown>) => await fn());
  const scheduleWriteMock = vi.fn(async (fn: () => Promise<unknown>) => await fn());
  const getStatusMock = vi.fn(() => ({
    read: { RUNNING: 0, QUEUED: 0 },
    write: { RUNNING: 0, QUEUED: 0 },
  }));

  const mockSearch = vi.fn();
  const mockReply = vi.fn();
  const mockGetMe = vi.fn();
  const mockGetSubmission = vi.fn(() => ({ reply: mockReply }));
  const mockGetSubreddit = vi.fn(() => ({ search: mockSearch }));
  const snoowrapConstructor = vi.fn().mockImplementation(() => ({
    getSubreddit: mockGetSubreddit,
    getSubmission: mockGetSubmission,
    getMe: mockGetMe,
  }));

  return {
    scheduleReadMock,
    scheduleWriteMock,
    getStatusMock,
    mockSearch,
    mockReply,
    mockGetMe,
    mockGetSubmission,
    mockGetSubreddit,
    snoowrapConstructor,
  };
});

vi.mock('snoowrap', () => ({
  default: redditTestMocks.snoowrapConstructor,
}));

const {
  scheduleReadMock,
  scheduleWriteMock,
  getStatusMock,
  mockSearch,
  mockReply,
  mockGetMe,
  mockGetSubmission,
  mockGetSubreddit,
} = redditTestMocks;

vi.mock('../src/platforms/reddit/auth', () => ({
  redditCredentials: {
    clientId: 'reddit_client',
    clientSecret: 'reddit_secret',
    refreshToken: 'refresh_token=mock_token_part1_mock_token_part2',
    userAgent: 'Antone/1.0.0 (by /u/antone_vita)',
  },
  validateRedditCredentials: vi.fn(),
}));

vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../src/utils/rate-limiter', () => ({
  redditRateLimiter: {
    scheduleRead: redditTestMocks.scheduleReadMock,
    scheduleWrite: redditTestMocks.scheduleWriteMock,
    getStatus: redditTestMocks.getStatusMock,
  },
}));

describe('RedditClient', () => {
  let client: RedditClient;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env['REDDIT_ENABLED'] = 'true';
    appConfig.dryRun = false;
    appConfig.requireApproval = false;
    client = new RedditClient();
  });

  it('joins subreddit list into a single search call', async () => {
    mockSearch.mockResolvedValue([]);

    await client.searchSubreddits(['hangover', 'hangovercures'], 'ginger tea');

    expect(scheduleReadMock).toHaveBeenCalledTimes(1);
    expect(mockGetSubreddit).toHaveBeenCalledWith('hangover+hangovercures');
    expect(mockSearch).toHaveBeenCalledWith({
      query: 'ginger tea',
      time: 'day',
      sort: 'new',
      limit: 100,
    });
  });

  it('returns empty array if no approved subreddits remain', async () => {
    const results = await client.searchSubreddits(['unknown-sub'], 'hydrate');
    expect(results).toEqual([]);
    expect(mockGetSubreddit).not.toHaveBeenCalled();
  });

  it('maps search results to Post format when using default subreddits', async () => {
    const submission = {
      id: 'abc123',
      title: 'Hangover cure question',
      selftext: 'Need tips',
      author: { name: 'redditor', id: 't2_redditor' },
    } as unknown as Submission;

    const spy = vi
      .spyOn(client, 'searchSubreddits')
      .mockResolvedValue([submission]);

    const posts = await client.search('hydrate');
    expect(posts).toHaveLength(1);
    expect(posts[0]).toEqual({
      id: 'abc123',
      content: 'Hangover cure question\nNeed tips',
      author: {
        id: 't2_redditor',
        name: 'redditor',
      },
    });

    spy.mockRestore();
  });

  it('disables integration when authentication fails', async () => {
    const authError = Object.assign(new Error('invalid_grant'), { statusCode: 401 });
    mockSearch.mockRejectedValue(authError);

    await expect(client.searchSubreddits(['hangover'], 'hydrate')).rejects.toThrow(
      'Reddit authentication failed - service disabled. Manual re-authentication required.'
    );
    expect(process.env['REDDIT_ENABLED']).toBe('false');
  });

  it('posts a comment when allowed', async () => {
    mockReply.mockResolvedValue({ id: 'comment123' });

    const result = await client.comment('submission123', 'content');

    expect(scheduleWriteMock).toHaveBeenCalledTimes(1);
    expect(mockGetSubmission).toHaveBeenCalledWith('submission123');
    expect(result).toBe('comment123');
  });

  it('skips posting during dry runs', async () => {
    appConfig.dryRun = true;
    const result = await client.comment('submission', 'content');
    expect(result).toContain('dry_run_reddit_');
    expect(mockGetSubmission).not.toHaveBeenCalled();
  });

  it('retrieves karma using rate limiter', async () => {
    mockGetMe.mockResolvedValue({
      name: 'antone_vita',
      comment_karma: 10,
      link_karma: 5,
    });

    const karma = await client.getKarma();
    expect(scheduleReadMock).toHaveBeenCalled();
    expect(karma).toBe(15);
  });

  it('verifies credentials', async () => {
    mockGetMe.mockResolvedValue({
      name: 'antone_vita',
      comment_karma: 30,
      link_karma: 12,
    });

    const verification = await client.verifyCredentials();
    expect(verification.available).toBe(true);
    expect(verification.message).toContain('u/antone_vita');

    const cached = client.getLastVerifiedInfo();
    expect(cached.username).toBe('antone_vita');
    expect(cached.karma).toBe(42);
  });

  it('reports unavailable when verification fails', async () => {
    mockGetMe.mockRejectedValue(new Error('Invalid credentials'));
    const verification = await client.verifyCredentials();
    expect(verification.available).toBe(false);
    expect(verification.message).toContain('service unavailable');
  });

  it('exposes rate limit status', () => {
    const status = client.getRateLimitStatus();
    expect(getStatusMock).toHaveBeenCalled();
    expect(status).toHaveProperty('read');
    expect(status).toHaveProperty('write');
  });
});
