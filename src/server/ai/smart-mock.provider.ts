import { IAIProvider, AICompletionOptions } from './provider.interface';

export class SmartMockProvider implements IAIProvider {
  name = 'MarketMind Neural Heuristic Engine';

  async generateText(prompt: string, systemPrompt?: string, options?: AICompletionOptions): Promise<string> {
    const p = prompt.toLowerCase();
    
    if (p.includes('blog') || p.includes('article') || p.includes('content')) {
      return `# Complete Guide to Maximizing ROI with Smart Digital Marketing

In today's competitive landscape, modern businesses need an automated, data-driven edge to capture buyer intent. By unifying high-intent search optimization with hyper-targeted social distribution, your brand can consistently scale customer acquisition.

## 1. Capturing In-Market Demand
High-intent organic search captures customers at the exact moment they need your solution. Rather than broad, low-converting keywords, prioritize long-tail transactional phrases that reflect immediate purchasing readiness.

## 2. Omnichannel Brand Authority
Consistent touchpoints across LinkedIn, Instagram, and search ad retargeting build compounding trust. When potential clients see your brand repeatedly delivering actionable insights, sales conversion friction drops by over 40%.

## 3. Autonomous Performance Optimization
Continuous testing of ad copy variants and creative angles prevents audience fatigue and keeps Cost Per Acquisition (CPA) within target guardrails.`;
    }

    if (p.includes('social') || p.includes('caption') || p.includes('tweet')) {
      return `🚀 Stop wasting budget on manual marketing routines. Modern high-growth brands let AI orchestrate SEO, cross-platform distribution, and ad scaling 24/7.

Here are 3 quick metrics we optimized this week:
✅ Organic impressions up +38%
✅ Ad CTR increased from 1.8% to 3.2%
✅ Zero manual scheduling bottlenecks

Drop a comment or link in bio to see your marketing score! #DigitalMarketing #AIAutomation #GrowthHacking #MarketingStrategy`;
    }

    return `MarketMind AI analyzed the input context and generated an optimized strategy aligned with target growth KPIs and brand guardrails.`;
  }

  async generateJson<T>(prompt: string, systemPrompt?: string, options?: AICompletionOptions): Promise<T> {
    const p = prompt.toLowerCase();

    // Business Intelligence analysis
    if (p.includes('business profile') || p.includes('target audience') || p.includes('usp')) {
      const mockBI = {
        summary: "High-potential growth brand delivering high-value solutions to modern customers with substantial organic search and digital acquisition upside.",
        usps: [
          "24/7 autonomous marketing execution without agency overhead",
          "Data-driven keyword clustering and predictive ad optimization",
          "Built-in compliance and budget emergency safety guardrails"
        ],
        customerPains: [
          "High customer acquisition costs across standard paid ad channels",
          "Inconsistent content publishing due to manual time bottlenecks",
          "Lack of technical SEO visibility and slow organic lead pipeline"
        ],
        coreOfferings: [
          { title: "Core Solution Delivery", type: "service", description: "Automated fulfillment and core product value delivery." },
          { title: "Enterprise Growth Suite", type: "product", description: "Scalable automated platform for multi-channel digital acquisition." }
        ],
        detectedBrandVoice: {
          tone: "Authoritative, Modern & Data-Driven",
          keywords: ["Growth", "Efficiency", "Precision", "Automation", "Scale"],
          sentiment: "Empowering and confident"
        },
        idealCustomerProfiles: [
          {
            persona: "Growth-Focused Business Leader",
            demographics: "Ages 28-54, Founders, CMOs, & Business Owners",
            challenges: ["Resource constraints", "Uncertain ad ROAS", "Slow SEO momentum"],
            buyingTriggers: ["Need for predictable lead volume", "Time savings", "Transparent ROI"]
          }
        ],
        positioningStatement: "The automated intelligence engine that empowers businesses to capture market share and outpace competition without manual marketing friction.",
        growthTactics: [
          "Target high-intent transactional search queries with localized SEO landing pages",
          "Deploy weekly educational carousel breakdowns on LinkedIn & Instagram",
          "Run precision Google Search Ads with automated negative keyword filtering"
        ]
      };
      return mockBI as unknown as T;
    }

    // Content & Article generation
    if (p.includes('content') || p.includes('article') || p.includes('blog') || p.includes('landing page')) {
      const mockContent = {
        title: "Scaling Operational Velocity with Modern Digital Automation",
        metaTitle: "Enterprise Operational Velocity | Complete Guide",
        metaDescription: "Discover how modern high-growth teams cut operational overhead by 40% with autonomous systems. Read the actionable playbook.",
        slug: "scaling-operational-velocity-guide",
        h1: "The Executive Playbook to Scaling Operational Velocity",
        contentMarkdown: "## The Growth Bottleneck\n\nEvery scaling enterprise reaches a critical inflection point where manual coordination delays product delivery.\n\n### The 3 Core Pillars\n\n1. **Event-Driven Resilience**: Automate critical handoffs.\n2. **Unified Data Architecture**: Centralize operational metrics.\n3. **Continuous Observability**: Real-time alerting across channels.\n\n## Conclusion\n\nInvesting in automated systems delivers compounding returns.",
        faqs: [
          { question: "What systems does this integrate with?", answer: "All major CRMs, ad platforms, and cloud APIs." },
          { question: "How quickly can we see results?", answer: "Initial workflow gains are realized within 7 to 14 days." }
        ],
        ctaText: "Schedule an architecture walkthrough today.",
        internalLinksSuggestions: [
          { anchor: "Explore Solutions", targetUrl: "/solutions" },
          { anchor: "Case Studies", targetUrl: "/case-studies" }
        ]
      };
      return mockContent as unknown as T;
    }

    // SEO Keywords
    if (p.includes('keyword') || p.includes('seo cluster')) {
      const mockKeywords = [
        { keyword: "best automated marketing software", intent: "Commercial", category: "Software", searchVolumeEstimated: "4,400/mo (Est.)", difficultyScore: 42, priority: "High", suggestedContentFormat: "Comparison Guide", isLiveApiData: false },
        { keyword: "ai digital marketing agency alternative", intent: "Transactional", category: "Agency", searchVolumeEstimated: "2,900/mo (Est.)", difficultyScore: 38, priority: "High", suggestedContentFormat: "Landing Page", isLiveApiData: false },
        { keyword: "how to automate social media scheduling with ai", intent: "Informational", category: "Social Media", searchVolumeEstimated: "8,100/mo (Est.)", difficultyScore: 29, priority: "Medium", suggestedContentFormat: "Tutorial Blog", isLiveApiData: false },
        { keyword: "local marketing automation near me", intent: "Local", category: "Local SEO", searchVolumeEstimated: "1,600/mo (Est.)", difficultyScore: 24, priority: "High", suggestedContentFormat: "Local Landing Page", isLiveApiData: false },
        { keyword: "reduce google ads cost per lead with ai", intent: "Commercial", category: "Paid Search", searchVolumeEstimated: "3,200/mo (Est.)", difficultyScore: 45, priority: "Medium", suggestedContentFormat: "Case Study / Brief", isLiveApiData: false }
      ];
      return mockKeywords as unknown as T;
    }

    // Default JSON fallback
    return {
      status: "success",
      engine: "MarketMind Neural Heuristics",
      processed: true,
      timestamp: new Date().toISOString()
    } as unknown as T;
  }
}
