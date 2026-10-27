import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { chargeForFeature } from '../services/feature-billing.service';
import { getTenantBusiness } from '../middleware/tenant';
import { AdsAgent } from '../ai/agents/ads.agent';
import { BudgetService } from '../services/budget.service';

const router = Router();

router.get('/campaigns', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const biz = await getTenantBusiness(req, businessId);

    if (!biz) return res.json([]);

    const campaigns = await prisma.adCampaign.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      campaigns.map((c) => ({
        ...c,
        headlines: JSON.parse(c.headlinesJson || '[]'),
        descriptions: JSON.parse(c.descriptionsJson || '[]'),
        negativeKeywords: JSON.parse(c.negativeKeywords || '[]'),
        metrics: JSON.parse(c.metricsJson || '{}'),
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/campaigns/generate', authMiddleware, chargeForFeature('ads_campaign'), async (req: AuthRequest, res: Response) => {
  try {
    const { businessId, platform } = req.body;
    const biz = await getTenantBusiness(req, businessId, res);

    if (!biz) return;

    let products: string[] = [];
    try {
      products = JSON.parse(biz.productsAndServices);
    } catch {
      products = ['Core Automation Suite'];
    }

    const campaign = await AdsAgent.planCampaign(
      {
        id: biz.id,
        name: biz.name,
        industry: biz.industry,
        productsAndServices: products,
        monthlyBudget: biz.monthlyBudget,
        dailyBudgetLimit: biz.dailyBudgetLimit,
        brandTone: biz.brandTone,
      },
      platform || 'google_ads'
    );

    const record = await prisma.adCampaign.create({
      data: {
        businessId: biz.id,
        platform: campaign.platform,
        campaignName: campaign.campaignName,
        objective: campaign.objective,
        dailyBudget: campaign.dailyBudget,
        status: 'PAUSED', // Always initial PAUSED state for human review
        headlinesJson: JSON.stringify(campaign.headlines),
        descriptionsJson: JSON.stringify(campaign.descriptions),
        targetAudience: campaign.targetAudience,
        negativeKeywords: JSON.stringify(campaign.negativeKeywords || []),
        creativeConcept: campaign.creativeConcept,
        callToAction: campaign.callToAction,
        metricsJson: JSON.stringify(campaign.metrics),
      },
    });

    res.json({ success: true, campaign: record });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Deploy to live Google Ads / Meta Ads (with mandatory PAUSED status guardrail)
router.post('/campaigns/deploy-live', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId, campaignName, platform, dailyBudget, headlines, descriptions, negativeKeywords } = req.body;
    const biz = await getTenantBusiness(req, businessId, res);
    if (!biz) return;

    let deployResult: any;

    if (platform === 'meta_ads' || platform?.startsWith('meta_') || platform === 'whatsapp_business') {
      const { MetaAdsService } = await import('../services/metaads.service');
      deployResult = await MetaAdsService.deployCampaign({
        businessId: biz.id,
        campaignName: campaignName || `${biz.name} - Automated Growth`,
        dailyBudgetDollars: Number(dailyBudget) || 25,
        objective: 'OUTCOME_LEADS',
        headlines: headlines || [`Scale with ${biz.name}`],
        descriptions: descriptions || [`Discover autonomous intelligence for ${biz.industry}`],
      });
    } else {
      const { GoogleAdsService } = await import('../services/googleads.service');
      deployResult = await GoogleAdsService.deployCampaign({
        businessId: biz.id,
        campaignName: campaignName || `${biz.name} - Search High Intent`,
        dailyBudgetDollars: Number(dailyBudget) || 35,
        headlines: headlines || [`Official ${biz.name}`, 'Transform Your Growth'],
        descriptions: descriptions || [`Explore top-rated solutions by ${biz.name}`],
        negativeKeywords: negativeKeywords || ['free download', 'torrent', 'cracked'],
        finalUrl: biz.websiteUrl,
      });
    }

    // Save to database in PAUSED mode
    const campaign = await prisma.adCampaign.create({
      data: {
        businessId: biz.id,
        platform: platform || 'google_ads',
        campaignName: campaignName || `${biz.name} Live Campaign`,
        objective: 'LEAD_GENERATION',
        dailyBudget: Number(dailyBudget) || 35,
        status: 'PAUSED', // SAFETY GUARANTEE
        headlinesJson: JSON.stringify(headlines || []),
        descriptionsJson: JSON.stringify(descriptions || []),
        targetAudience: 'In-market decision makers & commercial intent',
        negativeKeywords: JSON.stringify(negativeKeywords || []),
        creativeConcept: 'High-contrast value proposition with direct CTA',
        callToAction: 'Get Demo',
        metricsJson: JSON.stringify({
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          roas: 0,
          safetyStatus: 'PAUSED_SAFE_GUARDRAIL',
        }),
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId: biz.id,
        agentType: 'ADS_AGENT',
        actionSummary: `Ads Live Deployment: ${campaign.campaignName}`,
        details: `${deployResult.message} (Status: PAUSED)`,
        status: 'SUCCESS',
        traceId: `ad-deploy-${Date.now()}`,
      },
    });

    res.json({
      success: true,
      campaign,
      deployResult,
      safetyNotice: 'Campaign is safely created in PAUSED status. No spend will occur until manually enabled.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/campaigns/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const biz = await getTenantBusiness(req);
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    const existing = await prisma.adCampaign.findFirst({
      where: { id, businessId: biz.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Campaign not found or unauthorized' });
    }

    const campaign = await prisma.adCampaign.update({
      where: { id: existing.id },
      data: { status },
    });
    res.json(campaign);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
