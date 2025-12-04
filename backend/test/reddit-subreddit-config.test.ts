import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  APPROVED_SUBREDDITS,
  getApprovedSubredditConfigs,
  isSubredditApproved,
  validateSubreddits,
} from '../src/platforms/reddit/subreddit-config';

vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Subreddit configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should approve whitelisted subreddit', () => {
    expect(isSubredditApproved('hangover')).toBe(true);
    expect(isSubredditApproved('r/hangover')).toBe(true);
  });

  it('should block unknown or disabled subreddits', () => {
    expect(isSubredditApproved('unknownsub')).toBe(false);
    expect(isSubredditApproved('hangoverfood')).toBe(false);
  });

  it('should validate subreddits and remove duplicates', () => {
    const approved = validateSubreddits(['hangover', 'unknown', 'hangover']);
    expect(approved).toEqual(['hangover']);
  });

  it('should expose approved subreddit configs only', () => {
    const configs = getApprovedSubredditConfigs();
    expect(configs.length).toBeGreaterThanOrEqual(2);
    expect(configs.find((config) => config.name === 'hangover')).toBeDefined();
    expect(configs.every((config) => config.enabled)).toBe(true);
    expect(APPROVED_SUBREDDITS.hangover.enabled).toBe(true);
  });
});
