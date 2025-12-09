import '../../env-config';
import { Writable } from 'node:stream';

import pino from 'pino';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Logger Utility', () => {
  let logOutput: string[] = [];
  let customStream: Writable;

  beforeEach(() => {
    logOutput = [];
    customStream = new Writable({
      write(chunk, _encoding, callback) {
        logOutput.push(chunk.toString());
        callback();
      },
    });
  });

  it('should log in NDJSON format in production', () => {
    const testLogger = pino(
      {
        level: 'info',
        base: { service: 'antone', version: '1.0.0' },
      },
      customStream
    );

    testLogger.info({ test: 'data' }, 'test message');

    expect(logOutput.length).toBe(1);
    const logEntry = JSON.parse(logOutput[0]);
    expect(logEntry.level).toBe(30); // info level
    expect(logEntry.msg).toBe('test message');
    expect(logEntry.test).toBe('data');
    expect(logEntry.time).toBeDefined();
    expect(logEntry.service).toBe('antone');
    expect(logEntry.version).toBeDefined();
  });

  it('should redact sensitive information', () => {
    const testLogger = pino(
      {
        level: 'info',
        base: { service: 'antone', version: '1.0.0' },
        redact: {
          paths: ['email', 'password', 'token', 'content', 'author.handle'],
          censor: '[REDACTED]',
        },
      },
      customStream
    );

    const sensitiveData = {
      email: 'test@example.com',
      password: 'mysecretpassword',
      token: 'some_jwt_token',
      content: 'This is some sensitive post content.',
      author: { handle: '@sensitive_handle' },
      normal: 'ok',
    };
    testLogger.info(sensitiveData, 'redaction test');

    expect(logOutput.length).toBe(1);
    const logEntry = JSON.parse(logOutput[0]);
    expect(logEntry.email).toBe('[REDACTED]');
    expect(logEntry.password).toBe('[REDACTED]');
    expect(logEntry.token).toBe('[REDACTED]');
    expect(logEntry.content).toBe('[REDACTED]');
    expect(logEntry.author.handle).toBe('[REDACTED]');
    expect(logEntry.normal).toBe('ok');
  });

  it('should propagate requestId in child loggers', () => {
    const testLogger = pino(
      {
        level: 'info',
        base: { service: 'antone', version: '1.0.0' },
      },
      customStream
    );

    const requestId = 'test-request-123';
    const childLogger = testLogger.child({ requestId });

    childLogger.info('child logger test');

    expect(logOutput.length).toBe(1);
    const logEntry = JSON.parse(logOutput[0]);
    expect(logEntry.requestId).toBe(requestId);
    expect(logEntry.msg).toBe('child logger test');
  });

  it('should use correct format with base fields', () => {
    const testLogger = pino(
      {
        level: 'info',
        base: { service: 'antone', version: '1.0.0' },
      },
      customStream
    );

    testLogger.info({ test: 'data' }, 'test message');

    expect(logOutput.length).toBe(1);
    const logEntry = JSON.parse(logOutput[0]);

    // Verify base fields are present
    expect(logEntry.service).toBe('antone');
    expect(logEntry.version).toBe('1.0.0');
    expect(logEntry.msg).toBe('test message');
  });
});
