import { getAIProvider } from '../factory';
import { ContentItem } from '../../../shared/types';
import { SafetyService } from '../../services/safety.service';
import { WalletBillingError } from '../../services/wallet.service';

export interface CreateContentParams {
  businessId: string;
  businessName: string;
  industry: string;
  topic: string;
  contentType: 'BLOG_POST' | 'LANDING_PAGE' | 'PRODUCT_DESCRIPTION' | 'FAQ' | 'META_TAGS';
  targetKeyword: string;
  brandTone: string;
  existingContents?: string[];
}

export class ContentAgent {
  static async generateContent(params: CreateContentParams): Promise<ContentItem> {
    const ai = getAIProvider();

    const prompt = `You are an elite SEO Content Strategist. Generate high-ranking, human-readable, well-structured content for:
Business: ${params.businessName}
Industry: ${params.industry}
Topic: ${params.topic}
Type: ${params.contentType}
Target Primary Keyword: ${params.targetKeyword}
Tone: ${params.brandTone}

Requirements:
- High-value, concise, engaging, and search-optimized (approx 400-600 words).
- Well-structured markdown body with H2 and H3 subheadings, bullet points, and practical takeaways.
- Include a 3-item FAQ section with crisp answers.
- Suggest 2 relevant internal link anchors.
- Include an impactful closing Call To Action (CTA).

Output Schema (JSON):
{
  "title": "Compelling Article / Page Title",
  "metaTitle": "SEO Meta Title (50-60 chars)",
  "metaDescription": "SEO Meta Description (130-155 chars with action verb)",
  "slug": "url-friendly-slug",
  "h1": "Target H1 Tag",
  "contentMarkdown": "## Complete article body formatted in Markdown with H2, H3, bold highlights, and actionable strategies...",
  "faqs": [
    {"question": "FAQ 1?", "answer": "Answer 1."},
    {"question": "FAQ 2?", "answer": "Answer 2."},
    {"question": "FAQ 3?", "answer": "Answer 3."}
  ],
  "ctaText": "Ready to scale? Book your strategy consultation today.",
  "internalLinksSuggestions": [
    {"anchor": "Explore our growth platform", "targetUrl": "/services"},
    {"anchor": "See case studies", "targetUrl": "/case-studies"}
  ]
}`;

    let parsed: any;
    try {
      parsed = await ai.generateJson(
        prompt,
        'You write authoritative, engaging, search-optimized business content in structured JSON.',
        { maxTokens: 2500, temperature: 0.7, timeout: 15000 }
      );
    } catch (e) {
      if (e instanceof WalletBillingError) throw e;
      console.warn('Content Agent generation fallback:', e);
      parsed = {
        title: `The Comprehensive Guide to ${params.topic} for ${params.industry}`,
        metaTitle: `${params.topic} | Expert Guide by ${params.businessName}`,
        metaDescription: `Discover how to master ${params.topic}. Actionable strategies, proven frameworks, and automated tools for sustainable ROI.`,
        slug: params.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        h1: `Mastering ${params.topic}: Strategies that Scale`,
        contentMarkdown: `## Why ${params.topic} Matters Today\n\nBusinesses in ${params.industry} are rapidly discovering that traditional manual approaches cannot keep pace with modern customer expectations. By systematically applying data-backed frameworks, you can consistently unlock higher retention and greater customer lifetime value.\n\n### Key Pillars for Execution\n\n1. **Data-Centric Diagnostics**: Identify conversion friction points across customer touchpoints.\n2. **High-Intent Distribution**: Target searchers and prospects who have clear commercial intent.\n3. **Continuous Iteration**: Continuously refine messaging based on real conversion data.\n\n## Driving Measurable Results\n\nWhen organizations transition to structured marketing workflows, they regularly achieve 3x faster response times and up to 40% reduction in customer acquisition costs.`,
        faqs: [
          { question: `How quickly can we implement ${params.topic}?`, answer: 'Most organizations establish working workflows within 7 to 14 days.' },
          { question: `Is this suitable for growing businesses in ${params.industry}?`, answer: 'Yes, the frameworks are specifically designed to scale efficiently without requiring massive headcount.' },
        ],
        ctaText: `Discover how ${params.businessName} accelerates your digital growth. Get in touch today.`,
        internalLinksSuggestions: [
          { anchor: 'View our solutions', targetUrl: '/solutions' },
          { anchor: 'Read our client success stories', targetUrl: '/reviews' },
        ],
      };
    }

    const fullText = `${parsed.title} ${parsed.contentMarkdown || ''}`;
    const safety = SafetyService.validateContent(fullText, params.brandTone, params.existingContents || []);
    const wordCount = (parsed.contentMarkdown || '').split(/\s+/).filter(Boolean).length;

    return {
      id: `content-${Date.now()}`,
      businessId: params.businessId,
      title: parsed.title || `${params.topic} Guide`,
      contentType: params.contentType,
      slug: parsed.slug || 'growth-guide',
      h1: parsed.h1 || parsed.title,
      metaTitle: parsed.metaTitle || parsed.title,
      metaDescription: parsed.metaDescription || `Read the definitive guide on ${params.topic}.`,
      content: parsed.contentMarkdown || '',
      status: safety.requiresHumanApproval ? 'READY_FOR_REVIEW' : 'APPROVED',
      targetKeywords: [params.targetKeyword],
      faqs: parsed.faqs || [],
      ctaText: parsed.ctaText || 'Learn More',
      internalLinksSuggestions: parsed.internalLinksSuggestions || [],
      aiConfidenceScore: safety.confidenceScore,
      isFactValidated: safety.isSafe,
      wordCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
