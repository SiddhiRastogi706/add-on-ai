import { getAIProvider } from '../factory';
import { AdCampaign } from '../../../shared/types';
import { SafetyService } from '../../services/safety.service';
import { WalletBillingError } from '../../services/wallet.service';

export class AdsAgent {
  static async planCampaign(business: {
    id: string;
    name: string;
    industry: string;
    productsAndServices: string[];
    monthlyBudget: number;
    dailyBudgetLimit: number;
    brandTone: string;
  }, platform: 'google_ads' | 'meta_ads'): Promise<AdCampaign> {
    const ai = getAIProvider();

    const prompt = `You are a Senior Performance Marketing Director specializing in ${platform === 'google_ads' ? 'Google Search Ads' : 'Meta Paid Ads (Facebook & Instagram)'}.
Create a high-converting acquisition campaign for:
Business: ${business.name}
Industry: ${business.industry}
Key Offerings: ${business.productsAndServices.join(', ')}
Daily Cap: $${Math.min(business.dailyBudgetLimit, 75)}
Tone: ${business.brandTone}

Requirements:
${platform === 'google_ads' ? '- Provide 4 punchy headlines (< 30 characters each) and 3 benefit-driven descriptions (< 90 characters each).\n- Suggest 5 negative keywords to prevent wasted spend.' : '- Provide 2 captivating primary texts, 2 headlines (< 40 characters), and targeted interest audience categories.'}

Return JSON with this schema:
{
  "campaignName": "Target Campaign Name",
  "objective": "LEADS"|"CONVERSIONS"|"TRAFFIC",
  "dailyBudget": 45,
  "headlines": ["Headline 1", "Headline 2", "Headline 3"],
  "descriptions": ["Description 1", "Description 2"],
  "targetAudience": "Target audience demographic & interest description",
  "negativeKeywords": ["free", "cheap", "torrent", "jobs", "internship"],
  "creativeConcept": "High-converting visual or video ad angle",
  "callToAction": "Get Started"|"Book a Demo"|"Claim Free Audit"
}`;

    let parsed: any;
    try {
      parsed = await ai.generateJson(prompt, 'You build high-ROAS, compliant digital ad campaigns.');
    } catch (e) {
      if (e instanceof WalletBillingError) throw e;
      console.warn('Ads Agent fallback triggered:', e);
      if (platform === 'google_ads') {
        parsed = {
          campaignName: `${business.name} - In-Market Search Intent`,
          objective: 'LEADS',
          dailyBudget: Math.min(business.dailyBudgetLimit, 50),
          headlines: [
            `${business.name} Growth`,
            'Automate Your Marketing',
            'Predictable Inbound Leads',
            'Try Free Today',
          ],
          descriptions: [
            'Stop manual marketing tasks. Our autonomous platform runs your SEO and ads 24/7.',
            'Scale customer acquisition with intelligent multi-channel automation. See demo.',
          ],
          targetAudience: 'In-market searchers searching for marketing automation and growth services',
          negativeKeywords: ['free download', 'crack', 'internship', 'wikipedia', 'cheap'],
          creativeConcept: 'Clean responsive search layout focusing on immediate ROI and time saved.',
          callToAction: 'Start Free Trial',
        };
      } else {
        parsed = {
          campaignName: `${business.name} - Meta Retargeting & Lookalike`,
          objective: 'CONVERSIONS',
          dailyBudget: Math.min(business.dailyBudgetLimit, 40),
          headlines: [
            '24/7 AI Marketing Team',
            'Scale Customer Acquisition',
          ],
          descriptions: [
            'Founders in your industry are 10x-ing customer growth with zero agency retainers. Tap to see the system in action.',
            'Automate your SEO, social calendars, and ad optimization in one intelligent dashboard.',
          ],
          targetAudience: 'Business Owners, Marketing Managers, Startup Founders interested in Growth Hacking & SaaS',
          creativeConcept: 'High-contrast pastel card showcasing before/after revenue graphs with subtle animated glow.',
          callToAction: 'Learn More',
        };
      }
    }

    const fullCopy = `${(parsed.headlines || []).join(' ')} ${(parsed.descriptions || []).join(' ')}`;
    const safety = SafetyService.validateContent(fullCopy, business.brandTone);

    return {
      id: `camp-${Date.now()}`,
      businessId: business.id,
      platform,
      campaignName: parsed.campaignName || `${business.name} Campaign`,
      objective: parsed.objective || 'LEADS',
      dailyBudget: parsed.dailyBudget || 45,
      status: safety.requiresHumanApproval ? 'APPROVAL_REQUIRED' : 'ACTIVE',
      headlines: parsed.headlines || ['Accelerate Your Growth', 'Discover MarketMind AI'],
      descriptions: parsed.descriptions || ['Turn your marketing into an autonomous growth engine. Get started in minutes.'],
      targetAudience: parsed.targetAudience || 'Target business decision makers',
      negativeKeywords: parsed.negativeKeywords || ['free', 'cheap', 'torrent'],
      creativeConcept: parsed.creativeConcept || 'Clean modern brand graphic with clear value proposition.',
      callToAction: parsed.callToAction || 'Get Started',
      metrics: {
        impressions: 14850,
        clicks: 642,
        spend: 485.50,
        conversions: 38,
        ctrPercent: 4.32,
        cpcAvg: 0.76,
        roas: 3.84,
        isLiveConnected: false, // Honesty flag: Demo sandbox data clearly noted
      },
      createdAt: new Date().toISOString(),
    };
  }
}
