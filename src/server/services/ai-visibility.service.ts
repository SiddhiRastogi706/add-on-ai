import axios from 'axios';

export interface AiVisibilityConfig {
  openAiKey?: string;
  openAiModel: string;
  perplexityKey?: string;
  perplexityModel: string;
}

export interface CompetitorItem {
  name: string;
  domain?: string | null;
}

export interface BrandVisibilityDetectionParams {
  text: string;
  citations?: string[];
  businessName: string;
  websiteUrl?: string;
  competitors?: CompetitorItem[];
}

export interface BrandVisibilityDetectionResult {
  brandMentioned: boolean;
  mentionPosition: number | null; // 0-indexed character offset of first mention in response
  domainInCitations: boolean;
  competitorsMentioned: string[];
}

export interface EngineVisibilityResult extends BrandVisibilityDetectionResult {
  engine: 'OpenAI' | 'Perplexity';
  model: string;
  isLive: true;
  responsePreview: string;
  citations: string[];
}

/**
 * Extracts a clean domain hostname (e.g., "https://www.example.com/about" -> "example.com").
 */
export function extractCleanDomain(urlOrDomain?: string): string {
  if (!urlOrDomain) return '';
  let cleaned = urlOrDomain.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '');
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
  return cleaned;
}

/**
 * Pure brand and competitor visibility detection function.
 * Exported for standalone unit testing.
 *
 * Checks:
 * - Brand name case-insensitively in text
 * - Clean domain in text
 * - Clean domain in citation URLs
 * - Minimum character position of first brand/domain mention
 * - Competitor names and domains in text or citations
 */
export function detectBrandVisibility(
  params: BrandVisibilityDetectionParams
): BrandVisibilityDetectionResult {
  const { text = '', citations = [], businessName = '', websiteUrl = '', competitors = [] } = params;

  const textLower = text.toLowerCase();
  const nameLower = businessName.trim().toLowerCase();
  const cleanDomain = extractCleanDomain(websiteUrl);

  // 1. Detect Brand Mention in Text
  let nameIndex = -1;
  if (nameLower && nameLower.length > 1) {
    nameIndex = textLower.indexOf(nameLower);
  }

  let domainIndex = -1;
  if (cleanDomain && cleanDomain.length > 3) {
    domainIndex = textLower.indexOf(cleanDomain);
  }

  const brandMentioned = nameIndex !== -1 || domainIndex !== -1;

  // 2. Calculate First Mention Position
  let mentionPosition: number | null = null;
  if (nameIndex !== -1 && domainIndex !== -1) {
    mentionPosition = Math.min(nameIndex, domainIndex);
  } else if (nameIndex !== -1) {
    mentionPosition = nameIndex;
  } else if (domainIndex !== -1) {
    mentionPosition = domainIndex;
  }

  // 3. Detect Domain in Citations
  let domainInCitations = false;
  if (cleanDomain && cleanDomain.length > 3 && Array.isArray(citations)) {
    domainInCitations = citations.some((citationUrl) =>
      citationUrl.toLowerCase().includes(cleanDomain)
    );
  }

  // 4. Detect Competitors Mentioned
  const competitorsMentioned: string[] = [];
  for (const comp of competitors) {
    const compName = (comp.name || '').trim().toLowerCase();
    const compDomain = extractCleanDomain(comp.domain || '');

    const nameInText = compName && compName.length > 1 && textLower.includes(compName);
    const domainInText = compDomain && compDomain.length > 3 && textLower.includes(compDomain);
    const domainInCites =
      compDomain &&
      compDomain.length > 3 &&
      citations.some((c) => c.toLowerCase().includes(compDomain));

    if (nameInText || domainInText || domainInCites) {
      competitorsMentioned.push(comp.name);
    }
  }

  return {
    brandMentioned,
    mentionPosition,
    domainInCitations,
    competitorsMentioned: Array.from(new Set(competitorsMentioned)),
  };
}

