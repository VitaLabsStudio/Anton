import { logger } from '../../utils/logger.js';

export interface SubredditConfig {
  name: string;
  enabled: boolean;
  rulesReviewed: boolean;
  reviewedBy: string;
  reviewedAt: Date;
  allowComments: boolean;
  customRules: string[];
  bannedUntil?: Date;
  notes?: string;
}

const APPROVED_SUBREDDITS: Record<string, SubredditConfig> = {
  hangover: {
    name: 'hangover',
    enabled: true,
    rulesReviewed: true,
    reviewedBy: 'winston',
    reviewedAt: new Date('2024-12-02'),
    allowComments: true,
    customRules: [
      'No medical claims. Always frame advice as personal experience.',
      'Always include NAD (Not A Doctor) disclaimer for medical-style replies.',
      'Engage only with questions about recovery, hydration, or prevention.',
    ],
  },
  hangovercures: {
    name: 'hangovercures',
    enabled: true,
    rulesReviewed: true,
    reviewedBy: 'quinn',
    reviewedAt: new Date('2024-12-03'),
    allowComments: true,
    customRules: [
      'No promotional links unless approved.',
      'Summarize peer-reviewed data before giving supplement advice.',
    ],
  },
  hangoverfood: {
    name: 'hangoverfood',
    enabled: false,
    rulesReviewed: false,
    reviewedBy: 'pending',
    reviewedAt: new Date('1970-01-01'),
    allowComments: false,
    customRules: [
      'Awaiting moderation guidance. Do not engage until approval complete.',
    ],
  },
};

function normalizeSubredditName(name: string): string {
  return name.replace(/^r\//i, '').trim().toLowerCase();
}

export function isSubredditApproved(subreddit: string): boolean {
  const normalized = normalizeSubredditName(subreddit);
  if (!Object.hasOwn(APPROVED_SUBREDDITS, normalized)) {
    logger.warn(`Subreddit not in approved list: ${subreddit}`);
    return false;
  }

  const configDescriptor = Object.getOwnPropertyDescriptor(
    APPROVED_SUBREDDITS,
    normalized
  );
  const config = configDescriptor?.value as SubredditConfig | undefined;

  if (!config) {
    return false;
  }

  if (!config.enabled || !config.rulesReviewed) {
    logger.warn(`Subreddit not approved: ${subreddit}`, { config });
    return false;
  }

  if (config.bannedUntil && new Date() < config.bannedUntil) {
    logger.warn('Subreddit temporarily banned – skipping interaction', {
      subreddit,
      bannedUntil: config.bannedUntil,
    });
    return false;
  }

  return true;
}

export function validateSubreddits(subreddits: string[]): string[] {
  const uniqueSubreddits = Array.from(
    new Set(subreddits.map((sub) => normalizeSubredditName(sub)))
  ).filter(Boolean);

  const approved: string[] = [];

  for (const subreddit of uniqueSubreddits) {
    if (isSubredditApproved(subreddit)) {
      approved.push(subreddit);
    } else {
      logger.error(
        { subreddit },
        'BLOCKED: Attempt to operate in unapproved subreddit'
      );
    }
  }

  if (approved.length === 0) {
    logger.error('No approved subreddits available after validation', {
      requested: uniqueSubreddits,
    });
  }

  return approved;
}

export function getApprovedSubredditConfigs(): SubredditConfig[] {
  return Object.values(APPROVED_SUBREDDITS).filter(
    (config) => config.enabled && config.rulesReviewed
  );
}

export { APPROVED_SUBREDDITS };
