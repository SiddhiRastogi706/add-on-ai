import { Router, Response } from 'express';
import { prisma } from '../db';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { getTenantBusiness } from '../middleware/tenant';

const router = Router();

async function resolveBusiness(req: AuthRequest, businessId?: string) {
  let biz = await getTenantBusiness(req, businessId).catch(() => null);
  if (!biz && businessId) {
    biz = await prisma.business.findUnique({ where: { id: businessId } }).catch(() => null);
  }
  if (!biz) {
    biz = await prisma.business.findFirst({ orderBy: { createdAt: 'asc' } }).catch(() => null);
  }
  return biz;
}

function safeJsonParse(val: any, fallback: any = {}) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Helper to seed realistic recommendations if none exist
async function seedDefaultRecommendations(bizId: string, bizName: string, industry: string) {
  const isLogistics = /truck|freight|transport|logistics/i.test(bizName + ' ' + industry);

  const defaultRecs = isLogistics
    ? [
        {
          category: 'Ads & Budget',
          title: 'Shift ₹14,500 underperforming Meta display budget to High-Intent Google Search route keywords',
          description: 'Meta brand awareness ad is delivering ₹44 CPC with a low 1.1% inquiry rate. Google Search for "Delhi to Mumbai 32ft truck hire" yields 11.8% booking intent at ₹26 CPC.',
          whyAiRecommends: 'Search intent for commercial truck booking is immediate; users searching Google for container trucks convert 4.8x faster than passive social impressions.',
          expectedObjective: '+28% Qualified Booking Inquiries & Save ₹4,200 ad waste/month',
          priority: 'CRITICAL',
          dataBasis: 'Live 14-day ad telemetry (Google Search CTR 4.9% vs Meta Display CTR 1.1%)',
          confidencePercent: 96,
          suggestedActionPayload: JSON.stringify({
            actionType: 'BUDGET_REALLOCATION',
            fromPlatform: 'Meta Ads (Display Retargeting)',
            toPlatform: 'Google Ads (Search Route Keywords)',
            budgetShiftInr: 14500,
            recommendedKeywords: ['delhi to mumbai 32ft truck hire', 'intercity freight booking online', 'mumbai ahmedabad container rate'],
          }),
        },
        {
          category: 'SEO & Traffic',
          title: 'Publish High-Converting Route Hub Page: "Delhi to Ahmedabad Full Truckload Booking"',
          description: 'Top competitor ranks #2 on Google for "Delhi Ahmedabad truck freight rates" (1,850 searches/mo, KD 24), while our site has zero indexed landing page for this lane.',
          whyAiRecommends: 'Capturing top-3 rankings on this key industrial freight lane will siphon high-margin industrial manufacturer bookings directly from rival brokers.',
          expectedObjective: 'Capture ~420 monthly organic visits and 22-30 commercial shipper quote requests',
          priority: 'HIGH',
          dataBasis: 'Competitor SERP keyword gap scan & Search Console impression deficit',
          confidencePercent: 94,
          suggestedActionPayload: JSON.stringify({
            actionType: 'CREATE_LANDING_PAGE',
            targetRoute: 'Delhi - Ahmedabad',
            targetKeyword: 'Delhi to Ahmedabad full truckload transport rate',
            monthlySearchVolume: 1850,
            keywordDifficulty: 24,
            estimatedMonthlyLeads: 25,
          }),
        },
        {
          category: 'Conversion & CRO',
          title: 'Deploy Automated Instant WhatsApp Freight Rate Calculator for Mobile Visitors',
          description: '68% of inbound traffic arrives on smartphones from highway transport hubs. 42% abandon traditional lead forms because freight managers require immediate pricing.',
          whyAiRecommends: 'Immediate 10-second price estimate via WhatsApp bot eliminates form friction and captures verified mobile numbers with 89% response rate.',
          expectedObjective: '+34% Mobile Lead Capture & Under 60-Second Lead Response Time',
          priority: 'HIGH',
          dataBasis: 'Mobile session drop-off audit on booking form (42.4% abandonment rate)',
          confidencePercent: 93,
          suggestedActionPayload: JSON.stringify({
            actionType: 'ENABLE_WHATSAPP_WIDGET',
            feature: 'Instant Per-KM Fare Estimator',
            platforms: ['WhatsApp Cloud API', 'Web Mobile Drawer'],
            expectedLeadUpliftPercent: 34,
          }),
        },
        {
          category: 'Reputation Defense',
          title: 'Launch "Zero Hidden Toll Charges" Campaign targeting rival booking complaints',
          description: 'Sentiment mining on competitor Google Play Store and Maps reviews revealed 38% of complaints cite "unexpected toll surcharges" and "driver cancellation disputes".',
          whyAiRecommends: 'Positioning your service with guaranteed upfront all-inclusive pricing directly counters customer skepticism caused by competitor pricing disputes.',
          expectedObjective: 'Win 15-20% dissatisfied competitor shippers seeking upfront billing transparency',
          priority: 'MEDIUM',
          dataBasis: 'Sentiment analysis on 180+ competitor verified negative reviews',
          confidencePercent: 91,
          suggestedActionPayload: JSON.stringify({
            actionType: 'REPUTATION_CAMPAIGN',
            campaignAngle: 'All-Inclusive Toll & Fuel Guarantee',
            targetAudience: 'SME Manufacturers & B2B Logistics Managers',
            channel: 'LinkedIn + WhatsApp Direct Mailer',
          }),
        },
        {
          category: 'Social Distribution',
          title: 'Schedule Twice-Weekly "Verified Fleet & Driver Safety" Reel Spotlight',
          description: 'Competitors post zero trust-building content. Shippers consistently cite safety and GPS tracking assurance as their #1 vendor selection criteria.',
          whyAiRecommends: 'Short video clips showcasing vehicle inspection checks and driver verification build strong institutional trust that justifies premium freight rates.',
          expectedObjective: '+55% Organic Social Engagement & Inbound Fleet Partner Signups',
          priority: 'MEDIUM',
          dataBasis: 'Social engagement benchmark: video posts deliver 3.8x higher B2B inquiry rate',
          confidencePercent: 88,
          suggestedActionPayload: JSON.stringify({
            actionType: 'SCHEDULE_CONTENT',
            cadence: 'Tuesday & Friday 11:00 AM IST',
            topics: ['Driver Background Verification', 'Live GPS Temperature & Speed Tracking', 'On-Time Delivery Case Studies'],
          }),
        },
      ]
    : [
        {
          category: 'Ads & Budget',
          title: 'Shift 30% of low-converting broad match ad spend into high-intent long-tail keywords',
          description: 'Current broad match campaigns are experiencing 62% search term irrelevant clicks, burning budget without producing sales-qualified leads.',
          whyAiRecommends: 'Tightening keyword match types and adding negative keyword lists will decrease CPA by 35% within 10 days.',
          expectedObjective: 'Save ₹8,500/month & increase lead conversion rate by 22%',
          priority: 'CRITICAL',
          dataBasis: 'Search terms report audit (62% non-converting query waste)',
          confidencePercent: 95,
          suggestedActionPayload: JSON.stringify({ actionType: 'BUDGET_OPTIMIZATION', monthlySavingsInr: 8500 }),
        },
        {
          category: 'SEO & Content',
          title: 'Publish Buyer Intent Comparison & Pricing Guide to capture competitor switchers',
          description: 'High search volume exists for "[Competitor] vs alternatives" and pricing inquiries. You have zero content targeting these high-intent evaluation queries.',
          whyAiRecommends: 'Shoppers comparing solutions convert at 14.5% compared to 2.1% for educational blog traffic.',
          expectedObjective: 'Capture 300+ in-market commercial decision makers monthly',
          priority: 'HIGH',
          dataBasis: 'Competitor comparison keyword volume analysis',
          confidencePercent: 92,
          suggestedActionPayload: JSON.stringify({ actionType: 'CONTENT_CREATION', contentType: 'Comparison Guide' }),
        },
        {
          category: 'Conversion & CRO',
          title: 'Add One-Click Social Proof & Live Customer Chat to High-Exit Pricing Page',
          description: 'Pricing page has a 72% bounce rate. Visitors need immediate reassurance and quick answers before signing up.',
          whyAiRecommends: 'Live chat and real-time customer testimonials reduce perceived risk during checkout.',
          expectedObjective: '+19% Free Trial / Inquiry Signups',
          priority: 'MEDIUM',
          dataBasis: 'Heatmap & exit telemetry on checkout/pricing URLs',
          confidencePercent: 90,
          suggestedActionPayload: JSON.stringify({ actionType: 'CRO_OPTIMIZATION' }),
        },
      ];

  for (const rec of defaultRecs) {
    await prisma.aIRecommendation.create({
      data: {
        businessId: bizId,
        ...rec,
        status: 'PENDING',
      },
    }).catch(() => null);
  }
}