export class AiVisibilityService {
  /**
   * Single credential helper resolving OpenAI and Perplexity configuration.
   * Can be swapped to per-organization encrypted DB storage in the future.
   */
  static getConfig(_organizationId?: string): AiVisibilityConfig {
    return {
      openAiKey: process.env.OPENAI_API_KEY,
      openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      perplexityKey: process.env.PERPLEXITY_API_KEY,
      perplexityModel: process.env.PERPLEXITY_MODEL || 'sonar',
    };
  }

  /**
   * Queries configured AI search engines (OpenAI and Perplexity) without any brand hints,
   * then evaluates organic brand visibility, citation presence, and competitor mentions.
   */
  static async checkLiveVisibility(params: {
    businessName: string;
    websiteUrl: string;
    query: string;
    competitors?: CompetitorItem[];
    organizationId?: string;
  }): Promise<{
    query: string;
    results: EngineVisibilityResult[];
    enginesChecked: string[];
    summary: {
      totalEngines: number;
      brandMentionedCount: number;
      citationsCount: number;
    };
  }> {
    const config = this.getConfig(params.organizationId);
    const results: EngineVisibilityResult[] = [];
    const enginesChecked: string[] = [];

    // The user query is sent with strictly NO hints about the business brand
    const prompt = params.query.trim();

    // 1. OpenAI Chat Completion
    if (config.openAiKey) {
      enginesChecked.push('OpenAI');
      try {
        const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: config.openAiModel,
            messages: [
              {
                role: 'system',
                content:
                  'You are a knowledgeable search assistant. Answer the user query thoroughly and objectively, recommending top industry solutions, tools, or vendors where relevant.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
          },
          {
            headers: {
              Authorization: `Bearer ${config.openAiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );

        const text = res.data?.choices?.[0]?.message?.content || '';
        const detection = detectBrandVisibility({
          text,
          citations: [],
          businessName: params.businessName,
          websiteUrl: params.websiteUrl,
          competitors: params.competitors,
        });

        results.push({
          engine: 'OpenAI',
          model: config.openAiModel,
          isLive: true,
          responsePreview: text.slice(0, 300) + (text.length > 300 ? '...' : ''),
          citations: [],
          ...detection,
        });
      } catch (err: any) {
        console.error('[AiVisibilityService] OpenAI query error:', {
          status: err.response?.status,
          message: err.response?.data?.error?.message || err.message,
        });
      }
    }

    // 2. Perplexity AI Chat Completion (with citations)
    if (config.perplexityKey) {
      enginesChecked.push('Perplexity');
      try {
        const res = await axios.post(
          'https://api.perplexity.ai/chat/completions',
          {
            model: config.perplexityModel,
            messages: [
              {
                role: 'system',
                content:
                  'You are a search and answer engine. Provide an accurate, comprehensive answer citing top authoritative sources and recognized brands.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 800,
          },
          {
            headers: {
              Authorization: `Bearer ${config.perplexityKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );

        const text = res.data?.choices?.[0]?.message?.content || '';
        const citations: string[] = Array.isArray(res.data?.citations) ? res.data.citations : [];

        const detection = detectBrandVisibility({
          text,
          citations,
          businessName: params.businessName,
          websiteUrl: params.websiteUrl,
          competitors: params.competitors,
        });

        results.push({
          engine: 'Perplexity',
          model: config.perplexityModel,
          isLive: true,
          responsePreview: text.slice(0, 300) + (text.length > 300 ? '...' : ''),
          citations,
          ...detection,
        });
      } catch (err: any) {
        console.error('[AiVisibilityService] Perplexity query error:', {
          status: err.response?.status,
          message: err.response?.data?.error?.message || err.message,
        });
      }
    }

    const brandMentionedCount = results.filter((r) => r.brandMentioned).length;
    const citationsCount = results.filter((r) => r.domainInCitations).length;

    return {
      query: prompt,
      results,
      enginesChecked,
      summary: {
        totalEngines: results.length,
        brandMentionedCount,
        citationsCount,
      },
    };
  }
}
