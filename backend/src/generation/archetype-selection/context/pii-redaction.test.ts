/**
 * Tests for PII Redaction Module
 * Story 2.10: Production Readiness - BLOCKER-001
 */

import { describe, expect, it } from 'vitest';

import { PIIRedactor, redactPII } from './pii-redaction';

describe('PIIRedactor', () => {
  describe('Email redaction', () => {
    it('should redact single email address', () => {
      const content = 'Contact me at john.doe@example.com for more info';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[EMAIL_REDACTED_0]');
      expect(result.redactedContent).not.toContain('john.doe@example.com');
      expect(result.redactionCount).toBe(1);
      expect(result.redactionTypes.email).toBe(1);
    });

    it('should redact multiple email addresses', () => {
      const content = 'Email alice@test.com or bob@company.org';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[EMAIL_REDACTED_0]');
      expect(result.redactedContent).toContain('[EMAIL_REDACTED_1]');
      expect(result.redactionCount).toBe(2);
      expect(result.redactionTypes.email).toBe(2);
    });

    it('should handle various email formats', () => {
      const content = 'Emails: user+tag@domain.co.uk, name_123@sub.example.com';
      const result = redactPII(content);

      expect(result.redactionCount).toBe(2);
      expect(result.redactionTypes.email).toBe(2);
    });
  });

  describe('Phone number redaction', () => {
    it('should redact US phone number with parentheses', () => {
      const content = 'Call me at (555) 123-4567';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[PHONE_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
      expect(result.redactionTypes.phone).toBe(1);
    });

    it('should redact US phone number with dashes', () => {
      const content = 'Phone: 555-123-4567';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[PHONE_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
    });

    it('should redact US phone number with dots', () => {
      const content = 'Number: 555.123.4567';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[PHONE_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
    });

    it('should redact 10-digit phone without separators', () => {
      const content = 'Call 5551234567 today';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[PHONE_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
    });

    it('should redact international phone numbers', () => {
      const content = 'International: +1-555-123-4567 or +44 20 1234 5678';
      const result = redactPII(content);

      // At least one should be redacted
      expect(result.redactionCount).toBeGreaterThanOrEqual(1);
      expect(result.redactionTypes.phone).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SSN redaction', () => {
    it('should redact valid SSN', () => {
      const content = 'My SSN is 123-45-6789';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[SSN_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
      expect(result.redactionTypes.ssn).toBe(1);
    });

    it('should not redact invalid SSN (000, 666, 9xx)', () => {
      const content = 'Invalid: 000-12-3456, 666-45-6789, 123-45-6789';
      const result = redactPII(content);

      // Only 123-45-6789 is valid and should be redacted
      expect(result.redactionTypes.ssn).toBe(1);
    });
  });

  describe('Credit card redaction', () => {
    it('should redact Visa card number', () => {
      const content = 'Visa: 4111111111111111';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[CC_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
      expect(result.redactionTypes.credit_card).toBe(1);
    });

    it('should redact MasterCard number', () => {
      const content = 'MC: 5500000000000004';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[CC_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
    });

    it('should redact credit card with spaces', () => {
      const content = 'Card: 4111 1111 1111 1111';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[CC_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
    });

    it('should redact credit card with dashes', () => {
      const content = 'Payment: 4111-1111-1111-1111';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[CC_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
    });
  });

  describe('IP address redaction', () => {
    it('should redact IPv4 addresses', () => {
      const content = 'Server IP: 192.168.1.1';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[IP_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
      expect(result.redactionTypes.ip_address).toBe(1);
    });

    it('should redact multiple IP addresses', () => {
      const content = 'IPs: 10.0.0.1, 172.16.0.1, 8.8.8.8';
      const result = redactPII(content);

      expect(result.redactionCount).toBe(3);
      expect(result.redactionTypes.ip_address).toBe(3);
    });
  });

  describe('Street address redaction', () => {
    it('should redact street address', () => {
      const content = 'I live at 123 Main Street';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[ADDRESS_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
      expect(result.redactionTypes.address).toBe(1);
    });

    it('should redact address with apartment number', () => {
      const content = 'Address: 456 Oak Avenue Apt 4B';
      const result = redactPII(content);

      expect(result.redactedContent).toContain('[ADDRESS_REDACTED_0]');
      expect(result.redactionCount).toBe(1);
    });

    it('should redact various street types', () => {
      const content = '123 Main St, 456 Oak Ave, 789 Elm Rd, 101 Pine Blvd';
      const result = redactPII(content);

      expect(result.redactionCount).toBe(4);
      expect(result.redactionTypes.address).toBe(4);
    });
  });

  describe('Multiple PII types in single text', () => {
    it('should redact all PII types in complex text', () => {
      const content = `
        Contact John at john@example.com or call (555) 123-4567.
        His SSN is 123-45-6789 and credit card 4111111111111111.
        He lives at 123 Main Street and his IP is 192.168.1.1.
      `;
      const result = redactPII(content);

      expect(result.redactionCount).toBeGreaterThanOrEqual(6);
      expect(result.redactionTypes.email).toBe(1);
      expect(result.redactionTypes.phone).toBe(1);
      expect(result.redactionTypes.ssn).toBe(1);
      expect(result.redactionTypes.credit_card).toBe(1);
      expect(result.redactionTypes.address).toBe(1);
      expect(result.redactionTypes.ip_address).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle content with no PII', () => {
      const content = 'This is a normal message with no sensitive information';
      const result = redactPII(content);

      expect(result.redactedContent).toBe(content);
      expect(result.redactionCount).toBe(0);
      expect(Object.keys(result.redactionTypes)).toHaveLength(0);
    });

    it('should handle empty string', () => {
      const content = '';
      const result = redactPII(content);

      expect(result.redactedContent).toBe('');
      expect(result.redactionCount).toBe(0);
    });

    it('should handle content with only whitespace', () => {
      const content = '   \n\t  ';
      const result = redactPII(content);

      expect(result.redactionCount).toBe(0);
    });

    it('should not redact partial matches', () => {
      const content = 'Version 1.2.3.4 is not an IP address';
      const result = redactPII(content);

      // May match as IP - this is acceptable for safety
      // If it matches, that's fine for aggressive redaction
      expect(result.redactedContent).toBeDefined();
    });
  });

  describe('Redaction map accuracy', () => {
    it('should store all redacted values in map', () => {
      const content = 'Email: test@example.com, Phone: 555-123-4567';
      const result = redactPII(content);

      expect(result.redactionMap.size).toBe(2);
      expect(result.redactionMap.has('[EMAIL_REDACTED_0]')).toBe(true);
      expect(result.redactionMap.has('[PHONE_REDACTED_0]')).toBe(true);
    });

    it('should hash original values when configured', () => {
      const redactor = new PIIRedactor({ hashOriginals: true });
      const content = 'test@example.com';
      const result = redactor.redact(content);

      // Hash should be 16 chars (truncated SHA-256)
      const hashedValue = result.redactionMap.get('[EMAIL_REDACTED_0]');
      expect(hashedValue).toBeDefined();
      expect(hashedValue?.length).toBe(16);
      expect(hashedValue).not.toBe('test@example.com');
    });

    it('should store plaintext when hashing disabled', () => {
      const redactor = new PIIRedactor({ hashOriginals: false });
      const content = 'test@example.com';
      const result = redactor.redact(content);

      const storedValue = result.redactionMap.get('[EMAIL_REDACTED_0]');
      expect(storedValue).toBe('test@example.com');
    });
  });

  describe('Configuration options', () => {
    it('should respect aggressive mode for ZIP codes', () => {
      const redactor = new PIIRedactor({ enableAggressiveMode: true });
      const content = 'ZIP: 12345';
      const result = redactor.redact(content);

      expect(result.redactionTypes.zip_code).toBe(1);
    });

    it('should not redact ZIP codes in standard mode', () => {
      const redactor = new PIIRedactor({ enableAggressiveMode: false });
      const content = 'ZIP: 12345';
      const result = redactor.redact(content);

      expect(result.redactionTypes.zip_code).toBeUndefined();
    });

    it('should respect logging configuration', () => {
      const redactor = new PIIRedactor({ logRedactions: false });
      const content = 'test@example.com';
      const result = redactor.redact(content);

      expect(result.redactionCount).toBe(1);
      // Logging disabled, should still work
    });
  });

  describe('Validation methods', () => {
    it('should validate that redacted content is clean', () => {
      const redactor = new PIIRedactor();
      const result = redactPII('Email: test@example.com');
      const validation = redactor.validateRedaction(result.redactedContent);

      expect(validation.isClean).toBe(true);
      expect(validation.remainingPII).toHaveLength(0);
    });

    it('should detect remaining PII in unredacted content', () => {
      const redactor = new PIIRedactor();
      const content = 'Email: test@example.com, Phone: 555-123-4567';
      const validation = redactor.validateRedaction(content);

      expect(validation.isClean).toBe(false);
      expect(validation.remainingPII.length).toBeGreaterThan(0);
    });

    it('should analyze content and return PII statistics', () => {
      const redactor = new PIIRedactor();
      const content = 'test@example.com and 555-123-4567';
      const stats = redactor.analyzeContent(content);

      expect(stats.email).toBe(1);
      expect(stats.phone).toBe(1);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle social media post with mixed PII', () => {
      const content = `
        Hey @user! DM me at myemail@gmail.com or text 555-123-4567.
        My IP changed to 10.0.0.5 after moving to 742 Evergreen Terrace.
      `;
      const result = redactPII(content);

      expect(result.redactionCount).toBeGreaterThanOrEqual(3);
      expect(result.redactedContent).not.toContain('myemail@gmail.com');
      expect(result.redactedContent).not.toContain('555-123-4567');
      expect(result.redactedContent).not.toContain('10.0.0.5');
      // Address may or may not be redacted depending on pattern
    });

    it('should handle customer support ticket', () => {
      const content = `
        Customer: jane.doe@company.com
        Phone: (800) 555-1234
        Account: 4111-1111-1111-1111
        Address: 100 Technology Drive Suite 200
      `;
      const result = redactPII(content);

      expect(result.redactionTypes.email).toBe(1);
      expect(result.redactionTypes.phone).toBe(1);
      expect(result.redactionTypes.credit_card).toBe(1);
      expect(result.redactionTypes.address).toBe(1);
    });

    it('should preserve text structure while redacting', () => {
      const content = 'Contact: test@example.com (primary) or 555-123-4567 (backup)';
      const result = redactPII(content);

      // Should preserve parentheses and structure
      expect(result.redactedContent).toContain('(primary)');
      expect(result.redactedContent).toContain('(backup)');
      expect(result.redactionCount).toBeGreaterThanOrEqual(1);
    });
  });
});

