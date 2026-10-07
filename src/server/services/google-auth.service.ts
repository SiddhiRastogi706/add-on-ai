import axios from 'axios';

export interface GoogleAuthConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // Epoch timestamp (ms)
}

export class GoogleAuthService {
  private static tokenCache: Map<string, CachedToken> = new Map();

  /**
   * Single credential resolver helper for Google OAuth credentials.
   * Can be swapped to per-organization encrypted DB storage in the future.
   */
  static getConfig(_organizationId?: string): GoogleAuthConfig {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    };
  }

  /**
   * Checks if Google OAuth credentials are fully provided.
   */
  static isConfigured(organizationId?: string): boolean {
    const config = this.getConfig(organizationId);
    return Boolean(config.clientId && config.clientSecret && config.refreshToken);
  }

  /**
   * Exchanges the OAuth refresh token for a live Google API Bearer access token.
   * Caches the access token until 60 seconds before expiry to avoid redundant network round-trips.
   */
  static async getAccessToken(organizationId?: string): Promise<string | null> {
    const config = this.getConfig(organizationId);

    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
      return null;
    }

    const cacheKey = `${config.clientId}_${config.refreshToken.slice(0, 10)}`;
    const cached = this.tokenCache.get(cacheKey);

    // If cached token exists and has >60 seconds of valid lifetime remaining, reuse it
    if (cached && cached.expiresAt > Date.now() + 60000) {
      return cached.accessToken;
    }

    try {
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: config.refreshToken,
          grant_type: 'refresh_token',
        },
        { timeout: 10000 }
      );

      const accessToken = response.data?.access_token;
      const expiresIn = response.data?.expires_in || 3600; // in seconds

      if (accessToken) {
        this.tokenCache.set(cacheKey, {
          accessToken,
          expiresAt: Date.now() + expiresIn * 1000,
        });
        return accessToken;
      }

      return null;
    } catch (err: any) {
      console.error('[GoogleAuthService] Failed to refresh Google access token:', {
        status: err.response?.status,
        message: err.response?.data?.error_description || err.message,
      });
      return null;
    }
  }

  /**
   * Helper to manually clear cache (useful for testing and key rotations).
   */
  static clearCache(): void {
    this.tokenCache.clear();
  }
}
