/**
 * Shared types for stream monitor workers
 */

export type Platform = 'TWITTER' | 'REDDIT' | 'THREADS';

export interface DetectedPost {
  platform: Platform;
  platformPostId: string;
  authorId: string;
  authorHandle: string;
  authorDisplayName?: string;
  content: string;
  followerCount?: number;
  isVerified?: boolean;
  detectedAt: Date;
  rawMetrics?: Record<string, unknown>;
}

export interface MonitorStats {
  platform: Platform;
  postsScanned: number;
  postsReturned: number;
  lastScanAt: Date;
  errors: number;
}
