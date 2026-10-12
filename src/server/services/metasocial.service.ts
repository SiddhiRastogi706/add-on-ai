import axios from 'axios';

export interface MetaSocialConfig {
  pageId?: string;
  pageAccessToken?: string;
  igUserId?: string;
  appSecret?: string;
}

export interface MetaPublishResult {
  success: boolean;
  postId?: string;
  permalink?: string;
  message: string;
}

export class MetaSocialService {
  /**
   * Single credential helper resolving Meta Social configuration.
   * Can be swapped to per-organization encrypted DB storage in the future.
   */
  static getConfig(_organizationId?: string): MetaSocialConfig {
    return {
      pageId: process.env.META_PAGE_ID,
      pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN,
      igUserId: process.env.META_IG_USER_ID,
      appSecret: process.env.META_APP_SECRET,
    };
  }

  /**
   * Publishes a post to a Facebook Page via Graph API v19.0.
   * If imageUrl is provided, publishes as a photo; otherwise as a feed status.
   */
  static async publishToFacebookPage(
    message: string,
    imageUrl?: string,
    organizationId?: string,
    mediaType: 'image' | 'video' = 'image'
  ): Promise<MetaPublishResult> {
    const config = this.getConfig(organizationId);

    if (!config.pageId || !config.pageAccessToken) {
      return {
        success: false,
        message: 'Facebook Page credentials not configured (missing META_PAGE_ID or META_PAGE_ACCESS_TOKEN)',
      };
    }

    try {
      if (mediaType === 'video' && imageUrl) {
        const endpoint = `https://graph.facebook.com/v19.0/${config.pageId}/videos`;
        const res = await axios.post(
          endpoint,
          {
            file_url: imageUrl,
            description: message,
            access_token: config.pageAccessToken,
          },
          { timeout: 30000 }
        );
        const postId = res.data?.id;
        return {
          success: true,
          postId,
          permalink: postId ? `https://facebook.com/${postId}` : undefined,
          message: 'Successfully published video to Facebook Page',
        };
      }

      if (imageUrl) {
        // Publish Photo
        const endpoint = `https://graph.facebook.com/v19.0/${config.pageId}/photos`;
        const res = await axios.post(
          endpoint,
          {
            url: imageUrl,
            caption: message,
            access_token: config.pageAccessToken,
          },
          { timeout: 10000 }
        );

        const postId = res.data?.post_id || res.data?.id;
        const permalink = postId ? `https://facebook.com/${postId}` : undefined;

        return {
          success: true,
          postId,
          permalink,
          message: 'Successfully published photo post to Facebook Page',
        };
      } else {
        // Publish Feed Message
        const endpoint = `https://graph.facebook.com/v19.0/${config.pageId}/feed`;
        const res = await axios.post(
          endpoint,
          {
            message,
            access_token: config.pageAccessToken,
          },
          { timeout: 10000 }
        );

        const postId = res.data?.id;
        const permalink = postId ? `https://facebook.com/${postId}` : undefined;

        return {
          success: true,
          postId,
          permalink,
          message: 'Successfully published feed post to Facebook Page',
        };
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Unknown Graph API error';
      console.error('[MetaSocialService] Facebook publish error:', {
        status: err.response?.status,
        message: errorMsg,
      });
      return {
        success: false,
        message: `Facebook publishing failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Publishes a post to Instagram Business/Creator Account via Graph API v19.0.
   * Instagram strictly requires an image URL and uses a 2-step container creation & publishing workflow.
   */
  static async publishToInstagram(
    caption: string,
    imageUrl?: string,
    organizationId?: string,
    mediaType: 'image' | 'video' = 'image'
  ): Promise<MetaPublishResult> {
    if (!imageUrl) {
      return {
        success: false,
        message: 'Instagram requires an image',
      };
    }

    const config = this.getConfig(organizationId);

    if (!config.igUserId || !config.pageAccessToken) {
      return {
        success: false,
        message: 'Instagram credentials not configured (missing META_IG_USER_ID or META_PAGE_ACCESS_TOKEN)',
      };
    }

    try {
      // Step 1: Create media container
      const containerEndpoint = `https://graph.facebook.com/v19.0/${config.igUserId}/media`;
      const containerParams =
        mediaType === 'video'
          ? { media_type: 'REELS', video_url: imageUrl, caption, access_token: config.pageAccessToken }
          : { image_url: imageUrl, caption, access_token: config.pageAccessToken };
      const containerRes = await axios.post(
        containerEndpoint,
        containerParams,
        { timeout: 30000 }
      );

      const creationId = containerRes.data?.id;
      if (!creationId) {
        return {
          success: false,
          message: 'Failed to create Instagram media container (no creation ID returned)',
        };
      }

      if (mediaType === 'video') {
        let statusCode = '';
        for (let attempt = 0; attempt < 60; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const status = await axios.get(`https://graph.facebook.com/v19.0/${creationId}`, {
            params: { fields: 'status_code', access_token: config.pageAccessToken },
            timeout: 10000,
          });
          statusCode = status.data?.status_code || '';
          if (statusCode === 'FINISHED') break;
          if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
            return { success: false, message: `Instagram video processing failed (${statusCode}).` };
          }
        }
        if (statusCode !== 'FINISHED') {
          return { success: false, message: 'Instagram video is still processing. Please try publishing again shortly.' };
        }
      }

      // Step 2: Publish media container
      const publishEndpoint = `https://graph.facebook.com/v19.0/${config.igUserId}/media_publish`;
      const publishRes = await axios.post(
        publishEndpoint,
        {
          creation_id: creationId,
          access_token: config.pageAccessToken,
        },
        { timeout: 10000 }
      );

      const publishedPostId = publishRes.data?.id;
      const permalink = publishedPostId ? `https://www.instagram.com/p/${publishedPostId}` : undefined;

      return {
        success: true,
        postId: publishedPostId,
        permalink,
        message: mediaType === 'video' ? 'Successfully published Reel to Instagram' : 'Successfully published post to Instagram',
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Unknown Instagram Graph API error';
      console.error('[MetaSocialService] Instagram publish error:', {
        status: err.response?.status,
        message: errorMsg,
      });
      return {
        success: false,
        message: `Instagram publishing failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Creates a draft ad campaign in PAUSED mode on the verified Meta Ad Account (act_1412096886566594).
   * This allows the user to open Meta Ads Manager directly, review their campaign, pay, and launch live.
   */
  static async createAdCampaignDraft(
    name: string,
    objective: string = 'OUTCOME_ENGAGEMENT',
    organizationId?: string
  ): Promise<{ success: boolean; campaignId?: string; permalink?: string; message: string }> {
    const config = this.getConfig(organizationId);
    const token = config.pageAccessToken;
    const rawActId = process.env.META_AD_ACCOUNT_ID || 'act_1412096886566594';
    const cleanAct = rawActId.startsWith('act_') ? rawActId : `act_${rawActId}`;
    const cleanActNumber = rawActId.replace(/[^0-9]/g, '') || '1412096886566594';

    if (!token) {
      return {
        success: false,
        message: 'Meta Access Token is missing',
      };
    }

    try {
      const res = await axios.post(
        `https://graph.facebook.com/v19.0/${cleanAct}/campaigns`,
        {
          name: name || 'Addon AI - Commercial Ad Creative',
          objective: objective || 'OUTCOME_ENGAGEMENT',
          status: 'PAUSED',
          special_ad_categories: ['NONE'],
          is_adset_budget_sharing_enabled: false,
          access_token: token,
        },
        { timeout: 15000 }
      );

      const campaignId = res.data?.id;
      const permalink = campaignId
        ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${cleanActNumber}&campaign_id=${campaignId}`
        : `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${cleanActNumber}`;

      return {
        success: true,
        campaignId,
        permalink,
        message: `Real Meta Ad Campaign Draft created successfully (ID: ${campaignId}). Status: PAUSED. Open Meta Ads Manager to set budget & run live!`,
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      return {
        success: false,
        message: `Could not draft campaign on Ad Account: ${errorMsg}`,
      };
    }
  }
}
