/**
 * Setup verification tests for Story 1.1
 * These tests verify the testing framework is properly configured.
 */

import { describe, expect, it } from 'vitest';

import { APP_NAME, APP_VERSION, PLATFORMS } from '../constants/index.js';
import type { Platform } from '../types/index.js';

describe('Project Setup Verification', () => {
  describe('Constants', () => {
    it('should export APP_NAME', () => {
      expect(APP_NAME).toBe('Antone');
    });

    it('should export APP_VERSION', () => {
      expect(APP_VERSION).toBe('1.0.0');
    });

    it('should export PLATFORMS', () => {
      expect(PLATFORMS).toEqual({
        TWITTER: 'twitter',
        REDDIT: 'reddit',
        THREADS: 'threads',
      });
    });
  });

  describe('Types', () => {
    it('should allow valid Platform types', () => {
      const platform: Platform = 'twitter';
      expect(['twitter', 'reddit', 'threads']).toContain(platform);
    });
  });

  describe('Test Framework', () => {
    it('should run vitest tests successfully', () => {
      expect(true).toBe(true);
    });

    it('should support async tests', async () => {
      const result = await Promise.resolve('async works');
      expect(result).toBe('async works');
    });
  });
});
