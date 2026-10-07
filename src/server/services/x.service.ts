import axios from 'axios';

export interface XConfig {
  accessToken?: string;
}

export interface XPublishResult {
  success: boolean;
  postId?: string;
  permalink?: string;
  message: string;
}

export class XService {
  /**
   * Single credential helper resolving X (Twitter) configuration.
   * Can be swapped to per-organization encrypted DB storage in the future.
   */
  static getConfig(_organizationId?: string): XConfig {
    return {
      accessToken: process.env.X_ACCESS_TOKEN,
    };
  }

  /**
   * Validates tweet length strictly against the 280-character limit.
   */
  static validateTweetLength(text: string): { valid: boolean; length: number; error?: string } {
    const length = text.length;
    if (length > 280) {
      return {
        valid: false,
        length,
        error: `Tweet exceeds 280 characters (${length}/280). Refusing to truncate silently.`,
      };
    }
    return { valid: true, length };
  }

  /**
   * Publishes a tweet to X using Twitter API v2 (/2/tweets).
   * Strictly enforces character validation and uses Bearer token authorization.
   */
  static async publishTweet(
    text: string,
    organizationId?: string
  ): Promise<XPublishResult> {
    // 1. Strict length validation
    const validation = this.validateTweetLength(text);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error!,
      };
    }

    // 2. Resolve credentials
    const config = this.getConfig(organizationId);
    if (!config.accessToken) {
      return {
        success: false,
        message: 'X (Twitter) credentials not configured (missing X_ACCESS_TOKEN)',
      };
    }

    try {
      const endpoint = 'https://api.twitter.com/2/tweets';
      const res = await axios.post(
        endpoint,
        { text },
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const tweetId = res.data?.data?.id;
      const permalink = tweetId ? `https://x.com/i/web/status/${tweetId}` : undefined;

      return {
        success: true,
        postId: tweetId,
        permalink,
        message: 'Successfully published tweet to X',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.title ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Unknown X API error';

      console.error('[XService] Tweet publish error:', {
        status: err.response?.status,
        message: errorMsg,
      });

      return {
        success: false,
        message: `X publishing failed: ${errorMsg}`,
      };
    }
  }
}
