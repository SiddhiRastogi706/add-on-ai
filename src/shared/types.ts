export type Role = 'USER' | 'ADMIN' | 'MEMBER';

export type PlanType = 'free' | 'starter' | 'growth' | 'pro';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  plan: PlanType;
  aiTokensUsed: number;
  aiTokensLimit: number;
  createdAt: string;
}

export interface Business {
  id: string;
  organizationId: string;
  name: string;
  websiteUrl: string;
  industry: string;
  description: string;
  productsAndServices: string[];
  targetAudience: string;
  targetLocations: string[];
  marketingGoals: string[];
  monthlyBudget: number;
  dailyBudgetLimit: number;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  brandTone: string;
  language: string;
  currency: string;
  emergencyStop: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfileAI {
  businessId: string;
  summary: string;
  usps: string[];
  customerPains: string[];
  coreOfferings: Array<{ title: string; type: 'product' | 'service'; description: string }>;
  detectedBrandVoice: {
    tone: string;
    keywords: string[];
    sentiment: string;
  };
  idealCustomerProfiles: Array<{
    persona: string;
    demographics: string;
    challenges: string[];
    buyingTriggers: string[];
  }>;
  positioningStatement: string;
  growthTactics: string[];
  analyzedAt: string;
}

export type AgentType =
  | 'BI_AGENT'
  | 'SEO_AGENT'
  | 'CONTENT_AGENT'
  | 'SOCIAL_AGENT'
  | 'ADS_AGENT'
  | 'ANALYTICS_AGENT'
  | 'COMPETITOR_AGENT'
  | 'OPTIMIZATION_AGENT'
  | 'REPORTING_AGENT'
  | 'LEAD_AGENT';

export type AgentStatus = 'IDLE' | 'WORKING' | 'COMPLETED' | 'NEEDS_APPROVAL' | 'FAILED' | 'PAUSED';

export interface AgentInfo {
  id: AgentType;
  name: string;
  role: string;
  status: AgentStatus;
  lastActive: string;
  tasksCompleted: number;
  currentTaskDescription?: string;
  badgeColor: string;
  avatarIcon: string;
}

export interface MarketingBrainState {
  orchestratorStatus: 'ACTIVE' | 'PAUSED' | 'EMERGENCY_STOP';
  activeAgentsCount: number;
  totalAutomationsToday: number;
  pendingApprovalsCount: number;
  healthScore: number;
  lastOrchestrationCycle: string;
  agents: Record<AgentType, AgentInfo>;
}

export interface CrawlerResult {
  url: string;
  status: number;
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  h3: string[];
  wordCount: number;
  canonical?: string;
  robots?: string;
  isIndexable: boolean;
  imagesTotal: number;
  imagesMissingAlt: number;
  internalLinks: number;
  externalLinks: number;
  schemaTypes: string[];
  loadTimeMs: number;
  crawledAt: string;
  detectedProducts: string[];
  detectedContacts: { email?: string; phone?: string; address?: string };
  hasNapInFooter?: boolean;
  internalLinksFound?: string[];
}

export interface SiteCrawlResult {
  rootUrl: string;
  pagesCrawled: number;
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  sitemapUrlsCount: number;
  pages: CrawlerResult[];
  aggregateIssues: {
    duplicateTitlesCount: number;
    missingMetaDescriptionsCount: number;
    brokenLinksCount: number;
    missingAltImagesTotal: number;
    pagesWithoutSchemaCount: number;
    avgLoadTimeMs: number;
  };
}

export interface PageSpeedResult {
  url: string;
  strategy: 'mobile' | 'desktop';
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  metrics: {
    firstContentfulPaint: string;
    largestContentfulPaint: string;
    cumulativeLayoutShift: string;
    totalBlockingTime: string;
    speedIndex: string;
    timeToFirstByte: string;
  };
  opportunities: Array<{
    title: string;
    description: string;
    estimatedSavingsBytes?: number;
    estimatedSavingsMs?: number;
  }>;
  isLiveApiData: boolean;
  auditedAt: string;
}

export interface SeoAuditReport {
  id: string;
  businessId: string;
  overallScore: number;
  technicalScore: number;
  onPageScore: number;
  contentScore: number;
  localScore: number;
  crawledPagesCount: number;
  issues: SeoIssue[];
  auditedAt: string;
}

export interface SeoIssue {
  id: string;
  category: 'Technical' | 'On-Page' | 'Content' | 'Local';
  severity: 'Critical' | 'Warning' | 'Info';
  title: string;
  description: string;
  whyItMatters: string;
  recommendedFix: string;
  canAiFixAutomatically: boolean;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'IGNORED';
  affectedUrls: string[];
  patchCode?: string;
  patchType?: 'JSON_LD' | 'HTML_HEAD' | 'ROBOTS_TXT' | 'HTACCESS' | 'CONFIG';
}

export interface KeywordData {
  id: string;
  keyword: string;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' | 'Local';
  category: string;
  searchVolumeEstimated: string; // Clearly labeled as estimated
  difficultyScore: number; // 0-100
  priority: 'High' | 'Medium' | 'Low';
  suggestedContentFormat: string;
  isLiveApiData: boolean; // Flag to ensure honesty
}

export interface ContentItem {
  id: string;
  businessId: string;
  title: string;
  contentType: 'BLOG_POST' | 'LANDING_PAGE' | 'PRODUCT_DESCRIPTION' | 'FAQ' | 'META_TAGS' | 'SOCIAL_COPY';
  slug?: string;
  h1?: string;
  metaTitle?: string;
  metaDescription?: string;
  content: string;
  status: 'DRAFT' | 'READY_FOR_REVIEW' | 'APPROVED' | 'PUBLISHED';
  targetKeywords: string[];
  faqs?: Array<{ question: string; answer: string }>;
  ctaText?: string;
  internalLinksSuggestions?: Array<{ anchor: string; targetUrl: string }>;
  aiConfidenceScore: number;
  isFactValidated: boolean;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin' | 'x' | 'youtube';

export interface SocialPost {
  id: string;
  businessId: string;
  platform: SocialPlatform;
  contentType: 'post' | 'reel_script' | 'carousel' | 'story' | 'poll';
  topic: string;
  caption: string;
  creativeConcept: string;
  hashtags: string[];
  cta: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'APPROVAL_REQUIRED' | 'FAILED' | 'DRAFT';
  publishedUrl?: string;
  platformPostId?: string;
  engagementStats?: {
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
  };
  isSandboxMode: boolean;
  createdAt: string;
}

export interface AdCampaign {
  id: string;
  businessId: string;
  platform: 'google_ads' | 'meta_ads';
  campaignName: string;
  objective: 'LEADS' | 'CONVERSIONS' | 'TRAFFIC' | 'BRAND_AWARENESS';
  dailyBudget: number;
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'APPROVAL_REQUIRED';
  headlines: string[];
  descriptions: string[];
  targetAudience: string;
  negativeKeywords?: string[];
  creativeConcept?: string;
  callToAction: string;
  metrics: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    ctrPercent: number;
    cpcAvg: number;
    roas: number;
    isLiveConnected: boolean; // honesty flag
  };
  createdAt: string;
}

export interface MarketingAnalyticsSnapshot {
  dateRange: 'today' | '7d' | '30d' | '90d' | 'custom';
  websiteVisitors: number;
  visitorGrowthPercent: number;
  trafficSources: Array<{ source: string; visitors: number; percentage: number; color: string }>;
  organicImpressions: number;
  organicClicks: number;
  totalLeads: number;
  totalConversions: number;
  adSpendTotal: number;
  roasAverage: number;
  dailyTrend: Array<{
    date: string;
    visitors: number;
    organic: number;
    social: number;
    ads: number;
    leads: number;
  }>;
}

export interface LeadItem {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: 'Google Organic' | 'Google Ads' | 'Meta Ads' | 'LinkedIn' | 'Direct Website';
  campaignName?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  leadScore: number; // 0 - 100
  aiPriority: 'HOT' | 'WARM' | 'COLD';
  aiSuggestedAction: string;
  notes: string[];
  valueEstimated?: number;
  createdAt: string;
}

export interface AIRecommendation {
  id: string;
  businessId: string;
  category: 'SEO' | 'Content' | 'Social' | 'Ads' | 'Budget' | 'Conversion';
  title: string;
  description: string;
  whyAiRecommends: string;
  expectedObjective: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dataBasis: string;
  confidencePercent: number;
  suggestedActionPayload: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'EXECUTED';
  createdAt: string;
}

export interface ApprovalItem {
  id: string;
  businessId: string;
  title: string;
  category: 'BUDGET_CHANGE' | 'LIVE_AD_LAUNCH' | 'WEBSITE_CODE_CHANGE' | 'SENSITIVE_CONTENT' | 'API_PERMISSIONS';
  riskLevel: 'HIGH' | 'MEDIUM';
  description: string;
  proposedChangesSummary: string;
  detailsPayload: any;
  requestedByAgent: AgentType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  resolvedAt?: string;
}

export interface ActivityLogItem {
  id: string;
  businessId: string;
  agentType: AgentType;
  timestamp: string;
  actionSummary: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'PENDING_APPROVAL';
  traceId: string;
}

export interface ExecutiveReport {
  id: string;
  businessId: string;
  type: 'DAILY_DIGEST' | 'WEEKLY_REVIEW' | 'MONTHLY_STRATEGY';
  periodLabel: string;
  createdAt: string;
  sections: {
    whatHappened: string;
    whyItHappened: string;
    whatAiDid: string[];
    whatWorked: string[];
    whatDidNotWork: string[];
    nextSteps: string[];
  };
  metricsSummary: {
    trafficChangePct: number;
    leadsGenerated: number;
    adSpend: number;
    avgRoas: number;
    seoIssuesFixed: number;
    socialPostsPublished: number;
  };
}

export interface IntegrationAccount {
  id: string;
  provider:
    | 'google_pagespeed'
    | 'google_search_console'
    | 'google_analytics'
    | 'google_ads'
    | 'meta_ads'
    | 'instagram'
    | 'facebook'
    | 'linkedin'
    | 'youtube'
    | 'shopify'
    | 'wordpress'
    | 'upstash_redis'
    | 'razorpay'
    | 'resend'
    | 'whatsapp'
    | 'x'
    | string;
  name: string;
  icon: string;
  category:
    | 'Search & Analytics'
    | 'Social Media'
    | 'Paid Advertising'
    | 'CMS & Store'
    | 'Infrastructure & Cache'
    | 'Payments & Billing'
    | 'Email & Messaging'
    | string;
  isConnected: boolean;
  isSandboxDemo: boolean;
  connectedAccountName?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  requiredPermissions: string[];
  healthStatus: 'HEALTHY' | 'ACTION_REQUIRED' | 'DISCONNECTED' | 'SANDBOX_DEMO';
}
