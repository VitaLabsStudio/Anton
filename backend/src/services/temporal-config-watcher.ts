import chokidar from 'chokidar';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { reloadTemporalConfig } from '../analysis/temporal-intelligence.js';
import { logger } from '../utils/logger.js';

const resolveRulesPath = (): string => {
  const envPath = process.env.TEMPORAL_RULES_PATH;
  if (envPath) {
    return path.resolve(process.cwd(), envPath);
  }
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '../config/temporal-rules.json');
};

const resolveHolidaysPath = (): string => {
  const envPath = process.env.TEMPORAL_HOLIDAYS_PATH;
  if (envPath) {
    return path.resolve(process.cwd(), envPath);
  }
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '../config/temporal-holidays.json');
};

let watcherStarted = false;

export const startTemporalConfigWatcher = (): void => {
  if (watcherStarted) return;
  const watchFlag = process.env.TEMPORAL_WATCH_CONFIG ?? 'false';
  if (watchFlag.toLowerCase() !== 'true') {
    return;
  }

  const rulesPath = resolveRulesPath();
  const holidaysPath = resolveHolidaysPath();

  const watcher = chokidar.watch([rulesPath, holidaysPath], {
    ignoreInitial: true,
  });

  watcher.on('change', (changedPath) => {
    logger.info({ changedPath }, 'Temporal config change detected, reloading');
    reloadTemporalConfig();
  });

  watcher.on('error', (error) => {
    logger.error({ error }, 'Temporal config watcher error');
  });

  watcherStarted = true;
  logger.info({ rulesPath, holidaysPath }, 'Temporal config watcher started');
};
