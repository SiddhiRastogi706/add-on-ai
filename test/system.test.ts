import axios from 'axios';
import { prisma } from '../src/server/db';
import { CrawlerService } from '../src/server/services/crawler.service';
import { SeoAgent } from '../src/server/ai/agents/seo.agent';
import { ContentAgent } from '../src/server/ai/agents/content.agent';
import { SocialAgent } from '../src/server/ai/agents/social.agent';
import { AdsAgent } from '../src/server/ai/agents/ads.agent';
import { BudgetService } from '../src/server/services/budget.service';
import { SafetyService } from '../src/server/services/safety.service';
import { LeadAgent } from '../src/server/ai/agents/lead.agent';

async function runTests() {
  console.log('🧪 Starting MarketMind AI Full-System Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, details?: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  // Test 1: Safety & Brand Tone Filter
  console.log('--- Test Suite 1: AI Safety & Quality Pipeline ---');
  const safeResult = SafetyService.validateContent('This is a professional business automation guide.');
  assert('Normal content passes safety check', safeResult.isSafe && !safeResult.requiresHumanApproval);

  const riskyResult = SafetyService.validateContent('We offer guaranteed 100% risk-free returns and secret tricks.');
  assert('Risky superlative claims require human approval', riskyResult.requiresHumanApproval && !riskyResult.isSafe);

  // Test 2: Website Crawler
  console.log('\n--- Test Suite 2: Website Crawler Service ---');
  const crawl = await CrawlerService.crawlPage('https://nexusflow.io');
  assert('Crawler extracts page title and structure', Boolean(crawl.title) && crawl.h1.length > 0);
  assert('Crawler detects word count and image metrics', crawl.wordCount > 0 && typeof crawl.imagesMissingAlt === 'number');

  // Test 3: SEO Agent Diagnostics
  console.log('\n--- Test Suite 3: Technical SEO Diagnostics ---');
  const audit = await SeoAgent.auditWebsite('test-biz-id', crawl);
  assert('SEO Agent computes overall health score', audit.overallScore >= 70 && audit.overallScore <= 100);
  assert('SEO Agent computes technical score breakdown', audit.technicalScore > 0 && audit.onPageScore > 0);
  assert('SEO Agent generates categorized issues with recommended fixes', audit.issues.length > 0 && Boolean(audit.issues[0].recommendedFix));

  // Test 4: Keyword Matrix Clustering
  console.log('\n--- Test Suite 4: Keyword Intent Clustering ---');
  const keywords = await SeoAgent.researchKeywords({
    id: 'test-biz-id',
    name: 'NexusFlow AI',
    industry: 'Enterprise Software',
    productsAndServices: ['Workflow Engine'],
    targetLocations: ['United States'],
  });
  assert('Keywords generated with explicit search intent', keywords.length >= 4 && Boolean(keywords[0].intent));
  assert('Keywords honestly indicate estimated vs live status', keywords.every((k) => k.isLiveApiData === false));

  // Test 5: Content Agent Generator
  console.log('\n--- Test Suite 5: SEO Content & Copy Agent ---');
  const content = await ContentAgent.generateContent({
    businessId: 'test-biz-id',
    businessName: 'NexusFlow AI',
    industry: 'Enterprise Software',
    topic: 'How to Scale Operational Velocity',
    contentType: 'BLOG_POST',
    targetKeyword: 'enterprise workflow automation',
    brandTone: 'Authoritative',
  });
  assert('Content Agent generates structured article with H1 & slug', Boolean(content.h1) && Boolean(content.slug));
  assert('Content Agent generates FAQ schema questions', (content.faqs || []).length > 0);
  assert('Content Agent assigns confidence score', content.aiConfidenceScore > 80);

  // Test 6: Social Agent Calendar
  console.log('\n--- Test Suite 6: Social Media Manager & Engagement ---');
  const socialPosts = await SocialAgent.generateWeeklyCalendar({
    id: 'test-biz-id',
    name: 'NexusFlow AI',
    industry: 'Enterprise Software',
    productsAndServices: ['Workflow Engine'],
    brandTone: 'Authoritative',
  });
  assert('Social Agent generates multi-platform schedule', socialPosts.length >= 5);
  assert('Social Agent includes captions, hashtags & art concepts', Boolean(socialPosts[0].caption) && socialPosts[0].hashtags.length > 0);

  const commentClassification = SocialAgent.classifyInteraction('Can someone help me with enterprise pricing details?');
  assert('Comment classifier identifies Pricing / Lead intent', commentClassification.classification === 'Pricing' && !commentClassification.isSensitive);

  const sensitiveComment = SocialAgent.classifyInteraction('I will sue your company and lawyer up for refund!');
  assert('Sensitive complaint routes to human approval', sensitiveComment.isSensitive === true);

  // Test 7: Ads Agent & Budget Guardrails
  console.log('\n--- Test Suite 7: Ads Agent & Budget Safety Limits ---');
  const adPlan = await AdsAgent.planCampaign({
    id: 'test-biz-id',
    name: 'NexusFlow AI',
    industry: 'Enterprise Software',
    productsAndServices: ['Workflow Engine'],
    monthlyBudget: 50000,
    dailyBudgetLimit: 2000,
    brandTone: 'Authoritative',
  }, 'google_ads');
  assert('Google Search Ad contains compliant headlines', adPlan.headlines.length >= 2);
  assert('Google Search Ad includes negative keywords', (adPlan.negativeKeywords || []).length > 0);

  const safeBudgetCheck = BudgetService.checkBudgetPermitted(100, 115, 500);
  assert('Sub-20% budget shift is permitted automatically', safeBudgetCheck.allowed && !safeBudgetCheck.requiresApproval);

  const highBudgetCheck = BudgetService.checkBudgetPermitted(100, 135, 500);
  assert('35% budget shift triggers human approval requirement', highBudgetCheck.allowed && highBudgetCheck.requiresApproval);

  const overLimitCheck = BudgetService.checkBudgetPermitted(100, 600, 500);
  assert('Budget shift exceeding hard cap is strictly rejected', !overLimitCheck.allowed);

  // Test 8: Lead CRM Scoring
  console.log('\n--- Test Suite 8: Lead Qualification & Scoring ---');
  const hotLead = LeadAgent.scoreAndPrioritize({
    name: 'Sarah Connor',
    email: 'sarah@skynet-defense.com',
    company: 'Defense Systems',
    source: 'Google Ads',
    messageOrNote: 'Need urgent enterprise pricing for 500 seats',
  });
  assert('High-intent enterprise lead scores as HOT priority', hotLead.score >= 80 && hotLead.priority === 'HOT');

  // Test 9: Multi-Page Site Crawl
  console.log('\n--- Test Suite 9: Multi-Page Site Crawler & Aggregated Diagnostics ---');
  const siteCrawl = await CrawlerService.crawlSite('https://nexusflow.io', 4);
  assert('Multi-page crawler inspects multiple pages', siteCrawl.pagesCrawled >= 1);
  assert('Aggregated diagnostics compute sitewide issue metrics', typeof siteCrawl.aggregateIssues.missingAltImagesTotal === 'number');

  // Test 10: Google PageSpeed & Core Web Vitals
  console.log('\n--- Test Suite 10: Google PageSpeed Insights & Lighthouse Metrics ---');
  const { PageSpeedService } = await import('../src/server/services/pagespeed.service');
  const psResult = await PageSpeedService.runAudit('https://nexusflow.io', 'mobile');
  assert('PageSpeed service returns Lighthouse category scores', psResult.performanceScore > 0 && psResult.seoScore > 0);
  assert('PageSpeed service extracts Core Web Vitals', Boolean(psResult.metrics.largestContentfulPaint) && Boolean(psResult.metrics.cumulativeLayoutShift));
  assert('PageSpeed service detects optimization opportunities', psResult.opportunities.length > 0);

  // Test 11: Real CMS Auto-Patch Publisher
  console.log('\n--- Test Suite 11: CMS Webhook / Auto-Patch Publishing Service ---');
  const { CmsService } = await import('../src/server/services/cms.service');
  const patchResult = await CmsService.applyPatch({
    businessId: 'test-biz-id',
    issueId: 'test-iss-1',
    patchType: 'META_TAG',
    targetUrl: 'https://nexusflow.io',
    patchPayload: {
      metaTitle: 'NexusFlow AI | Verified Autonomous Patch',
      metaDescription: 'Verified autonomous metadata applied by SEO Agent',
    },
  });
  assert('CMS service processes patch request safely', patchResult.success === true && Boolean(patchResult.appliedVia));

  // Test 12: Google Ads & Meta Ads PAUSED Safety Guardrails
  console.log('\n--- Test Suite 12: Paid Ads Safety Guardrails (PAUSED Mode) ---');
  const { GoogleAdsService } = await import('../src/server/services/googleads.service');
  const { MetaAdsService } = await import('../src/server/services/metaads.service');

  const gadsResult = await GoogleAdsService.deployCampaign({
    businessId: 'test-biz-id',
    campaignName: 'Test Google Search Campaign',
    dailyBudgetDollars: 35,
    headlines: ['Test Headline 1', 'Test Headline 2'],
    descriptions: ['Test Description 1'],
    negativeKeywords: ['free'],
    finalUrl: 'https://nexusflow.io',
  });
  assert('Google Ads enforces PAUSED status on creation', gadsResult.status.includes('PAUSED') && gadsResult.safetyCheckPassed);

  const metaResult = await MetaAdsService.deployCampaign({
    businessId: 'test-biz-id',
    campaignName: 'Test Meta Campaign',
    dailyBudgetDollars: 25,
    objective: 'OUTCOME_LEADS',
    headlines: ['Transform Operations'],
    descriptions: ['AI Orchestration platform'],
  });
  assert('Meta Ads enforces PAUSED status on creation', metaResult.status.includes('PAUSED') && metaResult.safetyCheckPassed);

  let budgetBlocked = false;
  try {
    await GoogleAdsService.deployCampaign({
      businessId: 'test-biz-id',
      campaignName: 'Overbudget Campaign',
      dailyBudgetDollars: 1200, // Exceeds $500 safety cap
      headlines: ['H1', 'H2'],
      descriptions: ['D1'],
      negativeKeywords: [],
      finalUrl: 'https://nexusflow.io',
    });
  } catch (err: any) {
    budgetBlocked = err.message.includes('Safety Guardrail');
  }
  assert('High-budget ad creation (> $500/day) is blocked by safety guardrail', budgetBlocked);

  // Summary
  console.log(`\n====================================================`);
  console.log(`Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log(`====================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