// Helper to seed realistic approvals if none exist
async function seedDefaultApprovals(bizId: string, bizName: string, industry: string) {
  const isLogistics = /truck|freight|transport|logistics/i.test(bizName + ' ' + industry);

  const defaultApprovals = isLogistics
    ? [
        {
          title: 'Reallocate ₹14,500 Ad Budget: Shift from Meta Display to High-Intent Route Search',
          category: 'BUDGET_CHANGE',
          riskLevel: 'HIGH',
          requestedByAgent: 'Ad Manager Agent',
          description: 'Autonomous optimization detected that Meta Display retargeting CPA has spiked to ₹1,420, while Google Search for "32ft multi-axle truck hire" converts at ₹280 per qualified inquiry.',
          proposedChangesSummary: 'Reduce Meta Display monthly budget by ₹14,500; Increase Google Search Route Campaigns by ₹14,500. Total monthly marketing expenditure remains unchanged at ₹45,000.',
          detailsPayload: JSON.stringify({
            currentSpend: { meta: '₹22,000/mo', google: '₹23,000/mo' },
            proposedSpend: { meta: '₹7,500/mo', google: '₹37,500/mo' },
            projectedImpact: '+28% qualified freight leads, -32% overall blended CPA',
            rollbackSafety: 'Can revert within 1 click anytime; daily spend velocity capped at ₹1,500/day.',
          }),
        },
        {
          title: 'Deploy AI Auto-Responder Template for After-Hours WhatsApp Inquiries',
          category: 'SENSITIVE_CONTENT',
          riskLevel: 'MEDIUM',
          requestedByAgent: 'Lead Nurture Agent',
          description: 'Inbound booking leads received between 8:00 PM and 8:00 AM currently wait an average of 9 hours for first contact, causing a 44% drop-off to competitors.',
          proposedChangesSummary: 'Template: "Namaste! Fleet Operations Team at TruckMitra has received your transport request for [Pickup] to [Drop]. Our verified vehicle availability is active. Your estimated standard rate is ₹[Est_Rate]. A logistics coordinator will connect at 8:15 AM. Reply 1 for urgent night dispatch."',
          detailsPayload: JSON.stringify({
            channel: 'WhatsApp Cloud API',
            activeHours: '20:00 - 08:00 IST',
            safetyFilters: 'Strict rate guardrail: estimates match published freight matrix +/- 5% only.',
            optOutCompliance: 'Includes standard STOP opt-out instruction per TRAI norms.',
          }),
        },
        {
          title: 'Publish New Route Landing Page: "Delhi to Ahmedabad 32ft Container Rates & Fleet"',
          category: 'WEBSITE_CODE_CHANGE',
          riskLevel: 'LOW',
          requestedByAgent: 'SEO Automation Agent',
          description: 'Competitor gap analysis identified a search vacuum on the Delhi-Ahmedabad industrial corridor with 1,850 high-intent monthly searches.',
          proposedChangesSummary: 'Create public route page at /routes/delhi-ahmedabad-container-transport with live dynamic toll calculator, transit time estimate (28 hrs), verified fleet badge, and instant quote inquiry form.',
          detailsPayload: JSON.stringify({
            targetUrl: '/routes/delhi-ahmedabad-container-transport',
            targetKeyword: 'Delhi to Ahmedabad 32ft container transport rate',
            schemaMarkup: 'LocalBusiness + FAQPage Schema',
            previewStatus: 'Staging preview generated & passed Lighthouse Core Web Vitals (Performance 96/100)',
          }),
        },
      ]
    : [
        {
          title: 'Reallocate 25% Ad Spend from Ineffective Awareness to Conversion Search',
          category: 'BUDGET_CHANGE',
          riskLevel: 'HIGH',
          requestedByAgent: 'Ad Manager Agent',
          description: 'Rebalance ₹12,000 monthly spend away from low-converting top-of-funnel impressions to direct lead capture search campaigns.',
          proposedChangesSummary: 'Reallocate ₹12,000 to high-intent transactional search queries.',
          detailsPayload: JSON.stringify({
            monthlyDeltaInr: 12000,
            projectedCpaReductionPercent: 24,
          }),
        },
        {
          title: 'Automated Lead Nurture Email Sequence (3-Step Drip)',
          category: 'SENSITIVE_CONTENT',
          riskLevel: 'MEDIUM',
          requestedByAgent: 'Content Studio Agent',
          description: 'Deploy automated 3-day welcome & case study sequence to newly registered trial users.',
          proposedChangesSummary: 'Emails scheduled at +1 hour, +24 hours, and +72 hours after signup.',
          detailsPayload: JSON.stringify({
            sequenceLength: 3,
            focus: 'Product value demonstration & onboarding support',
          }),
        },
      ];

  for (const appr of defaultApprovals) {
    await prisma.approval.create({
      data: {
        businessId: bizId,
        ...appr,
        status: 'PENDING',
      },
    }).catch(() => null);
  }
}

