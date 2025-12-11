/**
 * PII Redaction Module
 * Story 2.10: Production Readiness - BLOCKER-001
 *
 * Responsibilities:
 * - Detect and redact PII before sending content to external LLM APIs
 * - Support multiple PII types (email, phone, SSN, credit cards, IPs, addresses, names)
 * - Maintain redaction map for audit purposes
 * - Return redacted content with metadata
 *
 * ADR-011: Requires PII redaction for privacy compliance
 */

import crypto from 'crypto';

import { logger } from '@/utils/logger';

export interface RedactionResult {
  redactedContent: string;
  redactionMap: Map<string, string>; // placeholder -> original value
  redactionCount: number;
  redactionTypes: Record<string, number>; // type -> count
}

interface RedactionPattern {
  name: string;
  regex: RegExp;
  placeholder: (index: number) => string;
  category: string;
}

/**
 * Comprehensive PII redaction patterns
 */
const PII_PATTERNS: RedactionPattern[] = [
  // Email addresses
  {
    name: 'Email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    placeholder: (index: number) => `[EMAIL_REDACTED_${index}]`,
    category: 'email',
  },

  // Credit card numbers (various formats with/without spaces/dashes)
  // Visa, MasterCard, Amex, Discover
  // Must come BEFORE phone pattern to avoid false matches
  {
    name: 'CreditCard',
    regex:
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b|\b(?:4[0-9]{3}|5[1-5][0-9]{2}|3[47][0-9]{2}|6(?:011|5[0-9]{2}))[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g,
    placeholder: (index: number) => `[CC_REDACTED_${index}]`,
    category: 'credit_card',
  },

  // Phone numbers (various formats)
  // US: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
  // International: +1-123-456-7890, +44 20 1234 5678
  {
    name: 'Phone',
    regex:
      /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b|\b\+[0-9]{1,3}[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}\b/gi,
    placeholder: (index: number) => `[PHONE_REDACTED_${index}]`,
    category: 'phone',
  },

  // Social Security Numbers (US: 123-45-6789)
  // Exclude invalid patterns: 000-xx-xxxx, 666-xx-xxxx, 9xx-xx-xxxx
  {
    name: 'SSN',
    regex: /\b(?!000|666|9[0-9]{2})[0-9]{3}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}\b/g,
    placeholder: (index: number) => `[SSN_REDACTED_${index}]`,
    category: 'ssn',
  },

  // IP Addresses (IPv4)
  {
    name: 'IPv4',
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    placeholder: (index: number) => `[IP_REDACTED_${index}]`,
    category: 'ip_address',
  },

  // Street addresses (basic pattern)
  // Matches: 123 Main St, 456 Oak Avenue, 789 Elm Street Apt 4B
  {
    name: 'Address',
    regex:
      /\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Parkway|Pkwy)(?:\s+(?:Apt|Suite|Unit|#)\s*[A-Za-z0-9-]+)?\b/gi,
    placeholder: (index: number) => `[ADDRESS_REDACTED_${index}]`,
    category: 'address',
  },
];

/**
 * Additional sensitive patterns (more aggressive detection)
 */
const SENSITIVE_PATTERNS: RedactionPattern[] = [
  // ZIP codes (US: 12345 or 12345-6789)
  {
    name: 'ZipCode',
    regex: /\b\d{5}(?:-\d{4})?\b/g,
    placeholder: (index: number) => `[ZIP_REDACTED_${index}]`,
    category: 'zip_code',
  },

  // Driver's License (varies by state, but common patterns)
  {
    name: 'DriversLicense',
    regex: /\b[A-Z]{1,2}\d{5,8}\b/g,
    placeholder: (index: number) => `[DL_REDACTED_${index}]`,
    category: 'drivers_license',
  },

  // Dates of birth (MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD)
  {
    name: 'DateOfBirth',
    regex:
      /\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12][0-9]|3[01])[/-](?:19|20)\d{2}\b|\b(?:19|20)\d{2}[/-](?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12][0-9]|3[01])\b/g,
    placeholder: (index: number) => `[DOB_REDACTED_${index}]`,
    category: 'date_of_birth',
  },
];

