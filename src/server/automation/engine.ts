import { prisma } from '../db';
import { SeoAgent } from '../ai/agents/seo.agent';
import { SocialAgent } from '../ai/agents/social.agent';
import { OptimizationAgent } from '../ai/agents/optimization.agent';
import { ReportingAgent } from '../ai/agents/reporting.agent';
import { SocialPublishService } from '../services/social-publish.service';
import { walletBillingContext } from '../services/wallet-billing-context';
import * as Sentry from '@sentry/node';

export interface AutomationModuleStatus {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'IDLE';
  lastRun: string;
  nextRun: string;
  frequency: string;
  icon: string;
}

export class AutomationEngine {
  private static isRunning = false;
  private static timerHandle: NodeJS.Timeout | null = null;
  private static globalPaused = false;

  private static moduleStates: Record<string, boolean> = {
    marketing_brain: true,
    seo_monitor: true,
    social_scheduler: true,
    ads_monitor: true,
    content_generator: true,
    analytics_syncer: true,
    reporting_engine: true,
  };

  static start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('⚡ MarketMind Background Automation Engine started');

    // Run periodic check every 30 seconds
    this.timerHandle = setInterval(() => {
      this.runCycle();
    }, 30000);
  }

  static stop() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    this.isRunning = false;
    console.log('🛑 MarketMind Automation Engine stopped');
  }

  static pauseAll() {
    this.globalPaused = true;
    for (const key of Object.keys(this.moduleStates)) {
      this.moduleStates[key] = false;
    }
  }

  static resumeAll() {
    this.globalPaused = false;
    for (const key of Object.keys(this.moduleStates)) {
      this.moduleStates[key] = true;
    }
  }

  static toggleModule(moduleId: string, isEnabled: boolean) {
    this.moduleStates[moduleId] = isEnabled;
  }

  static getStatus(): AutomationModuleStatus[] {
    const now = new Date();
    const nextDaily = new Date(now.getTime() + 3600000 * 4).toLocaleTimeString();
    const nextWeekly = new Date(now.getTime() + 86400000 * 2).toLocaleDateString();

    return [
      {
        id: 'marketing_brain',
        name: 'AI Marketing Brain',
        status: !this.globalPaused && this.moduleStates.marketing_brain ? 'ACTIVE' : 'PAUSED',
        lastRun: '2 mins ago',
        nextRun: 'In 28 mins',
        frequency: 'Continuous / 30m',
        icon: 'BrainCircuit',
      },
      {
        id: 'seo_monitor',
        name: 'SEO & Health Crawler',
        status: !this.globalPaused && this.moduleStates.seo_monitor ? 'ACTIVE' : 'PAUSED',
        lastRun: '1 hour ago',
        nextRun: nextDaily,
        frequency: 'Daily (02:00 AM)',
        icon: 'Search',
      },
      {
        id: 'social_scheduler',
        name: 'Social Auto-Scheduler',
        status: !this.globalPaused && this.moduleStates.social_scheduler ? 'ACTIVE' : 'PAUSED',
        lastRun: '15 mins ago',
        nextRun: 'In 45 mins',
        frequency: 'Hourly',
        icon: 'Calendar',
      },
      {
        id: 'ads_monitor',
        name: 'Ads & Budget Guardrails',
        status: !this.globalPaused && this.moduleStates.ads_monitor ? 'ACTIVE' : 'PAUSED',
        lastRun: '5 mins ago',
        nextRun: 'In 10 mins',
        frequency: 'Every 15m',
        icon: 'Megaphone',
      },
      {
        id: 'content_generator',
        name: 'Content & Copy Engine',
        status: !this.globalPaused && this.moduleStates.content_generator ? 'ACTIVE' : 'PAUSED',
        lastRun: '3 hours ago',
        nextRun: nextWeekly,
        frequency: 'Weekly',
        icon: 'FileText',
      },
      {
        id: 'analytics_syncer',
        name: 'Analytics & Attribution',
        status: !this.globalPaused && this.moduleStates.analytics_syncer ? 'ACTIVE' : 'PAUSED',
        lastRun: '10 mins ago',
        nextRun: 'In 20 mins',
        frequency: 'Every 30m',
        icon: 'BarChart3',
      },
      {
        id: 'reporting_engine',
        name: 'Executive Reporting Agent',
        status: !this.globalPaused && this.moduleStates.reporting_engine ? 'ACTIVE' : 'PAUSED',
        lastRun: 'Today 08:00 AM',
        nextRun: 'Tomorrow 08:00 AM',
        frequency: 'Daily / Weekly',
        icon: 'PieChart',
      },
    ];
  }

  private static async runCycle() {
    if (this.globalPaused) return;

    try {
      const businesses = await prisma.business.findMany({
        where: { emergencyStop: false },
        take: 5,
      });

      for (const biz of businesses) {
        walletBillingContext.enterWith({ organizationId: biz.organizationId });
        // Log automated sanity check in activity logs
        const traceId = `auto-${Date.now().toString(36)}`;

        // Check scheduled social posts that need publishing
        const pendingPosts = await prisma.socialPost.findMany({
          where: {
            businessId: biz.id,
            status: 'SCHEDULED',
            scheduledTime: { lte: new Date() },
          },
          take: 2,
        });

        for (const post of pendingPosts) {
          let hashtags: string[] = [];
          try {
            hashtags = JSON.parse(post.hashtagsJson || '[]');
          } catch {
            hashtags = [];
          }

          const platformUpper = (post.platform || 'LINKEDIN').toUpperCase();
          const result = await SocialPublishService.publishOrQueue({
            platform: platformUpper,
            content: post.caption,
            hashtags,
            scheduledTime: post.scheduledTime?.toISOString(),
            organizationId: biz.organizationId,
          });

          if (result.success && (result.status === 'PUBLISHED' || result.status === 'WEBHOOK_DISPATCHED')) {
            await prisma.socialPost.update({
              where: { id: post.id },
              data: {
                status: 'PUBLISHED',
                publishedUrl: result.permalink,
                platformPostId: result.externalPostId,
                isSandboxMode: false,
                engagementJson: JSON.stringify({ likes: 0, shares: 0, comments: 0, clicks: 0 }),
              },
            });

            await prisma.activityLog.create({
              data: {
                businessId: biz.id,
                agentType: 'SOCIAL_AGENT',
                actionSummary: `Published scheduled post to ${platformUpper}`,
                details: `Topic: "${post.topic}". ${result.message}`,
                status: 'SUCCESS',
                traceId,
              },
            });
          } else {
            // Did not succeed with live publishing or webhook dispatch
            await prisma.socialPost.update({
              where: { id: post.id },
              data: {
                status: 'DRAFT',
                isSandboxMode: true,
              },
            });

            await prisma.activityLog.create({
              data: {
                businessId: biz.id,
                agentType: 'SOCIAL_AGENT',
                actionSummary: `Scheduled post publishing deferred for ${platformUpper}`,
                details: `Topic: "${post.topic}". ${result.message}`,
                status: 'WARNING',
                traceId,
              },
            });
          }
        }
      }
    } catch (e) {
      console.error('Error during automation cycle:', e);
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(e);
      }
    }
  }
}
