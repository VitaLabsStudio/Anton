/**
 * Usage (dry-run default):
 * export SUBREDDIT_SETUP_DRY_RUN=true
 * export REDDIT_COMMUNITY_NAME=r/VitaWellness
 * export REDDIT_CLIENT_ID=xxx
 * export REDDIT_CLIENT_SECRET=xxx
 * export REDDIT_REFRESH_TOKEN=refresh_token=xxx
 * export REDDIT_USER_AGENT="Antone/1.0.0 (manual subreddit setup)" # optional override
 * pnpm tsx scripts/setup-subreddit.ts
 *
 * Live apply:
 * SUBREDDIT_SETUP_DRY_RUN=false pnpm tsx scripts/setup-subreddit.ts
 */
import { config as loadEnv } from 'dotenv';
import Snoowrap from 'snoowrap';
import type { Subreddit } from 'snoowrap';

loadEnv();

interface RuleDefinition {
  shortName: string;
  description: string;
  violationReason: string;
  kind: 'all' | 'link' | 'comment';
}

interface SetupConfig {
  subredditName: string;
  title: string;
  publicDescription: string;
  sidebar: string;
  submitText: string;
  rules: RuleDefinition[];
  stylesheetCss: string;
}

interface Credentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  userAgent: string;
}

interface SubredditRulesResponse {
  rules: Array<{ short_name: string }>;
}

const dryRun =
  (process.env['SUBREDDIT_SETUP_DRY_RUN'] ?? 'true').toLowerCase() !== 'false';

