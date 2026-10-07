import { getAIProvider } from '../factory';
import { CrawlerResult, BusinessProfileAI } from '../../../shared/types';
import { MemoryService } from '../../services/memory.service';

export class BIAgent {
  static async analyzeBusiness(
    business: {
      id: string;
      name: string;
      industry: string;
      description: string;
      productsAndServices: string[];
      targetAudience: string;
      brandTone: string;
    },
    crawlData?: CrawlerResult
  ): Promise<BusinessProfileAI> {
    const ai = getAIProvider();
    const memory = await MemoryService.getBusinessContextPrompt(business.id);

    const prompt = `Analyze this business and generate a complete Strategic Business Intelligence Profile:
Business Name: ${business.name}
Industry: ${business.industry}
Description: ${business.description}
Products & Services: ${business.productsAndServices.join(', ')}
Target Audience: ${business.targetAudience}
Brand Tone: ${business.brandTone}
Crawled Page Title: ${crawlData?.title || 'N/A'}
Crawled Meta: ${crawlData?.metaDescription || 'N/A'}
Detected Headings: ${crawlData?.h1?.join(' | ') || 'N/A'}
${memory}

Return JSON with this schema:
{
  "summary": "2-3 sentence strategic executive summary",
  "usps": ["USP 1", "USP 2", "USP 3", "USP 4"],
  "customerPains": ["Pain point 1", "Pain point 2", "Pain point 3"],
  "coreOfferings": [
    {"title": "Offering 1", "type": "product"|"service", "description": "short description"}
  ],
  "detectedBrandVoice": {
    "tone": "Brand voice tone",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "sentiment": "Overall communication sentiment"
  },
  "idealCustomerProfiles": [
    {
      "persona": "Persona Title",
      "demographics": "Age/Role/Company size",
      "challenges": ["challenge 1", "challenge 2"],
      "buyingTriggers": ["trigger 1", "trigger 2"]
    }
  ],
  "positioningStatement": "Strategic market positioning sentence",
  "growthTactics": ["Tactic 1", "Tactic 2", "Tactic 3"]
}`;

    try {
      const result = await ai.generateJson<any>(prompt, 'You are an elite Chief Marketing Officer and Business Intelligence Agent.');
      return {
        businessId: business.id,
        summary: result.summary || `Strategic market intelligence profile for ${business.name}.`,
        usps: result.usps || ['Autonomous digital scale', 'Predictable acquisition', 'Zero agency friction'],
        customerPains: result.customerPains || ['High CAC', 'Manual marketing fatigue', 'Inconsistent SEO'],
        coreOfferings: result.coreOfferings || [
          { title: business.productsAndServices[0] || 'Core Solution', type: 'service', description: 'Primary value driver.' },
        ],
        detectedBrandVoice: result.detectedBrandVoice || {
          tone: business.brandTone || 'Professional & Data-Driven',
          keywords: ['Growth', 'Efficiency', 'Authority'],
          sentiment: 'Inspiring and authoritative',
        },
        idealCustomerProfiles: result.idealCustomerProfiles || [
          {
            persona: 'Decision Maker',
            demographics: 'Business Owners & Executives',
            challenges: ['Scalability', 'Marketing ROI'],
            buyingTriggers: ['Automation', 'Transparent Growth'],
          },
        ],
        positioningStatement: result.positioningStatement || `The premier digital growth partner for ${business.industry}.`,
        growthTactics: result.growthTactics || ['Hyper-targeted local SEO', 'Multi-channel social syndication', 'Algorithmic ad optimization'],
        analyzedAt: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('BI Agent fallback triggered:', e);
      return {
        businessId: business.id,
        summary: `${business.name} is positioned to capture substantial market share in ${business.industry} through autonomous multi-channel distribution.`,
        usps: ['24/7 Continuous Marketing Execution', 'Precision Keyword Targeting', 'Strict Budget Emergency Guardrails'],
        customerPains: ['Time-consuming manual marketing', 'Uncertain ad ROAS', 'Underperforming organic search traffic'],
        coreOfferings: business.productsAndServices.map((p) => ({ title: p, type: 'service' as const, description: `High-value ${p} offering.` })),
        detectedBrandVoice: {
          tone: business.brandTone,
          keywords: ['Innovation', 'Scalability', 'Excellence'],
          sentiment: 'Confident and client-first',
        },
        idealCustomerProfiles: [
          {
            persona: 'Primary Buyer Persona',
            demographics: 'Founders & Marketing Directors',
            challenges: ['Scaling customer base', 'High marketing overhead'],
            buyingTriggers: ['Turnkey automation', 'Proven ROI'],
          },
        ],
        positioningStatement: `Empowering modern brands with autonomous 24/7 digital marketing intelligence.`,
        growthTactics: ['Deploy targeted SEO landing pages', 'Automated weekly social thought leadership', 'High-intent search ads with negative keyword pruning'],
        analyzedAt: new Date().toISOString(),
      };
    }
  }
}
