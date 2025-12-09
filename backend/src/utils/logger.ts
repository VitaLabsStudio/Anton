import pino from 'pino';

export const logger = pino({
  level: process.env['LOG_LEVEL'] || 'info',
  transport:
    process.env['NODE_ENV'] === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: { service: 'antone', version: process.env['npm_package_version'] },
  redact: {
    paths: ['email', 'password', 'token', 'content', 'author.handle'],
    censor: '[REDACTED]',
  },
});
