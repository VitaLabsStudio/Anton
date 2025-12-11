import OpenAI from 'openai';

import { logger } from './logger';

const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
const baseURL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';

if (!apiKey) {
  logger.warn('No LLM API key provided. LLM features will fail.');
}

export const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key',
  baseURL,
});
