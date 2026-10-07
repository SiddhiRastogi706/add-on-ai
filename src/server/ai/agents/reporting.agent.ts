import { ExecutiveReport } from '../../../shared/types';

export class ReportingAgent {
  static generateReport(
    business: { id: string; name: string; industry: string },
    type: 'DAILY_DIGEST' | 'WEEKLY_REVIEW' | 'MONTHLY_STRATEGY' = 'WEEKLY_REVIEW'
  ): ExecutiveReport {
    const periodLabels = {
      DAILY_DIGEST: 'Today (Last 24 Hours)',
      WEEKLY_REVIEW: 'Past 7 Days Performance Review',
      MONTHLY_STRATEGY: 'Monthly Executive Strategic Audit',
    };

    return {
      id: `rep-${Date.now()}`,
      businessId: business.id,
      type,
      periodLabel: periodLabels[type],
      createdAt: new Date().toISOString(),
      sections: {
        whatHappened: `Total cross-channel reach expanded by +22.4% during this reporting cycle. Website organic visitors climbed to 3,420, while paid search conversion rates maintained an efficient 4.2% rate with zero manual ad adjustments.`,
        whyItHappened: `The AI SEO agent identified and targeted 5 high-converting long-tail keyword clusters, while the social media agent maintained consistent thought-leadership syndication across LinkedIn and Instagram during peak engagement windows.`,
        whatAiDid: [
          'Crawled and indexed 14 website pages for technical health signals.',
          'Automatically generated and scheduled 7 multi-platform social media posts.',
          'Pruned 8 negative search terms from Google Ads to prevent ad budget wastage.',
          'Detected 3 technical on-page SEO issues and formulated remediation patches.',
          'Classified and enriched 12 inbound leads with automated follow-up priorities.',
        ],
        whatWorked: [
          'LinkedIn case study breakdown generated a 6.2% engagement rate, outperforming the benchmark.',
          'High-intent Google Search Ads achieved a $0.76 CPC, delivering 38 qualified conversions.',
          'Meta retargeting ad creative variant B achieved a 4.1x Return on Ad Spend (ROAS).',
        ],
        whatDidNotWork: [
          'Generic weekend lifestyle social posts received lower interaction and will be substituted with educational infographics.',
          'Homepage response latency hovered around 2.4s, which the technical SEO agent has flagged for image optimization.',
        ],
        nextSteps: [
          'Deploy the proposed localized SEO landing page to capture growing local search volume.',
          'Reallocate $15/day from broad display placements into the top-converting search ad group.',
          'Execute automated email outreach sequences for the 4 newly flagged Hot leads.',
        ],
      },
      metricsSummary: {
        trafficChangePct: 22.4,
        leadsGenerated: 18,
        adSpend: 485.50,
        avgRoas: 4.1,
        seoIssuesFixed: 4,
        socialPostsPublished: 7,
      },
    };
  }
}
