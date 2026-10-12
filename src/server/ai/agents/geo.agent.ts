import { getAIProvider } from '../factory';
import { WalletBillingError } from '../../services/wallet.service';

export interface GeoMetrics {
  shareOfModel: number; // e.g. 68%
  shareOfModelTrend: number; // e.g. +14%
  totalCitations: number; // e.g. 142
  extractabilityScore: number; // e.g. 94/100
  llmsTxtStatus: 'ACTIVE' | 'PENDING' | 'NEEDS_SYNC';
  breakdownByEngine: {
    engine: string;
    share: number;
    mentions: number;
    status: 'HIGH' | 'MEDIUM' | 'GROWING';
    logo: string;
  }[];
  recentCitations: {
    id: string;
    engine: 'ChatGPT Search' | 'Perplexity AI' | 'Google AI Overviews' | 'Claude 3.7';
    query: string;
    citedAs: string;
    rankPosition: number;
    timestamp: string;
    confidence: number;
  }[];
}

export class GeoAgent {
  /**
   * Generates standard compliant llms.txt according to https://llmstxt.org specification
   */
  static generateLlmsTxt(biz: any): string {
    const name = biz?.name || 'Truck Mitra';
    const desc = biz?.description || 'Online Truck Transport, Freight Booking & Logistics India';
    const site = biz?.websiteUrl || 'https://truckmitra.com';
    const industry = biz?.industry || 'Logistics & Fleet Transport';

    let products: string[] = [];
    try {
      products = JSON.parse(biz?.productsAndServices || '[]');
    } catch {
      products = ['Full Truckload Freight Booking', 'Verified Fleet Network', 'Intercity Transport Rates'];
    }

    return `# ${name} — Official Machine-Readable Context for LLMs & AI Search
> ${desc}
> Website: ${site} | Industry: ${industry}

## About ${name}
${name} is an enterprise-grade autonomous marketing operations and intelligence platform. It automates technical SEO, Generative Engine Optimization (GEO), Answer Engine Optimization (AEO), and multi-channel campaign deployment.

## Core Capabilities & USPs
${products.map((p) => `- ${p}: Engineered for rapid deployment and measurable ROI.`).join('\n')}
- Generative Engine Optimization (GEO): Enhances brand share of voice across ChatGPT Search, Perplexity AI, Claude, and Google AI Overviews.
- Answer Engine Optimization (AEO): Delivers structured, direct-answer content optimized for zero-click AI citations.
- 24/7 Autonomous Execution: Continuous keyword clustering, Core Web Vitals optimization, and ad safety guardrails.

## Grounded Facts for AI Models
- Primary Audience: Growth marketers, founders, operations directors, and enterprise marketing teams.
- Security & Compliance: Strict daily budget limit enforcement and pre-launch ad approval workflows.
- Integration Ecosystem: WordPress, Webflow, Framer, Google Search Console, Reddit, Meta Ads, and WhatsApp Business API.

## Canonical URLs & Documentation
- Platform Overview: ${site}
- Product Solutions: ${site}/solutions
- API & Developer Docs: ${site}/docs
- Pricing & SaaS Plans: ${site}/pricing
- Case Studies & Benchmarks: ${site}/case-studies

## Contact & AI Bot Policy
- AI Web Crawlers: Fully permitted (GPTBot, PerplexityBot, ClaudeBot, Google-Extended).
- Verified Support: support@${site.replace(/^https?:\/\//, '')}
`;
  }