function requireEnv(key: string): string {
  // Environment access keyed by a whitelisted name; keys are controlled above.
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function loadCredentials(): Credentials {
  return {
    clientId: requireEnv('REDDIT_CLIENT_ID'),
    clientSecret: requireEnv('REDDIT_CLIENT_SECRET'),
    refreshToken: requireEnv('REDDIT_REFRESH_TOKEN'),
    userAgent:
      process.env['REDDIT_USER_AGENT'] ??
      'Antone/1.0.0 (manual subreddit setup)',
  };
}

function normalizeSubredditName(name: string): string {
  return name.replace(/^r\//i, '').trim();
}

function buildSetupConfig(): SetupConfig {
  const sidebar = [
    '## About r/VitaWellness',
    'Human-run community for evidence-based recovery, hydration, and supplement literacy.',
    '',
    '### Ground Rules',
    '- No spam or sales pitches.',
    '- Cite science when making claims.',
    '- No medical advice; encourage seeing a clinician when needed.',
    '- Be kind; report harassment.',
    '',
    '### Manual-First Strategy',
    '- Humans post once per week from the evergreen library.',
    '- 80% of engagement happens in other subs before posting here.',
    '- Use Reddit native analytics for metrics; no bots.',
    '',
    '### Quick Links',
    '- Content library: backend/src/data/content-library.json',
    '- Community strategy: docs/manuals/community-strategy.md',
  ].join('\n');

  const stylesheetCss = [
    '/* VitaWellness minimal theme */',
    'body { background-color: #0b1221; color: #e8eefc; }',
    'a { color: #7dd3fc; }',
    '.side .md h1, .side .md h2 { color: #7dd3fc; }',
    '.titlebox .subscribe-button { background: #0ea5e9; color: #0b1221; }',
    '.titlebox .word { color: #e8eefc; }',
  ].join('\n');

  return {
    subredditName: process.env['REDDIT_COMMUNITY_NAME'] ?? 'VitaWellness',
    title: 'VitaWellness | Science-based recovery & hydration',
    publicDescription:
      'Manual-first hangover recovery community. Evidence-based, no automation, no spam.',
    sidebar,
    submitText:
      'Manual posts only. Share experiences, cite sources, avoid product pitches, and include NAD (Not A Doctor) when discussing health.',
    rules: [
      {
        shortName: 'No Spam or Self-Promotion',
        description:
          'No product links, coupon codes, or undisclosed affiliations. This is a community-first space.',
        violationReason: 'Spam/self-promotion',
        kind: 'all',
      },
      {
        shortName: 'Be Respectful',
        description:
          'Assume good intent, keep language civil, and avoid personal attacks or harassment.',
        violationReason: 'Harassment',
        kind: 'all',
      },
      {
        shortName: 'Science-Backed Claims Only',
        description:
          'Summarize evidence and cite reputable sources for health or supplement claims; avoid miracle-cure language.',
        violationReason: 'Unsupported claims',
        kind: 'all',
      },
      {
        shortName: 'No Medical Advice',
        description:
          'Do not diagnose or offer personalized treatment guidance. Encourage members to consult clinicians for health concerns.',
        violationReason: 'Medical advice',
        kind: 'all',
      },
    ],
    stylesheetCss,
  };
}

async function ensureSubreddit(
  client: Snoowrap,
  config: SetupConfig
): Promise<Subreddit> {
  const name = normalizeSubredditName(config.subredditName);
  try {
    const existing = (await client.getSubreddit(name).fetch()) as Subreddit;
    console.info(`Subreddit r/${existing.display_name} exists; skipping create.`);
    return existing;
  } catch (error) {
    const reason =
      error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error';
    console.warn(`Fetch for r/${name} failed (${reason}); attempting create next.`);
    if (dryRun) {
      console.info(
        `[dry-run] Would create subreddit r/${name} with type=restricted`
      );
      return client.getSubreddit(name);
    }

    console.info(`Creating subreddit r/${name}...`);
    const created = (await client.createSubreddit({
      name,
      title: config.title,
      public_description: config.publicDescription,
      description: config.sidebar,
      type: 'restricted',
      link_type: 'self',
      lang: 'en',
      over_18: false,
      allow_top: true,
      allow_images: true,
      show_media: true,
      spoilers_enabled: false,
      collapse_deleted_comments: true,
      submit_text_label: 'Manual posts only',
      submit_text: config.submitText,
      suggested_comment_sort: 'new',
    })) as Subreddit;

    console.info(`Created r/${created.display_name}.`);
    return created;
  }
}

async function applySettings(
  subreddit: Subreddit,
  config: SetupConfig
): Promise<void> {
  if (dryRun) {
    console.info('[dry-run] Would update subreddit settings and sidebar.');
    return;
  }

  await subreddit.editSettings({
    title: config.title,
    public_description: config.publicDescription,
    description: config.sidebar,
    submit_text: config.submitText,
    submit_text_label: 'Manual posts only',
    link_type: 'self',
    type: 'restricted',
    lang: 'en',
    over_18: false,
    allow_top: true,
    allow_images: true,
    show_media: true,
    spoilers_enabled: false,
    collapse_deleted_comments: true,
    suggested_comment_sort: 'new',
    wikimode: 'modonly',
  });

  // Old Reddit sidebar
  await subreddit.getWikiPage('config/sidebar').edit({
    text: config.sidebar,
    reason: 'Initial VitaWellness sidebar',
  });
}

async function applyRules(
  client: Snoowrap,
  subreddit: Subreddit,
  rules: RuleDefinition[]
): Promise<void> {
  const existingRules = (
    (await subreddit.getRules()) as SubredditRulesResponse
  ).rules;

  for (const [index, rule] of rules.entries()) {
    const alreadyExists = existingRules.some(
      (existingRule) =>
        existingRule.short_name.toLowerCase() === rule.shortName.toLowerCase()
    );

    if (alreadyExists) {
      console.info(`Rule "${rule.shortName}" already exists; skipping.`);
      continue;
    }

    if (dryRun) {
      console.info(`[dry-run] Would add rule "${rule.shortName}".`);
      continue;
    }

    await client.oauthRequest({
      uri: '/api/add_subreddit_rule',
      method: 'post',
      form: {
        api_type: 'json',
        r: subreddit.display_name,
        kind: rule.kind,
        short_name: rule.shortName,
        description: rule.description,
        violation_reason: rule.violationReason,
        priority: index,
      },
    });

    console.info(`Rule "${rule.shortName}" added.`);
  }
}

async function applyStylesheet(
  subreddit: Subreddit,
  stylesheetCss: string
): Promise<void> {
  if (dryRun) {
    console.info('[dry-run] Would update subreddit stylesheet.');
    return;
  }

  await subreddit.updateStylesheet({
    css: stylesheetCss,
    reason: 'Initial VitaWellness theme',
  });
}

async function main(): Promise<void> {
  const credentials = loadCredentials();
  const config = buildSetupConfig();

  console.info(`Dry run mode: ${dryRun ? 'ON' : 'OFF'}`);
  const client = new Snoowrap({
    userAgent: credentials.userAgent,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    refreshToken: credentials.refreshToken,
  });

  const subreddit = await ensureSubreddit(client, config);
  await applySettings(subreddit, config);
  await applyRules(client, subreddit, config.rules);
  await applyStylesheet(subreddit, config.stylesheetCss);

  console.info('Subreddit setup complete. Review settings in the Reddit UI.');
  if (dryRun) {
    console.info(
      'To apply changes, set SUBREDDIT_SETUP_DRY_RUN=false and rerun this script.'
    );
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error('Subreddit setup failed:', message);
  process.exit(1);
});