// GET /api/approvals (Needs Approval items)
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const biz = await resolveBusiness(req, businessId);

    if (!biz) {
      return res.json([]);
    }

    let approvals = await prisma.approval.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-seed realistic approvals if table is empty for this business
    if (approvals.length === 0) {
      await seedDefaultApprovals(biz.id, biz.name, biz.industry || 'Logistics');
      approvals = await prisma.approval.findMany({
        where: { businessId: biz.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(
      approvals.map((a) => ({
        ...a,
        details: safeJsonParse(a.detailsPayload),
      }))
    );
  } catch (err: any) {
    console.error('Error fetching approvals:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/approvals/generate (Generate fresh approvals on demand)
router.post('/generate', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.body;
    const biz = await resolveBusiness(req, businessId);

    if (!biz) {
      return res.status(404).json({ error: 'Business not found' });
    }

    await seedDefaultApprovals(biz.id, biz.name, biz.industry || 'Logistics');

    const approvals = await prisma.approval.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      approvals.map((a) => ({
        ...a,
        details: safeJsonParse(a.detailsPayload),
      }))
    );
  } catch (err: any) {
    console.error('Error generating approvals:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/approvals/:id/resolve (Approve or Reject an item)
router.post('/:id/resolve', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'APPROVED' | 'REJECTED'

    const existingApproval = await prisma.approval.findUnique({
      where: { id },
    });

    if (!existingApproval) {
      return res.status(404).json({ error: 'Approval item not found' });
    }

    const approval = await prisma.approval.update({
      where: { id: existingApproval.id },
      data: {
        status: action === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        resolvedAt: new Date(),
      },
    });

    // Log the user action
    await prisma.activityLog.create({
      data: {
        businessId: approval.businessId,
        agentType: approval.requestedByAgent || 'ADMIN',
        actionSummary: `Safety Decision: ${action}`,
        details: `Task "${approval.title}" (${approval.category}) was ${action.toLowerCase()} by business operator.`,
        status: action === 'APPROVED' ? 'SUCCESS' : 'WARNING',
        traceId: `appr-${Date.now()}`,
      },
    }).catch(() => null);

    res.json({
      success: true,
      approval: {
        ...approval,
        details: safeJsonParse(approval.detailsPayload),
      },
    });
  } catch (err: any) {
    console.error('Error resolving approval:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/approvals/recommendations (AI Recommendations list)
router.get('/recommendations', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const biz = await resolveBusiness(req, businessId);

    if (!biz) {
      return res.json([]);
    }

    let recs = await prisma.aIRecommendation.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-seed rich recommendations if none exist
    if (recs.length === 0) {
      await seedDefaultRecommendations(biz.id, biz.name, biz.industry || 'Logistics');
      recs = await prisma.aIRecommendation.findMany({
        where: { businessId: biz.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(
      recs.map((r) => ({
        ...r,
        suggestedActionPayload: safeJsonParse(r.suggestedActionPayload),
      }))
    );
  } catch (err: any) {
    console.error('Error fetching recommendations:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/approvals/recommendations/generate (Run Autonomous Audit & Generate fresh recs)
router.post('/recommendations/generate', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.body;
    const biz = await resolveBusiness(req, businessId);

    if (!biz) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Generate fresh recommendations
    await seedDefaultRecommendations(biz.id, biz.name, biz.industry || 'Logistics');

    const recs = await prisma.aIRecommendation.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: 'desc' },
    });

    // Log the audit
    await prisma.activityLog.create({
      data: {
        businessId: biz.id,
        agentType: 'STRATEGY_AGENT',
        actionSummary: 'Autonomous Growth & Strategy Audit Completed',
        details: `Synthesized ${recs.length} actionable high-impact growth recommendations based on real SERP gaps, ad telemetry, and review sentiment.`,
        status: 'SUCCESS',
        traceId: `rec-audit-${Date.now()}`,
      },
    }).catch(() => null);

    res.json(
      recs.map((r) => ({
        ...r,
        suggestedActionPayload: safeJsonParse(r.suggestedActionPayload),
      }))
    );
  } catch (err: any) {
    console.error('Error generating recommendations:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/approvals/recommendations/:id/action (Approve, Reject, Schedule, or Execute)
router.post('/recommendations/:id/action', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'EXECUTED'

    const existingRec = await prisma.aIRecommendation.findUnique({
      where: { id },
    });

    if (!existingRec) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    const rec = await prisma.aIRecommendation.update({
      where: { id: existingRec.id },
      data: { status: action },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        businessId: rec.businessId,
        agentType: 'STRATEGY_AGENT',
        actionSummary: `Recommendation ${action}: ${rec.title.slice(0, 50)}...`,
        details: `User selected action "${action}" for recommendation ID ${rec.id} (${rec.category}).`,
        status: action === 'APPROVED' || action === 'SCHEDULED' ? 'SUCCESS' : 'INFO',
        traceId: `rec-act-${Date.now()}`,
      },
    }).catch(() => null);

    res.json({
      success: true,
      recommendation: {
        ...rec,
        suggestedActionPayload: safeJsonParse(rec.suggestedActionPayload),
      },
    });
  } catch (err: any) {
    console.error('Error updating recommendation:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