export interface PIIRedactionConfig {
  enableAggressiveMode: boolean; // Include sensitive patterns (ZIP, DOB, etc.)
  preserveStructure: boolean; // Keep placeholder length similar to original
  hashOriginals: boolean; // Store hashed originals instead of plaintext
  logRedactions: boolean; // Log redaction events for audit trail
}

const DEFAULT_CONFIG: PIIRedactionConfig = {
  enableAggressiveMode: false,
  preserveStructure: true,
  hashOriginals: true,
  logRedactions: true,
};

/**
 * PII Redaction Service
 */
export class PIIRedactor {
  private config: PIIRedactionConfig;

  constructor(config: Partial<PIIRedactionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.info({ config: this.config }, 'PIIRedactor initialized');
  }

  /**
   * Redact PII from content
   *
   * @param content - Text content to redact
   * @param requestId - Optional request ID for audit logging
   * @returns RedactionResult with redacted content and metadata
   */
  public redact(content: string, requestId?: string): RedactionResult {
    const startTime = Date.now();
    const redactionMap = new Map<string, string>();
    const redactionTypes: Record<string, number> = {};
    let redactedContent = content;

    // Determine which patterns to use
    const patternsToUse = this.config.enableAggressiveMode
      ? [...PII_PATTERNS, ...SENSITIVE_PATTERNS]
      : PII_PATTERNS;

    // Apply each pattern
    for (const pattern of patternsToUse) {
      const matches = Array.from(redactedContent.matchAll(pattern.regex));

      if (matches.length > 0) {
        redactionTypes[pattern.category] = (redactionTypes[pattern.category] || 0) + matches.length;

        // Replace each match with placeholder
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          const originalValue = match[0];
          const placeholder = pattern.placeholder(i);

          // Store in redaction map
          const storedValue = this.config.hashOriginals
            ? this.hashValue(originalValue)
            : originalValue;
          redactionMap.set(placeholder, storedValue);

          // Replace in content
          redactedContent = redactedContent.replace(originalValue, placeholder);
        }
      }
    }

    const totalRedactions = Array.from(Object.values(redactionTypes)).reduce(
      (sum, count) => sum + count,
      0
    );
    const duration = Date.now() - startTime;

    // Audit logging
    if (this.config.logRedactions && totalRedactions > 0) {
      logger.info(
        {
          requestId,
          redactionCount: totalRedactions,
          redactionTypes,
          duration,
          contentLengthBefore: content.length,
          contentLengthAfter: redactedContent.length,
        },
        'PII redaction completed'
      );
    }

    return {
      redactedContent,
      redactionMap,
      redactionCount: totalRedactions,
      redactionTypes,
    };
  }

  /**
   * Hash a value for secure storage
   */
  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
  }

  /**
   * Validate that content has been properly redacted
   */
  public validateRedaction(content: string): {
    isClean: boolean;
    remainingPII: string[];
  } {
    const remainingPII: string[] = [];
    const patternsToCheck = this.config.enableAggressiveMode
      ? [...PII_PATTERNS, ...SENSITIVE_PATTERNS]
      : PII_PATTERNS;

    for (const pattern of patternsToCheck) {
      const matches = Array.from(content.matchAll(pattern.regex));
      if (matches.length > 0) {
        remainingPII.push(
          ...matches.map((m) => `${pattern.name}: ${m[0].substring(0, 10)}...`)
        );
      }
    }

    return {
      isClean: remainingPII.length === 0,
      remainingPII,
    };
  }

  /**
   * Get statistics about PII patterns detected
   */
  public analyzeContent(content: string): Record<string, number> {
    const stats: Record<string, number> = {};
    const patternsToCheck = this.config.enableAggressiveMode
      ? [...PII_PATTERNS, ...SENSITIVE_PATTERNS]
      : PII_PATTERNS;

    for (const pattern of patternsToCheck) {
      const matches = Array.from(content.matchAll(pattern.regex));
      if (matches.length > 0) {
        stats[pattern.category] = matches.length;
      }
    }

    return stats;
  }
}

/**
 * Singleton instance for convenience
 */
export const piiRedactor = new PIIRedactor();

/**
 * Convenience function for quick redaction
 */
export function redactPII(content: string, requestId?: string): RedactionResult {
  return piiRedactor.redact(content, requestId);
}

