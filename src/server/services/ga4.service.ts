import axios from 'axios';
import { GoogleAuthService } from './google-auth.service';

/**
 * ⚠️ GOOGLE OAUTH SCOPES REQUIREMENT:
 * To query the Google Analytics Data API (GA4), the OAuth refresh token must be generated
 * with the scope:
 *   https://www.googleapis.com/auth/analytics.readonly
 * in addition to:
 *   https://www.googleapis.com/auth/webmasters.readonly (for Google Search Console)
 */

export interface GA4Config {
  propertyId?: string;
}

export interface GA4ReportResult {
  configured: boolean;
  propertyId?: string;
  dateRange: string;
  totals: {
    sessions: number;
    activeUsers: number;
    conversions: number;
  };
  topSources: Array<{ sourceMedium: string; sessions: number }>;
  topPages: Array<{ pagePath: string; sessions: number }>;
  message?: string;
}

export class GA4Service {
  /**
   * Single credential helper resolving GA4 property ID.
   * Can be swapped to per-organization encrypted DB storage in the future.
   */
  static getConfig(_organizationId?: string): GA4Config {
    return {
      propertyId: process.env.GA4_PROPERTY_ID,
    };
  }

  /**
   * Fetches Google Analytics 4 performance metrics for the last 30 days via Google Analytics Data API v1beta.
   * Includes sessions, activeUsers, conversions, top source/medium, and top landing page paths.
   */
  static async getReport(
    propertyIdOverride?: string,
    organizationId?: string
  ): Promise<GA4ReportResult> {
    const config = this.getConfig(organizationId);
    const propertyId = propertyIdOverride || config.propertyId;

    if (!propertyId || !GoogleAuthService.isConfigured(organizationId)) {
      return {
        configured: false,
        dateRange: 'last 30 days',
        totals: { sessions: 0, activeUsers: 0, conversions: 0 },
        topSources: [],
        topPages: [],
        message: 'GA4 not configured. Ensure GA4_PROPERTY_ID and Google OAuth refresh token (with analytics.readonly scope) are set.',
      };
    }

    const accessToken = await GoogleAuthService.getAccessToken(organizationId);
    if (!accessToken) {
      return {
        configured: false,
        propertyId,
        dateRange: 'last 30 days',
        totals: { sessions: 0, activeUsers: 0, conversions: 0 },
        topSources: [],
        topPages: [],
        message: 'Failed to obtain Google access token. Verify Google OAuth credentials.',
      };
    }

    try {
      // Clean property ID format: numbers only or 'properties/12345678'
      const cleanPropertyId = propertyId.replace(/^properties\//, '');
      const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropertyId}:runReport`;

      const response = await axios.post(
        endpoint,
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionSourceMedium' }, { name: 'pagePath' }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'conversions' },
          ],
          metricAggregations: ['TOTAL'],
          limit: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const totalsRaw = response.data?.totals?.[0]?.metricValues || [];
      const totalSessions = parseInt(totalsRaw[0]?.value || '0', 10);
      const totalActiveUsers = parseInt(totalsRaw[1]?.value || '0', 10);
      const totalConversions = parseInt(totalsRaw[2]?.value || '0', 10);

      const rows = response.data?.rows || [];

      // Aggregate top traffic sources
      const sourcesMap = new Map<string, number>();
      const pagesMap = new Map<string, number>();

      for (const row of rows) {
        const source = row.dimensionValues?.[0]?.value || '(direct) / (none)';
        const page = row.dimensionValues?.[1]?.value || '/';
        const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);

        sourcesMap.set(source, (sourcesMap.get(source) || 0) + sessions);
        pagesMap.set(page, (pagesMap.get(page) || 0) + sessions);
      }

      const topSources = Array.from(sourcesMap.entries())
        .map(([sourceMedium, sessions]) => ({ sourceMedium, sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);

      const topPages = Array.from(pagesMap.entries())
        .map(([pagePath, sessions]) => ({ pagePath, sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);

      return {
        configured: true,
        propertyId: cleanPropertyId,
        dateRange: 'last 30 days',
        totals: {
          sessions: totalSessions,
          activeUsers: totalActiveUsers,
          conversions: totalConversions,
        },
        topSources,
        topPages,
        message: 'Live GA4 metrics retrieved successfully',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Unknown GA4 Data API error';

      console.error('[GA4Service] runReport error:', {
        status: err.response?.status,
        message: errorMsg,
      });

      return {
        configured: false,
        propertyId,
        dateRange: 'last 30 days',
        totals: { sessions: 0, activeUsers: 0, conversions: 0 },
        topSources: [],
        topPages: [],
        message: `GA4 API error: ${errorMsg}`,
      };
    }
  }
}
