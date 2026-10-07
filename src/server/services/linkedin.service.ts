import axios from 'axios';

export interface LinkedInConfig {
  accessToken?: string;
  authorUrn?: string; // e.g. urn:li:person:XXXX or urn:li:organization:XXXX
}

export interface LinkedInPublishResult {
  success: boolean;
  postId?: string;
  permalink?: string;
  message: string;
}

export class LinkedInService {
  /**
   * Single credential helper resolving LinkedIn configuration.
   * Can be swapped to per-organization encrypted DB storage in the future.
   */
  static getConfig(_organizationId?: string): LinkedInConfig {
    return {
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
      authorUrn: process.env.LINKEDIN_AUTHOR_URN,
    };
  }

  /**
   * Publishes a post to LinkedIn using the v2 UGC Posts API.
   * Uses Restli Protocol 2.0.0 and PUBLIC member network visibility.
   */
  static async publishPost(
    text: string,
    organizationId?: string
  ): Promise<LinkedInPublishResult> {
    const config = this.getConfig(organizationId);

    if (!config.accessToken || !config.authorUrn) {
      return {
        success: false,
        message: 'LinkedIn credentials not configured (missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN)',
      };
    }

    try {
      const endpoint = 'https://api.linkedin.com/v2/ugcPosts';
      const body = {
        author: config.authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const res = await axios.post(endpoint, body, {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const postId = res.data?.id || res.headers?.['x-restli-id'] || `urn:li:ugcPost:${Date.now()}`;
      const permalink = `https://www.linkedin.com/feed/update/${postId}`;

      return {
        success: true,
        postId,
        permalink,
        message: 'Successfully published post to LinkedIn',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.errorDetails?.message ||
        err.message ||
        'Unknown LinkedIn API error';

      console.error('[LinkedInService] Publish error:', {
        status: err.response?.status,
        message: errorMsg,
      });

      return {
        success: false,
        message: `LinkedIn publishing failed: ${errorMsg}`,
      };
    }
  }
}
