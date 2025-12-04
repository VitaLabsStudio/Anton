/**
 * Shared type definitions for Antone
 */

// Platform types
export type Platform = 'twitter' | 'reddit' | 'threads';

// Decision mode types
export type DecisionMode = 'AUTO_POST' | 'APPROVE' | 'SKIP' | 'ESCALATE';

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services?: Record<string, boolean>;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
