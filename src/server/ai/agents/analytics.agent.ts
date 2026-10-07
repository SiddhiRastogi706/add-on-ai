import { MarketingAnalyticsSnapshot } from '../../../shared/types';

export class AnalyticsAgent {
  static getSnapshot(range: 'today' | '7d' | '30d' | '90d' = '30d'): MarketingAnalyticsSnapshot {
    const multipliers = {
      today: 0.05,
      '7d': 0.25,
      '30d': 1.0,
      '90d': 2.8,
      custom: 1.0,
    };
    const factor = multipliers[range] || 1.0;

    return {
      dateRange: range,
      websiteVisitors: Math.round(14820 * factor),
      visitorGrowthPercent: 24.6,
      trafficSources: [
        { source: 'Organic Search (SEO)', visitors: Math.round(6240 * factor), percentage: 42.1, color: '#537CF3' },
        { source: 'Paid Search (Google Ads)', visitors: Math.round(3480 * factor), percentage: 23.5, color: '#1CB77B' },
        { source: 'Social Media (SMO)', visitors: Math.round(2680 * factor), percentage: 18.1, color: '#FA8243' },
        { source: 'Direct & Referrals', visitors: Math.round(2420 * factor), percentage: 16.3, color: '#DC5495' },
      ],
      organicImpressions: Math.round(184000 * factor),
      organicClicks: Math.round(6240 * factor),
      totalLeads: Math.round(186 * factor),
      totalConversions: Math.round(64 * factor),
      adSpendTotal: Math.round(1680 * factor),
      roasAverage: 4.12,
      dailyTrend: [
        { date: 'Mon', visitors: Math.round(420 * factor), organic: Math.round(180 * factor), social: Math.round(90 * factor), ads: Math.round(110 * factor), leads: Math.max(1, Math.round(6 * factor)) },
        { date: 'Tue', visitors: Math.round(510 * factor), organic: Math.round(220 * factor), social: Math.round(110 * factor), ads: Math.round(130 * factor), leads: Math.max(1, Math.round(8 * factor)) },
        { date: 'Wed', visitors: Math.round(580 * factor), organic: Math.round(250 * factor), social: Math.round(130 * factor), ads: Math.round(140 * factor), leads: Math.max(1, Math.round(9 * factor)) },
        { date: 'Thu', visitors: Math.round(540 * factor), organic: Math.round(230 * factor), social: Math.round(120 * factor), ads: Math.round(135 * factor), leads: Math.max(1, Math.round(7 * factor)) },
        { date: 'Fri', visitors: Math.round(620 * factor), organic: Math.round(280 * factor), social: Math.round(140 * factor), ads: Math.round(150 * factor), leads: Math.max(1, Math.round(11 * factor)) },
        { date: 'Sat', visitors: Math.round(380 * factor), organic: Math.round(160 * factor), social: Math.round(80 * factor), ads: Math.round(100 * factor), leads: Math.max(1, Math.round(4 * factor)) },
        { date: 'Sun', visitors: Math.round(410 * factor), organic: Math.round(170 * factor), social: Math.round(90 * factor), ads: Math.round(105 * factor), leads: Math.max(1, Math.round(5 * factor)) },
      ],
    };
  }

  static generateDailySummary(businessName: string) {
    return {
      title: `Daily Marketing Digest for ${businessName}`,
      trafficGrowth: '+18.4% this week',
      seoStatus: '3 non-critical issues flagged for auto-resolution',
      socialStatus: '5 scheduled posts queued, 2 published today',
      adsStatus: '2 active campaigns performing at 4.1x ROAS',
      newLeadsCount: 12,
      aiCompletedActions: 7,
      pendingApprovalsCount: 1,
      quickSummaryText:
        'Your AI marketing team completed SEO crawling, scheduled 3 LinkedIn thought pieces, tuned Google search bids, and scored 12 incoming prospects.',
    };
  }
}
