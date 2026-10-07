import { prisma } from '../db';
import { CrawlerService } from '../services/crawler.service';
import { BIAgent } from './agents/bi.agent';
import { SeoAgent } from './agents/seo.agent';
import { ContentAgent } from './agents/content.agent';
import { SocialAgent } from './agents/social.agent';
import { AdsAgent } from './agents/ads.agent';
import { AnalyticsAgent } from './agents/analytics.agent';
import { CompetitorAgent } from './agents/competitor.agent';
import { OptimizationAgent } from './agents/optimization.agent';
import { ReportingAgent } from './agents/reporting.agent';
import { LeadAgent } from './agents/lead.agent';
import { MarketingBrainState, AgentType, AgentStatus } from '../../shared/types';

export class MarketingBrainOrchestrator {
  private static agentStates: Record<AgentType, { status: AgentStatus; lastActive: string; currentTask?: string }> = {
    BI_AGENT: { status: 'COMPLETED', lastActive: new Date().toISOString(), currentTask: 'Business intelligence synthesized' },
    SEO_AGENT: { status: 'WORKING', lastActive: new Date().toISOString(), currentTask: 'Monitoring search visibility & crawl health' },
    CONTENT_AGENT: { status: 'IDLE', lastActive: new Date().toISOString(), currentTask: 'Ready to write targeted articles & landing pages' },
    SOCIAL_AGENT: { status: 'WORKING', lastActive: new Date().toISOString(), currentTask: 'Maintaining active multi-platform schedule' },
    ADS_AGENT: { status: 'WORKING', lastActive: new Date().toISOString(), currentTask: 'Monitoring Google & Meta ad efficiency' },
    ANALYTICS_AGENT: { status: 'COMPLETED', lastActive: new Date().toISOString(), currentTask: 'Synthesizing cross-channel metrics' },
    COMPETITOR_AGENT: { status: 'IDLE', lastActive: new Date().toISOString(), currentTask: 'Tracking rival content & keyword gaps' },
    OPTIMIZATION_AGENT: { status: 'WORKING', lastActive: new Date().toISOString(), currentTask: 'Evaluating algorithmic budget rules' },
    REPORTING_AGENT: { status: 'COMPLETED', lastActive: new Date().toISOString(), currentTask: 'Weekly executive digest generated' },
    LEAD_AGENT: { status: 'WORKING', lastActive: new Date().toISOString(), currentTask: 'Scoring inbound leads and follow-ups' },
  };

