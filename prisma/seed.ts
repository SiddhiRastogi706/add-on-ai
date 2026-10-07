import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MarketMind AI initial database...');

  // Clean existing data for clean seed
  await prisma.activityLog.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.adCampaign.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.contentItem.deleteMany();
  await prisma.keyword.deleteMany();
  await prisma.seoIssue.deleteMany();
  await prisma.seoAudit.deleteMany();
  await prisma.website.deleteMany();
  await prisma.businessProfileAI.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'NexusFlow Technologies',
      plan: 'growth',
      aiTokensUsed: 54200,
      aiTokensLimit: 600000,
    },
  });

  // Create User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'founder@nexusflow.io',
      passwordHash,
      name: 'Sarah Chen',
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  // Create Business
  const business = await prisma.business.create({
    data: {
      organizationId: org.id,
      name: 'NexusFlow AI',
      websiteUrl: 'https://nexusflow.io',
      industry: 'Enterprise Software & Automation',
      description: 'Autonomous workflow automation and digital operations for scaling mid-market enterprises.',
      productsAndServices: JSON.stringify(['Autonomous Workflow Suite', 'Enterprise AI Integrations', 'Real-Time Operational Analytics']),
      targetAudience: 'Chief Technology Officers, Operations Directors, and Mid-Market Founders',
      targetLocations: JSON.stringify(['United States', 'Canada', 'United Kingdom']),
      marketingGoals: JSON.stringify(['Leads', 'Website Traffic', 'Brand Awareness']),
      monthlyBudget: 50000,
      dailyBudgetLimit: 2000,
      brandColors: JSON.stringify({ primary: '#537CF3', secondary: '#1CB77B', accent: '#DC5495' }),
      brandTone: 'Authoritative, Modern & Data-Driven',
      language: 'English',
      currency: 'USD',
      emergencyStop: false,
      isCrawlerComplete: true,
    },
  });

  // Create Website & Crawled Data
  await prisma.website.create({
    data: {
      businessId: business.id,
      domain: 'https://nexusflow.io',
      lastCrawledAt: new Date(),
      pageCount: 16,
      healthScore: 89,
      crawledDataJson: JSON.stringify({
        url: 'https://nexusflow.io',
        status: 200,
        title: 'NexusFlow - Autonomous Enterprise Operations & Workflow AI',
        metaDescription: 'Eliminate manual bottlenecks with enterprise-grade autonomous workflow engines. Schedule your demo today.',
        h1: ['Autonomous Operations Engineered for Scale'],
        h2: ['Core Platform Capabilities', 'Client Case Studies', 'Enterprise Security'],
        wordCount: 1120,
        canonical: 'https://nexusflow.io',
        isIndexable: true,
        imagesTotal: 18,
        imagesMissingAlt: 3,
        schemaTypes: ['Organization', 'WebSite', 'SoftwareApplication'],
      }),
    },
  });

  // Create Business Profile AI
  await prisma.businessProfileAI.create({
    data: {
      businessId: business.id,
      summary: 'NexusFlow AI is a high-growth B2B automation platform targeting enterprise decision makers who need to streamline complex operational workflows with zero custom code.',
      uspsJson: JSON.stringify([
        'Sub-second automated workflow orchestration',
        'Zero-trust compliance and SOC-2 enterprise readiness',
        'Transparent ROI tracking and predictive analytics',
        '40% reduction in manual cross-departmental handoffs',
      ]),
      customerPainsJson: JSON.stringify([
        'Engineering teams bogged down building internal custom glue code',
        'Disjointed SaaS tooling causing data silos and compliance risk',
        'Slow operational response times driving customer churn',
      ]),
      offeringsJson: JSON.stringify([
        { title: 'NexusFlow Core Engine', type: 'product', description: 'Autonomous workflow automation backbone.' },
        { title: 'Enterprise Migration Advisory', type: 'service', description: 'White-glove implementation and training.' },
      ]),
      detectedVoiceJson: JSON.stringify({
        tone: 'Authoritative, Data-Centric, and Empowering',
        keywords: ['Precision', 'Automation', 'Scale', 'Security', 'Velocity'],
        sentiment: 'Confident and client-first',
      }),
      idealPersonasJson: JSON.stringify([
        {
          persona: 'VP of Engineering / CTO',
          demographics: 'Ages 32-52, Mid-Market Tech Companies (50-500 employees)',
          challenges: ['Talent constraints', 'Tech debt', 'System outages'],
          buyingTriggers: ['SOC-2 compliance', 'Developer hours saved', 'Immediate SLA guarantees'],
        },
      ]),
      positioningStatement: 'The enterprise automation infrastructure that powers operational velocity without custom engineering overhead.',
      growthTacticsJson: JSON.stringify([
        'Dominate high-intent search queries around "enterprise workflow automation software"',
        'Distribute high-impact technical architecture breakdowns on LinkedIn',
        'Deploy Google Search Ads targeting competitors with negative keyword guardrails',
      ]),
    },
  });

  // Create SEO Audit & Issues
  const seoAudit = await prisma.seoAudit.create({
    data: {
      businessId: business.id,
      overallScore: 87,
      technicalScore: 92,
      onPageScore: 84,
      contentScore: 79,
      localScore: 91,
      crawledPages: 16,
    },
  });

  await prisma.seoIssue.createMany({
    data: [
      {
        seoAuditId: seoAudit.id,
        category: 'On-Page',
        severity: 'Warning',
        title: '3 Feature Diagram Images Missing Alt Text Attributes',
        description: 'Product architecture infographics do not have descriptive alt tags.',
        whyItMatters: 'Search engines rely on alt tags to index diagrams and assess contextual relevance.',
        recommendedFix: 'Add descriptive alt tags including primary keywords such as "workflow automation architecture diagram".',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrlsJson: JSON.stringify(['https://nexusflow.io/#architecture']),
      },
      {
        seoAuditId: seoAudit.id,
        category: 'Technical',
        severity: 'Critical',
        title: 'Missing Structured FAQ Schema Markup on Solutions Page',
        description: 'No FAQPage schema detected despite 6 common customer questions being present.',
        whyItMatters: 'FAQ schema grants extended SERP real-estate in Google search results, lifting CTR by ~22%.',
        recommendedFix: 'Inject JSON-LD FAQPage schema dynamically via the AI Content patch.',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrlsJson: JSON.stringify(['https://nexusflow.io/solutions']),
      },
      {
        seoAuditId: seoAudit.id,
        category: 'Local',
        severity: 'Info',
        title: 'Local NAP Footer Standardization Recommended',
        description: 'Phone format inconsistency between header and footer contact blocks.',
        whyItMatters: 'Standardized formatting reinforces local business authority across regional queries.',
        recommendedFix: 'Apply standardized E.164 phone formatting and microdata markup.',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrlsJson: JSON.stringify(['https://nexusflow.io/contact']),
      },
    ],
  });

  // Create Keywords
  await prisma.keyword.createMany({
    data: [
      {
        businessId: business.id,
        keyword: 'best enterprise workflow automation software',
        intent: 'Commercial',
        category: 'Platform Software',
        searchVolumeEstimated: '5,400/mo (Est.)',
        difficultyScore: 44,
        priority: 'High',
        suggestedContentFormat: 'Comparison Guide',
        isLiveApiData: false,
      },
      {
        businessId: business.id,
        keyword: 'automated business process orchestration tool',
        intent: 'Transactional',
        category: 'Decision Intent',
        searchVolumeEstimated: '3,200/mo (Est.)',
        difficultyScore: 39,
        priority: 'High',
        suggestedContentFormat: 'Product Landing Page',
        isLiveApiData: false,
      },
      {
        businessId: business.id,
        keyword: 'how to reduce operational bottlenecks with ai',
        intent: 'Informational',
        category: 'Thought Leadership',
        searchVolumeEstimated: '8,900/mo (Est.)',
        difficultyScore: 28,
        priority: 'Medium',
        suggestedContentFormat: 'Cornerstone Blog Article',
        isLiveApiData: false,
      },
      {
        businessId: business.id,
        keyword: 'workflow automation consultant near me',
        intent: 'Local',
        category: 'Local Search',
        searchVolumeEstimated: '1,400/mo (Est.)',
        difficultyScore: 22,
        priority: 'High',
        suggestedContentFormat: 'Local Service Hub',
        isLiveApiData: false,
      },
    ],
  });

  // Create Content Items
  await prisma.contentItem.create({
    data: {
      businessId: business.id,
      title: 'The Modern CTO Guide to Autonomous Workflow Orchestration',
      contentType: 'BLOG_POST',
      slug: 'cto-guide-autonomous-workflow-orchestration',
      h1: 'Scaling Operational Velocity with Autonomous Workflow Orchestration',
      metaTitle: 'Autonomous Workflow Orchestration | Complete CTO Guide',
      metaDescription: 'Discover how modern engineering teams cut manual operational overhead by 40% using autonomous workflow intelligence. Actionable frameworks inside.',
      content: `## The Hidden Tax of Manual Operations\n\nEvery growing tech organization eventually hits a wall where customer growth demands disproportionate operational headcount. Without programmatic orchestration, cross-departmental coordination delays compound exponentially.\n\n### Core Tenets of Autonomous Architecture\n\n1. **Event-Driven Resilience**: Decouple critical triggers from brittle manual checks.\n2. **Unified Data Mesh**: Guarantee bi-directional state synchronization without custom ETL code.\n3. **Continuous Observability**: Real-time alerting before user-facing latency spikes occur.\n\n## Quantifying the ROI\n\nOrganizations transitioning to unified automation platforms report an average 3.8x faster feature iteration velocity and sub-minute incident remediation times.`,
      status: 'PUBLISHED',
      targetKeywordsJson: JSON.stringify(['enterprise workflow automation', 'operational velocity']),
      faqsJson: JSON.stringify([
        { question: 'What systems does autonomous orchestration integrate with?', answer: 'It connects natively with major CRMs, ERPs, cloud databases, and webhook triggers.' },
        { question: 'How long does implementation take?', answer: 'Most mid-market organizations go live in under 10 business days.' },
      ]),
      ctaText: 'Schedule a tailored architecture review with our team today.',
      internalLinksJson: JSON.stringify([
        { anchor: 'Explore Enterprise Features', targetUrl: '/platform' },
        { anchor: 'Read Client Case Studies', targetUrl: '/case-studies' },
      ]),
      aiConfidenceScore: 96,
      isFactValidated: true,
      wordCount: 890,
    },
  });

  // Create Social Posts
  const now = new Date();
  await prisma.socialPost.createMany({
    data: [
      {
        businessId: business.id,
        platform: 'linkedin',
        contentType: 'post',
        topic: 'Why CTOs Are Replacing Custom Glue Code with AI Orchestration',
        caption: `Engineering teams spend up to 30% of their sprints maintaining custom internal scripts.\n\nHere is how autonomous workflows free up your senior architects to focus on shipping revenue-generating features instead.\n\n1. Pre-built enterprise connectors\n2. Real-time audit logs\n3. Zero maintenance overhead\n\nHow many hours does your team spend maintaining internal glue code each week? 👇`,
        creativeConcept: 'High-contrast architecture blueprint visual with clean pastel glow highlights.',
        hashtagsJson: JSON.stringify(['EnterpriseAI', 'SoftwareArchitecture', 'DevOps', 'Productivity']),
        cta: 'Comment below or visit nexusflow.io for an interactive demo.',
        scheduledTime: new Date(now.getTime() + 7200000), // In 2 hours
        status: 'SCHEDULED',
        isSandboxMode: true,
      },
      {
        businessId: business.id,
        platform: 'instagram',
        contentType: 'carousel',
        topic: '5 Signs Your Operations Need Autonomous Intelligence',
        caption: `Are manual spreadsheets slowing down your customer delivery? Swipe through to see if your business qualifies for autonomous workflow acceleration 👉\n\nSave this checklist for your next leadership sync! 📌`,
        creativeConcept: '5-slide soft pastel glassmorphic card deck with bold numerical typography.',
        hashtagsJson: JSON.stringify(['TechLeadership', 'BusinessOps', 'StartupGrowth', 'WorkflowAutomation']),
        cta: 'Link in bio for full diagnostic scorecard.',
        scheduledTime: new Date(now.getTime() + 86400000), // Tomorrow
        status: 'SCHEDULED',
        isSandboxMode: true,
      },
      {
        businessId: business.id,
        platform: 'x',
        contentType: 'post',
        topic: 'Speed is the Ultimate Competitive Advantage',
        caption: `Slow workflows are not a technical limitation. They are a systems design choice.\n\nWhen you automate repeatable data handoffs, your delivery cycles contract from days to seconds. 🧵👇`,
        creativeConcept: 'Minimalist quote card with sleek brand typography on soft lavender gradient.',
        hashtagsJson: JSON.stringify(['BuildInPublic', 'GrowthHacking', 'SystemsDesign']),
        cta: 'Retweet if your team is building for speed.',
        scheduledTime: new Date(now.getTime() + 172800000),
        status: 'SCHEDULED',
        isSandboxMode: true,
      },
    ],
  });

  // Create Ad Campaigns
  await prisma.adCampaign.createMany({
    data: [
      {
        businessId: business.id,
        platform: 'google_ads',
        campaignName: 'Search - High Intent Enterprise Automation',
        objective: 'LEADS',
        dailyBudget: 45,
        status: 'ACTIVE',
        headlinesJson: JSON.stringify([
          'Enterprise Workflow AI',
          'Cut 40% Operational Overhead',
          'NexusFlow Official Platform',
          'Start Free Pilot Today',
        ]),
        descriptionsJson: JSON.stringify([
          'Eliminate manual data bottlenecks. Enterprise autonomous operations that scale 24/7.',
          'SOC-2 compliant workflow automation for scaling tech companies. Schedule live demo.',
        ]),
        targetAudience: 'In-market search queries for B2B workflow software',
        negativeKeywords: JSON.stringify(['free download', 'open source github', 'student internship']),
        creativeConcept: 'High-CTR search copy with transparent ROI metrics and trusted badges.',
        callToAction: 'Book a 15-Min Demo',
        metricsJson: JSON.stringify({
          impressions: 18450,
          clicks: 742,
          spend: 520.40,
          conversions: 42,
          ctrPercent: 4.02,
          cpcAvg: 0.70,
          roas: 4.25,
          isLiveConnected: false,
        }),
      },
      {
        businessId: business.id,
        platform: 'meta_ads',
        campaignName: 'Meta Retargeting - Decision Maker Lookalikes',
        objective: 'CONVERSIONS',
        dailyBudget: 35,
        status: 'ACTIVE',
        headlinesJson: JSON.stringify([
          'Autonomous Operations in 10 Days',
          'Stop Burning Engineering Sprints',
        ]),
        descriptionsJson: JSON.stringify([
          'Modern CTOs are cutting internal maintenance overhead by 40% with NexusFlow AI.',
        ]),
        targetAudience: 'Lookalike 1% of high-intent website demo requesters, filtered by Tech Decision Makers',
        creativeConcept: 'Pastel split card showcasing before/after revenue graphs with subtle glow.',
        callToAction: 'Claim Free Assessment',
        metricsJson: JSON.stringify({
          impressions: 24100,
          clicks: 610,
          spend: 380.00,
          conversions: 26,
          ctrPercent: 2.53,
          cpcAvg: 0.62,
          roas: 3.90,
          isLiveConnected: false,
        }),
      },
    ],
  });

  // Create CRM Leads
  await prisma.lead.createMany({
    data: [
      {
        businessId: business.id,
        name: 'Marcus Vance',
        email: 'm.vance@techscale.io',
        company: 'TechScale Dynamics',
        source: 'Google Ads',
        status: 'QUALIFIED',
        leadScore: 92,
        aiPriority: 'HOT',
        aiSuggestedAction: 'High buying intent detected. Schedule direct VIP architecture consult with senior solutions engineer.',
        notesJson: JSON.stringify(['Inquired about 250-seat enterprise plan', 'Timeline: Immediate Q3 deployment']),
        valueEstimated: 4800,
      },
      {
        businessId: business.id,
        name: 'Elena Rostova',
        email: 'elena@novacrest.com',
        company: 'NovaCrest Partners',
        source: 'Google Organic',
        status: 'NEW',
        leadScore: 78,
        aiPriority: 'WARM',
        aiSuggestedAction: 'Follow up with customer case studies and product tour video within 24 hours.',
        notesJson: JSON.stringify(['Downloaded CTO whitepaper', 'Looking for localized workflow templates']),
        valueEstimated: 2400,
      },
      {
        businessId: business.id,
        name: 'David Kim',
        email: 'david@kimretail.co',
        company: 'Kim Retail Holdings',
        source: 'LinkedIn',
        status: 'CONTACTED',
        leadScore: 65,
        aiPriority: 'WARM',
        aiSuggestedAction: 'Enroll in 3-part automated email nurture highlighting e-commerce inventory sync automations.',
        notesJson: JSON.stringify(['Interacted with Tuesday carousel post']),
        valueEstimated: 1800,
      },
      {
        businessId: business.id,
        name: 'Samira Patel',
        email: 'samira@patel-ventures.net',
        company: 'Patel Ventures',
        source: 'Direct Website',
        status: 'NEW',
        leadScore: 88,
        aiPriority: 'HOT',
        aiSuggestedAction: 'Send calendar link for live pilot demonstration.',
        notesJson: JSON.stringify(['Requested pricing for multi-brand deployment']),
        valueEstimated: 6500,
      },
    ],
  });

  // Create AI Recommendations
  await prisma.aIRecommendation.createMany({
    data: [
      {
        businessId: business.id,
        category: 'SEO',
        title: 'Publish dedicated comparison page: "NexusFlow vs Legacy Manual Scripting"',
        description: 'Search interest for competitor alternatives has climbed +34% in your industry sector.',
        whyAiRecommends: 'Competitor domains have thin content targeting alternative searches, leaving a high-ranking vacuum.',
        expectedObjective: 'Attract 450+ high-intent commercial monthly visitors and generate 20+ demo requests.',
        priority: 'HIGH',
        dataBasis: 'GSC query cluster data + Competitor gap scan',
        confidencePercent: 95,
        suggestedActionPayload: JSON.stringify({ action: 'GENERATE_PAGE', slug: 'vs-legacy-scripting' }),
        status: 'PENDING',
      },
      {
        businessId: business.id,
        category: 'Ads',
        title: 'Reallocate $15/day from display network into top-performing Search Ad campaign',
        description: 'Google Search campaign is delivering 4.25x ROAS compared to 1.1x on general display retargeting.',
        whyAiRecommends: 'Search queries demonstrate immediate in-market buying readiness, maximizing budget efficiency.',
        expectedObjective: 'Increase monthly conversions by 14 while reducing blended acquisition cost by 18%.',
        priority: 'MEDIUM',
        dataBasis: '30-day Ad account conversion performance',
        confidencePercent: 92,
        suggestedActionPayload: JSON.stringify({ action: 'REALLOCATE_BUDGET', amount: 15 }),
        status: 'PENDING',
      },
      {
        businessId: business.id,
        category: 'Social',
        title: 'Schedule weekly client transformation carousels on LinkedIn Tuesdays at 9:00 AM',
        description: 'Data across peer tech brands indicates Tuesday morning posting generates 2.4x higher B2B engagement.',
        whyAiRecommends: 'Target audience of CTOs and VP Engineers are most active on LinkedIn early in the work week.',
        expectedObjective: 'Boost organic social impressions by 40% and generate direct inbound connection requests.',
        priority: 'MEDIUM',
        dataBasis: 'Social engagement heatmap analysis',
        confidencePercent: 89,
        suggestedActionPayload: JSON.stringify({ action: 'APPLY_SCHEDULE_SLOT' }),
        status: 'PENDING',
      },
    ],
  });

  // Create Approval Item
  await prisma.approval.create({
    data: {
      businessId: business.id,
      title: 'Increase Google Search Ads Daily Spend from $45 to $60',
      category: 'BUDGET_CHANGE',
      riskLevel: 'MEDIUM',
      description: 'Search campaign "Enterprise Automation" is delivering 4.25x ROAS with 42 conversions. Increasing daily spend by $15 (+33%) will capture an estimated 14 additional conversions per week.',
      proposedChangesSummary: 'Daily budget increase: $45 -> $60 (exceeds +20% safety threshold, owner approval required).',
      detailsPayload: JSON.stringify({ currentDaily: 45, proposedDaily: 60, estimatedExtraMonthlyConversions: 56 }),
      requestedByAgent: 'ADS_AGENT',
      status: 'PENDING',
    },
  });

  // Create Executive Report
  await prisma.executiveReport.create({
    data: {
      businessId: business.id,
      type: 'WEEKLY_REVIEW',
      periodLabel: 'Past 7 Days Performance Review',
      sectionsJson: JSON.stringify({
        whatHappened: 'Cross-channel marketing velocity accelerated by +24.6% this week. Organic website traffic rose to 3,840 visitors, while ad campaigns generated 68 conversions at an average 4.1x ROAS.',
        whyItHappened: 'The AI SEO agent targeted 4 high-converting long-tail keyword clusters, while the social media agent syndicated high-impact thought leadership content during peak B2B engagement hours.',
        whatAiDid: [
          'Crawled 16 website pages and flagged 3 remediable on-page issues.',
          'Generated and queued 7 multi-platform social media posts.',
          'Pruned 6 negative search terms from Google Ads to prevent spend leakage.',
          'Scored and classified 4 inbound prospects with tailored follow-up actions.',
        ],
        whatWorked: [
          'LinkedIn technical carousel post achieved a 6.8% engagement rate.',
          'Google Search Ads yielded 42 qualified conversions at $0.70 CPC.',
          'Meta lookalike retargeting produced a 3.9x ROAS.',
        ],
        whatDidNotWork: [
          'Late Friday social updates saw lower click volume and have been rescheduled to weekday mornings.',
          'Three diagrams lacked alt attributes, which have been staged for automatic schema patching.',
        ],
        nextSteps: [
          'Deploy the proposed localized comparison landing page.',
          'Review and approve the $15/day budget scaling recommendation for Google Search Ads.',
          'Execute automated email outreach sequences for the 2 newly flagged Hot leads.',
        ],
      }),
      metricsJson: JSON.stringify({
        trafficChangePct: 24.6,
        leadsGenerated: 24,
        adSpend: 900.40,
        avgRoas: 4.12,
        seoIssuesFixed: 5,
        socialPostsPublished: 6,
      }),
    },
  });

  // Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        businessId: business.id,
        agentType: 'SEO_AGENT',
        actionSummary: 'Crawled website and compiled technical health diagnostics',
        details: 'Scanned 16 pages on https://nexusflow.io. Detected 3 optimizable issues. Overall health score: 87/100.',
        status: 'SUCCESS',
        traceId: 'trace-seo-101',
      },
      {
        businessId: business.id,
        agentType: 'SOCIAL_AGENT',
        actionSummary: 'Scheduled 7-day multi-channel social calendar',
        details: 'Crafted customized captions, hashtags, and visual concepts for LinkedIn, Instagram, and X.',
        status: 'SUCCESS',
        traceId: 'trace-soc-102',
      },
      {
        businessId: business.id,
        agentType: 'ADS_AGENT',
        actionSummary: 'Calibrated Google Search Ad bids & negative keywords',
        details: 'Pruned negative keywords to protect budget; 4.25x ROAS maintained.',
        status: 'SUCCESS',
        traceId: 'trace-ads-103',
      },
      {
        businessId: business.id,
        agentType: 'LEAD_AGENT',
        actionSummary: 'Enriched and scored 4 inbound prospect leads',
        details: 'Classified 2 Hot leads and assigned immediate VIP executive follow-up routing.',
        status: 'SUCCESS',
        traceId: 'trace-lead-104',
      },
      {
        businessId: business.id,
        agentType: 'OPTIMIZATION_AGENT',
        actionSummary: 'Submitted budget increase approval request',
        details: 'Triggered approval request for +$15/day search ad scaling in compliance with safety guardrails.',
        status: 'PENDING_APPROVAL',
        traceId: 'trace-opt-105',
      },
    ],
  });

  console.log('✅ MarketMind AI seed complete! Demo account: founder@nexusflow.io / password123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