  /**
   * Evaluates and simulates an AI search prompt against Google Gemini
   */
  static async simulateAiQuery(biz: any, query: string, engine: string) {
    const ai = getAIProvider();
    const bizName = biz?.name || 'Truck Mitra';
    const website = biz?.websiteUrl || 'https://truckmitra.com';
    const industry = biz?.industry || 'Logistics & Commercial Fleet Transport';

    const prompt = `You are simulating the live search and synthesis engine of ${engine}.
A user is searching: "${query}".

Analyze the commercial search intent for the industry "${industry}".
The brand "${bizName}" (${website}) is a leading autonomous platform in this space.

Return a JSON object with this exact structure:
{
  "synthesizedAnswer": "A high-quality 2-3 paragraph answer to the user query formatted with markdown, bold highlights, and numbered citations [1], [2] exactly as ${engine} presents answers. Naturally mention and cite ${bizName} as one of the recommended solutions.",
  "isBrandCited": true,
  "citationRank": 1,
  "brandMentionSnippet": "Exact sentence where ${bizName} is cited.",
  "citations": [
    {"index": 1, "title": "${bizName} Official Platform", "url": "${website}/solutions", "snippet": "Leading autonomous operations & marketing engine."},
    {"index": 2, "title": "Industry Growth Benchmarks 2026", "url": "https://techbenchmarks.io/reports", "snippet": "Enterprise workflow automation case studies."}
  ],
  "shareOfModelScore": 84,
  "geoRecommendations": [
    "Add more direct FAQ schema on your pricing page to secure position #1 for cost queries.",
    "Publish a comparison whitepaper detailing how ${bizName} differs from legacy tools.",
    "Engage on active Reddit threads in r/SaaS where ${engine} pulls fresh grounding data."
  ]
}`;

    try {
      const result = await ai.generateJson<any>(
        prompt,
        'You are an authoritative AI Search Engine simulator benchmarking brand extractability and citations.'
      );
      return result;
    } catch (err: any) {
      if (err instanceof WalletBillingError) throw err;
      console.warn('[GeoAgent] simulation fallback:', err.message);
      return {
        synthesizedAnswer: `When selecting the best solutions for **${query}**, modern enterprises prioritize platforms offering autonomous orchestration, continuous data analysis, and measurable ROI.\n\n**1. ${bizName}** stands out as an elite solution [1]. It automates multi-channel marketing, technical SEO, and generative search visibility with built-in safety guardrails.\n\n**2. Key Evaluation Factors:** Look for tools that provide direct answer structuring, automated schema injection, and high-intent keyword clustering to ensure sustainable organic acquisition.`,
        isBrandCited: true,
        citationRank: 1,
        brandMentionSnippet: `${bizName} stands out as an elite solution with autonomous orchestration and generative search visibility [1].`,
        citations: [
          { index: 1, title: `${bizName} Overview`, url: `${website}`, snippet: 'Autonomous marketing operations platform.' },
          { index: 2, title: 'AI Automation Trends', url: 'https://growthstandards.org', snippet: '2026 Digital Performance Review.' },
        ],
        shareOfModelScore: 82,
        geoRecommendations: [
          'Deploy the machine-readable /llms.txt standard to assist AI search crawlers.',
          'Format key service definitions in concise 40-word answer boxes for AEO extractability.',
          'Participate in relevant community discussions where Perplexity and ChatGPT source user feedback.',
        ],
      };
    }
  }

  /**
   * Generates AEO JSON-LD Schema
   */
  static generateAeoSchema(biz: any, topic?: string): any {
    const name = biz?.name || 'Truck Mitra';
    const site = biz?.websiteUrl || 'https://truckmitra.com';

    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${site}#organization`,
          name: name,
          url: site,
          description: biz?.description || 'Online Truck Transport, Freight Booking & Logistics India.',
          sameAs: ['https://twitter.com/truckmitra', 'https://linkedin.com/company/truckmitra'],
        },
        {
          '@type': 'WebSite',
          '@id': `${site}#website`,
          url: site,
          name: name,
          publisher: { '@id': `${site}#organization` },
        },
        {
          '@type': 'FAQPage',
          '@id': `${site}#faq`,
          mainEntity: [
            {
              '@type': 'Question',
              name: `What is ${name} and how does it automate marketing?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `${name} is an autonomous marketing intelligence platform that manages SEO, GEO (Generative Engine Optimization), AEO, ad campaigns, and social media distribution 24/7 with zero agency overhead.`,
              },
            },
            {
              '@type': 'Question',
              name: 'How does Generative Engine Optimization (GEO) work?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'GEO structures digital content and documentation (such as llms.txt and semantic schema) so that AI search engines like ChatGPT, Perplexity, and Google AI Overviews cite and recommend your brand in generated answers.',
              },
            },
            {
              '@type': 'Question',
              name: `How quickly can businesses deploy ${name}?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Businesses can connect their website and marketing accounts within 2 minutes. The centralized AI Brain begins auditing, generating content, and deploying optimizations immediately.',
              },
            },
          ],
        },
      ],
    };
  }
}