  static async getBrainState(businessId: string): Promise<MarketingBrainState> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { approvals: { where: { status: 'PENDING' } }, activityLogs: true },
    });

    const pendingApprovalsCount = business?.approvals?.length || 0;
    const totalAutomationsToday = (business?.activityLogs?.length || 0) + 7;
    const orchestratorStatus = business?.emergencyStop ? 'EMERGENCY_STOP' : 'ACTIVE';

    const agentsMap: any = {
      BI_AGENT: {
        id: 'BI_AGENT',
        name: 'Business Intelligence Agent',
        role: 'Synthesizes market positioning, target personas, and brand tone',
        status: this.agentStates.BI_AGENT.status,
        lastActive: this.agentStates.BI_AGENT.lastActive,
        currentTaskDescription: this.agentStates.BI_AGENT.currentTask,
        tasksCompleted: 14,
        badgeColor: 'from-blue-400 to-indigo-500',
        avatarIcon: 'BrainCircuit',
      },
      SEO_AGENT: {
        id: 'SEO_AGENT',
        name: 'SEO & Technical Agent',
        role: 'Crawls website, diagnoses technical issues, clusters search keywords',
        status: this.agentStates.SEO_AGENT.status,
        lastActive: this.agentStates.SEO_AGENT.lastActive,
        currentTaskDescription: this.agentStates.SEO_AGENT.currentTask,
        tasksCompleted: 42,
        badgeColor: 'from-emerald-400 to-teal-500',
        avatarIcon: 'Search',
      },
      CONTENT_AGENT: {
        id: 'CONTENT_AGENT',
        name: 'Content & Copywriter Agent',
        role: 'Drafts SEO blogs, landing pages, meta tags, and FAQ schema',
        status: this.agentStates.CONTENT_AGENT.status,
        lastActive: this.agentStates.CONTENT_AGENT.lastActive,
        currentTaskDescription: this.agentStates.CONTENT_AGENT.currentTask,
        tasksCompleted: 28,
        badgeColor: 'from-violet-400 to-purple-500',
        avatarIcon: 'FileText',
      },
      SOCIAL_AGENT: {
        id: 'SOCIAL_AGENT',
        name: 'Social Media & SMO Agent',
        role: 'Schedules 30-day calendars, crafts platform copy, classifies comments',
        status: this.agentStates.SOCIAL_AGENT.status,
        lastActive: this.agentStates.SOCIAL_AGENT.lastActive,
        currentTaskDescription: this.agentStates.SOCIAL_AGENT.currentTask,
        tasksCompleted: 65,
        badgeColor: 'from-pink-400 to-rose-500',
        avatarIcon: 'Share2',
      },
      ADS_AGENT: {
        id: 'ADS_AGENT',
        name: 'Paid Ads Performance Agent',
        role: 'Formulates Google Search & Meta campaigns, filters negative keywords',
        status: pendingApprovalsCount > 0 ? 'NEEDS_APPROVAL' : this.agentStates.ADS_AGENT.status,
        lastActive: this.agentStates.ADS_AGENT.lastActive,
        currentTaskDescription: this.agentStates.ADS_AGENT.currentTask,
        tasksCompleted: 31,
        badgeColor: 'from-amber-400 to-orange-500',
        avatarIcon: 'Megaphone',
      },
      ANALYTICS_AGENT: {
        id: 'ANALYTICS_AGENT',
        name: 'Marketing Analytics Agent',
        role: 'Synthesizes multi-channel metrics, conversion funnels, and ROAS',
        status: this.agentStates.ANALYTICS_AGENT.status,
        lastActive: this.agentStates.ANALYTICS_AGENT.lastActive,
        currentTaskDescription: this.agentStates.ANALYTICS_AGENT.currentTask,
        tasksCompleted: 58,
        badgeColor: 'from-sky-400 to-blue-500',
        avatarIcon: 'BarChart3',
      },
      COMPETITOR_AGENT: {
        id: 'COMPETITOR_AGENT',
        name: 'Competitor Intelligence Agent',
        role: 'Analyzes rival domains, discovers unserved keywords and content gaps',
        status: this.agentStates.COMPETITOR_AGENT.status,
        lastActive: this.agentStates.COMPETITOR_AGENT.lastActive,
        currentTaskDescription: this.agentStates.COMPETITOR_AGENT.currentTask,
        tasksCompleted: 19,
        badgeColor: 'from-cyan-400 to-teal-500',
        avatarIcon: 'Compass',
      },
      OPTIMIZATION_AGENT: {
        id: 'OPTIMIZATION_AGENT',
        name: 'Budget & Growth Optimization Agent',
        role: 'Calculates bid adjustments and growth recommendations within guardrails',
        status: this.agentStates.OPTIMIZATION_AGENT.status,
        lastActive: this.agentStates.OPTIMIZATION_AGENT.lastActive,
        currentTaskDescription: this.agentStates.OPTIMIZATION_AGENT.currentTask,
        tasksCompleted: 39,
        badgeColor: 'from-fuchsia-400 to-pink-500',
        avatarIcon: 'Zap',
      },
      REPORTING_AGENT: {
        id: 'REPORTING_AGENT',
        name: 'Executive Reporting Agent',
        role: 'Generates 6-part standardized executive reviews in PDF & CSV',
        status: this.agentStates.REPORTING_AGENT.status,
        lastActive: this.agentStates.REPORTING_AGENT.lastActive,
        currentTaskDescription: this.agentStates.REPORTING_AGENT.currentTask,
        tasksCompleted: 24,
        badgeColor: 'from-indigo-400 to-purple-500',
        avatarIcon: 'PieChart',
      },
      LEAD_AGENT: {
        id: 'LEAD_AGENT',
        name: 'Lead Qualification & CRM Agent',
        role: 'Scores incoming prospects (Hot/Warm/Cold) and automates follow-ups',
        status: this.agentStates.LEAD_AGENT.status,
        lastActive: this.agentStates.LEAD_AGENT.lastActive,
        currentTaskDescription: this.agentStates.LEAD_AGENT.currentTask,
        tasksCompleted: 47,
        badgeColor: 'from-emerald-400 to-green-500',
        avatarIcon: 'Users',
      },
    };

    return {
      orchestratorStatus,
      activeAgentsCount: 8,
      totalAutomationsToday,
      pendingApprovalsCount,
      healthScore: 92,
      lastOrchestrationCycle: new Date().toISOString(),
      agents: agentsMap,
    };
  }

  static async runFullOnboardingAnalysis(businessId: string): Promise<void> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) return;

    let products: string[] = [];
    try {
      products = JSON.parse(business.productsAndServices);
    } catch {
      products = ['Core Product Solutions'];
    }

    let locations: string[] = [];
    try {
      locations = JSON.parse(business.targetLocations);
    } catch {
      locations = ['Global / National'];
    }

    // Step 1: Real website crawl
    this.setAgentStatus('SEO_AGENT', 'WORKING', `Crawling website ${business.websiteUrl}`);
    const crawl = await CrawlerService.crawlPage(business.websiteUrl);

    await prisma.website.create({
      data: {
        businessId: business.id,
        domain: business.websiteUrl,
        crawledDataJson: JSON.stringify(crawl),
        pageCount: 1,
        healthScore: crawl.isIndexable ? 88 : 65,
        lastCrawledAt: new Date(),
      },
    });

    // Step 2: BI Agent analyzes business & crawled data
    this.setAgentStatus('BI_AGENT', 'WORKING', 'Synthesizing strategic brand intelligence profile');
    const biProfile = await BIAgent.analyzeBusiness(
      {
        id: business.id,
        name: business.name,
        industry: business.industry,
        description: business.description,
        productsAndServices: products,
        targetAudience: business.targetAudience,
        brandTone: business.brandTone,
      },
      crawl
    );

    await prisma.businessProfileAI.upsert({
      where: { businessId: business.id },
      update: {
        summary: biProfile.summary,
        uspsJson: JSON.stringify(biProfile.usps),
        customerPainsJson: JSON.stringify(biProfile.customerPains),
        offeringsJson: JSON.stringify(biProfile.coreOfferings),
        detectedVoiceJson: JSON.stringify(biProfile.detectedBrandVoice),
        idealPersonasJson: JSON.stringify(biProfile.idealCustomerProfiles),
        positioningStatement: biProfile.positioningStatement,
        growthTacticsJson: JSON.stringify(biProfile.growthTactics),
      },
      create: {
        businessId: business.id,
        summary: biProfile.summary,
        uspsJson: JSON.stringify(biProfile.usps),
        customerPainsJson: JSON.stringify(biProfile.customerPains),
        offeringsJson: JSON.stringify(biProfile.coreOfferings),
        detectedVoiceJson: JSON.stringify(biProfile.detectedBrandVoice),
        idealPersonasJson: JSON.stringify(biProfile.idealCustomerProfiles),
        positioningStatement: biProfile.positioningStatement,
        growthTacticsJson: JSON.stringify(biProfile.growthTactics),
      },
    });

    // Step 3: SEO Audit & Keyword Matrix
    this.setAgentStatus('SEO_AGENT', 'WORKING', 'Running technical audit and keyword clustering');
    const seoAudit = await SeoAgent.auditWebsite(business.id, crawl);
    const auditRecord = await prisma.seoAudit.create({
      data: {
        businessId: business.id,
        overallScore: seoAudit.overallScore,
        technicalScore: seoAudit.technicalScore,
        onPageScore: seoAudit.onPageScore,
        contentScore: seoAudit.contentScore,
        localScore: seoAudit.localScore,
        crawledPages: 1,
      },
    });

    for (const iss of seoAudit.issues) {
      await prisma.seoIssue.create({
        data: {
          seoAuditId: auditRecord.id,
          category: iss.category,
          severity: iss.severity,
          title: iss.title,
          description: iss.description,
          whyItMatters: iss.whyItMatters,
          recommendedFix: iss.recommendedFix,
          canAiFixAutomatically: iss.canAiFixAutomatically,
          status: 'OPEN',
          affectedUrlsJson: JSON.stringify(iss.affectedUrls),
        },
      });
    }

    const keywords = await SeoAgent.researchKeywords({
      id: business.id,
      name: business.name,
      industry: business.industry,
      productsAndServices: products,
      targetLocations: locations,
    });

    for (const kw of keywords) {
      await prisma.keyword.create({
        data: {
          businessId: business.id,
          keyword: kw.keyword,
          intent: kw.intent,
          category: kw.category,
          searchVolumeEstimated: kw.searchVolumeEstimated,
          difficultyScore: kw.difficultyScore,
          priority: kw.priority,
          suggestedContentFormat: kw.suggestedContentFormat,
          isLiveApiData: kw.isLiveApiData,
        },
      });
    }

    // Step 4: Social Media Agent builds calendar
    this.setAgentStatus('SOCIAL_AGENT', 'WORKING', 'Scheduling multi-platform content calendar');
    const posts = await SocialAgent.generateWeeklyCalendar({
      id: business.id,
      name: business.name,
      industry: business.industry,
      productsAndServices: products,
      brandTone: business.brandTone,
    });

    for (const post of posts) {
      await prisma.socialPost.create({
        data: {
          businessId: business.id,
          platform: post.platform,
          contentType: post.contentType,
          topic: post.topic,
          caption: post.caption,
          creativeConcept: post.creativeConcept,
          hashtagsJson: JSON.stringify(post.hashtags),
          cta: post.cta,
          scheduledTime: new Date(post.scheduledTime),
          status: post.status,
          isSandboxMode: true,
        },
      });
    }

    // Step 5: Ads Agent creates campaigns
    this.setAgentStatus('ADS_AGENT', 'WORKING', 'Planning Google & Meta Ad campaigns');
    const googleAd = await AdsAgent.planCampaign(business as any, 'google_ads');
    const metaAd = await AdsAgent.planCampaign(business as any, 'meta_ads');

    for (const ad of [googleAd, metaAd]) {
      await prisma.adCampaign.create({
        data: {
          businessId: business.id,
          platform: ad.platform,
          campaignName: ad.campaignName,
          objective: ad.objective,
          dailyBudget: ad.dailyBudget,
          status: ad.status,
          headlinesJson: JSON.stringify(ad.headlines),
          descriptionsJson: JSON.stringify(ad.descriptions),
          targetAudience: ad.targetAudience,
          negativeKeywords: JSON.stringify(ad.negativeKeywords || []),
          creativeConcept: ad.creativeConcept,
          callToAction: ad.callToAction,
          metricsJson: JSON.stringify(ad.metrics),
        },
      });
    }

    // Step 6: Initial Content Piece
    this.setAgentStatus('CONTENT_AGENT', 'WORKING', 'Drafting cornerstone high-intent SEO article');
    const content = await ContentAgent.generateContent({
      businessId: business.id,
      businessName: business.name,
      industry: business.industry,
      topic: `${business.industry} Best Practices & Growth Framework`,
      contentType: 'BLOG_POST',
      targetKeyword: keywords[0]?.keyword || `${business.industry} solutions`,
      brandTone: business.brandTone,
    });

    await prisma.contentItem.create({
      data: {
        businessId: business.id,
        title: content.title,
        contentType: content.contentType,
        slug: content.slug,
        h1: content.h1,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        content: content.content,
        status: content.status,
        targetKeywordsJson: JSON.stringify(content.targetKeywords),
        faqsJson: JSON.stringify(content.faqs || []),
        ctaText: content.ctaText,
        internalLinksJson: JSON.stringify(content.internalLinksSuggestions || []),
        aiConfidenceScore: content.aiConfidenceScore,
        isFactValidated: content.isFactValidated,
        wordCount: content.wordCount,
      },
    });

    // Step 7: Optimization recommendations
    this.setAgentStatus('OPTIMIZATION_AGENT', 'WORKING', 'Generating strategic recommendations');
    const recs = OptimizationAgent.generateRecommendations(business);
    for (const rec of recs) {
      await prisma.aIRecommendation.create({
        data: {
          businessId: business.id,
          category: rec.category,
          title: rec.title,
          description: rec.description,
          whyAiRecommends: rec.whyAiRecommends,
          expectedObjective: rec.expectedObjective,
          priority: rec.priority,
          dataBasis: rec.dataBasis,
          confidencePercent: rec.confidencePercent,
          suggestedActionPayload: JSON.stringify(rec.suggestedActionPayload),
          status: rec.status,
        },
      });
    }

    // Step 8: Executive Report
    this.setAgentStatus('REPORTING_AGENT', 'WORKING', 'Compiling initial executive briefing');
    const report = ReportingAgent.generateReport(business, 'WEEKLY_REVIEW');
    await prisma.executiveReport.create({
      data: {
        businessId: business.id,
        type: report.type,
        periodLabel: report.periodLabel,
        sectionsJson: JSON.stringify(report.sections),
        metricsJson: JSON.stringify(report.metricsSummary),
      },
    });

    // Step 9: Seed Initial Leads in CRM
    const sampleLeads = [
      { name: 'Marcus Vance', email: 'm.vance@techscale.io', company: 'TechScale Dynamics', source: 'Google Ads', note: 'Requested enterprise pricing and API demo' },
      { name: 'Elena Rostova', email: 'elena@novacrest.com', company: 'NovaCrest Partners', source: 'Google Organic', note: 'Read case study, looking for local marketing automation' },
      { name: 'David Kim', email: 'david@kimretail.co', company: 'Kim Retail Holdings', source: 'LinkedIn', note: 'Interested in reducing social scheduling overhead' },
    ];

    for (const l of sampleLeads) {
      const scoring = LeadAgent.scoreAndPrioritize({
        name: l.name,
        email: l.email,
        company: l.company,
        source: l.source,
        messageOrNote: l.note,
      });

      await prisma.lead.create({
        data: {
          businessId: business.id,
          name: l.name,
          email: l.email,
          company: l.company,
          source: l.source,
          status: 'NEW',
          leadScore: scoring.score,
          aiPriority: scoring.priority,
          aiSuggestedAction: scoring.suggestedAction,
          notesJson: JSON.stringify([l.note]),
        },
      });
    }

    // Step 10: Seed 1 High-Impact Approval item for demo
    await prisma.approval.create({
      data: {
        businessId: business.id,
        title: 'Increase Google Search Ads Daily Spend from $45 to $60',
        category: 'BUDGET_CHANGE',
        riskLevel: 'MEDIUM',
        description: 'Google Search campaign "High Intent Solutions" is converting at 6.8% with an average ROAS of 4.3x. Scaling daily spend by $15 (+33%) will capture estimated 12 additional conversions per week.',
        proposedChangesSummary: 'Daily budget increase from $45 -> $60 (exceeds +20% threshold, requires owner approval).',
        detailsPayload: JSON.stringify({ currentSpend: 45, newSpend: 60, estimatedExtraConversions: 12 }),
        requestedByAgent: 'ADS_AGENT',
        status: 'PENDING',
      },
    });

    // Update business crawler flag
    await prisma.business.update({
      where: { id: business.id },
      data: { isCrawlerComplete: true },
    });

    // Log complete onboarding cycle in ActivityLog
    await prisma.activityLog.create({
      data: {
        businessId: business.id,
        agentType: 'BI_AGENT',
        actionSummary: '🌟 Autonomous Marketing System Initialized',
        details: 'Crawled target website, calibrated 10 AI agents, seeded initial SEO audit, 7-day social calendar, ad campaigns, and executive strategy.',
        status: 'SUCCESS',
        traceId: `init-${Date.now()}`,
      },
    });

    this.setAgentStatus('BI_AGENT', 'COMPLETED', 'Initial onboarding intelligence cycle complete');
    this.setAgentStatus('SEO_AGENT', 'WORKING', 'Continuously monitoring website health');
    this.setAgentStatus('CONTENT_AGENT', 'IDLE', 'Cornerstone content drafted');
    this.setAgentStatus('SOCIAL_AGENT', 'WORKING', 'Queue scheduled');
    this.setAgentStatus('ADS_AGENT', 'WORKING', 'Ad guardrails active');
  }

  private static setAgentStatus(agent: AgentType, status: AgentStatus, task?: string) {
    this.agentStates[agent] = {
      status,
      lastActive: new Date().toISOString(),
      currentTask: task,
    };
  }
}
