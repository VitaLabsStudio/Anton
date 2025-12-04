/**
 * Core contract that all social platform clients must implement.
 * This ensures consistency in how the rest of the system interacts with each platform.
 */
export interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    isVerified?: boolean;
    followerCount?: number;
  };
}

export interface ClientStatus {
  available: boolean;
  message: string;
}

export interface IPlatformClient {
  verifyCredentials(): Promise<ClientStatus>;
  search(query: string): Promise<Post[]>;
  reply(postId: string, content: string): Promise<{ replyId: string }>;
}

/**
 * ALL platform client implementations MUST satisfy this interface.
 * Use it to keep Twitter, Reddit, and Threads clients interchangeable.
 */
