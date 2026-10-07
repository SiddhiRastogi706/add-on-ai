export interface PlanFeature {
  name: string;
  included: boolean;
  limitDesc?: string;
}

export interface SaaSPlan {
  id: 'free' | 'starter' | 'growth' | 'pro' | 'founder_slot';
  name: string;
  tagline: string;
  badge?: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  aiTokensPerMonth: number;
  connectedWebsites: number;
  connectedSocialAccounts: number;
  crawlerPagesPerAudit: number;
  features: string[];
  automatedAgents: string[];
}

export const SAAS_PLANS: Record<string, SaaSPlan> = {
  free: {
    id: 'free',
    name: 'Free Starter',
    tagline: 'Explore the AI marketing brain and basic diagnostics.',
    priceMonthly: 0,
    priceYearly: 0,
    currency: '₹',
    aiTokensPerMonth: 25000,
    connectedWebsites: 1,
    connectedSocialAccounts: 1,
    crawlerPagesPerAudit: 10,
    features: [
      'Basic Website Crawl & Tech Audit',
      'AI Business Understanding Profile',
      'Keyword Research (up to 20 keywords)',
      '3 AI Blog & Social Drafts / month',
      'Community Support',
    ],
    automatedAgents: ['Business Intelligence Agent', 'SEO Agent (Basic)'],
  },
  starter: {
    id: 'starter',
    name: 'Starter Team',
    tagline: 'Essential AI marketing execution for solo founders & small teams.',
    priceMonthly: 999,
    priceYearly: 9999,
    currency: '₹',
    aiTokensPerMonth: 150000,
    connectedWebsites: 1,
    connectedSocialAccounts: 3,
    crawlerPagesPerAudit: 50,
    features: [
      'Full SEO & Technical Health Audits',
      'AI Content Studio (Blogs, Landing Pages)',
      '14-Day Social Calendar & Auto-Drafting',
      'Weekly Marketing Digest',
      'Standard AI Safety & Brand Guardrails',
      'Email & Slack Alerts',
    ],
    automatedAgents: [
      'Business Intelligence Agent',
      'SEO Agent',
      'Content Agent',
      'Social Media Agent',
      'Reporting Agent',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth Automation',
    tagline: 'Complete 24/7 AI Marketing Team with autonomous scheduling & ads.',
    badge: 'Most Popular',
    priceMonthly: 2999,
    priceYearly: 29999,
    currency: '₹',
    aiTokensPerMonth: 600000,
    connectedWebsites: 3,
    connectedSocialAccounts: 8,
    crawlerPagesPerAudit: 250,
    features: [
      'Autonomous 30-Day Content Scheduling',
      'Google & Meta Ads Monitoring & Bid Rules',
      'Smart Competitor Analysis (up to 5 rivals)',
      'AI Budget Manager with Emergency Stop',
      'Lead Scoring & Follow-up Suggestions',
      'Automated Weekly & Monthly PDF Reports',
      'Priority AI Agent Execution Queue',
    ],
    automatedAgents: [
      'Business Intelligence Agent',
      'SEO Agent',
      'Content Agent',
      'Social Media Agent',
      'Ads Agent',
      'Analytics Agent',
      'Competitor Agent',
      'Optimization Agent',
      'Reporting Agent',
      'Lead Agent',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro Autonomous Agency',
    tagline: 'Uncapped autonomous power for multi-brand companies and scaling businesses.',
    badge: 'Scale Fast',
    priceMonthly: 4999,
    priceYearly: 49999,
    currency: '₹',
    aiTokensPerMonth: 2500000,
    connectedWebsites: 15,
    connectedSocialAccounts: 30,
    crawlerPagesPerAudit: 1000,
    features: [
      'Multi-Organization & Multi-Brand Isolation',
      'Custom LLM Fine-Tuning & Custom Voice Memory',
      'Real-Time Continuous Daily Automation Cycles',
      'Automated Safe Social Reply Classification',
      'Full API Access & Webhook Integrations',
      'Dedicated Customer Success & Strategy Architect',
      'Custom White-Label Reporting Exports',
    ],
    automatedAgents: [
      'All 10 Core AI Agents',
      'Custom Autonomous Agent Workflows',
      'Autonomous Budget Rebalancer',
      'Real-time Competitor Tracker',
    ],
  },
  founder_slot: {
    id: 'founder_slot',
    name: 'Founder Lifetime Slot #1',
    tagline: 'Strictly 100 slots — One-time payment, lifetime unlimited autonomous growth.',
    badge: 'Limited: 100 Slots',
    priceMonthly: 499,
    priceYearly: 499,
    currency: '₹',
    aiTokensPerMonth: 1000000,
    connectedWebsites: 5,
    connectedSocialAccounts: 10,
    crawlerPagesPerAudit: 500,
    features: [
      'Strictly 100 Users (First Come, First Served)',
      'One-time ₹499 Lifetime Access (No recurring monthly fees)',
      'All 10 Autonomous Marketing AI Agents Included',
      '24/7 Autonomous SEO & GEO/AEO Engine (/llms.txt)',
      'Instant Email PDF GST Tax Invoices',
      'Priority Founder VIP Engine Access',
    ],
    automatedAgents: [
      'All 10 Core AI Agents',
      'GEO/AEO Citation Agent',
      'Founder VIP Automation',
    ],
  },
};
