import { Router, Response } from 'express';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { getTenantBusiness } from '../middleware/tenant';
import { CompetitorAgent } from '../ai/agents/competitor.agent';
import { prisma } from '../db';

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

// POST /api/competitors/analyze
router.post('/analyze', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { competitorUrl, businessId } = req.body;
    if (!competitorUrl) {
      return res.status(400).json({ error: 'Competitor URL is required' });
    }

    const biz = await resolveBusiness(req, businessId);
    const result = await CompetitorAgent.analyzeCompetitor(
      competitorUrl,
      biz?.industry || 'Transportation & Logistics',
      biz?.websiteUrl,
      biz?.name
    );

    // Save or update in database if business exists
    if (biz?.id) {
      const existing = await prisma.competitor.findFirst({
        where: { businessId: biz.id, domain: result.competitorDomain },
      }).catch(() => null);

      if (existing) {
        await prisma.competitor.update({
          where: { id: existing.id },
          data: {
            name: result.competitorName,
            trafficEstimate: result.organicTraffic.monthlyVisitsFormatted,
            strengthsJson: JSON.stringify(result.topKeywords.slice(0, 5)),
            weaknessesJson: JSON.stringify(result.actionableGaps.slice(0, 4)),
            updatedAt: new Date(),
          },
        }).catch(() => null);
      } else {
        await prisma.competitor.create({
          data: {
            businessId: biz.id,
            name: result.competitorName,
            domain: result.competitorDomain,
            trafficEstimate: result.organicTraffic.monthlyVisitsFormatted,
            strengthsJson: JSON.stringify(result.topKeywords.slice(0, 5)),
            weaknessesJson: JSON.stringify(result.actionableGaps.slice(0, 4)),
          },
        }).catch(() => null);
      }
    }

    res.json(result);
  } catch (err: any) {
    console.error('[CompetitorsRoute] Analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/competitors - list saved competitors for this business
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const biz = await resolveBusiness(req, businessId);
    if (!biz) return res.json([]);

    const competitors = await prisma.competitor.findMany({
      where: { businessId: biz.id },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(competitors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/competitors - save a new competitor to track
router.post('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId, name, domain } = req.body;
    const biz = await resolveBusiness(req, businessId);
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    const cleanDomain = (domain || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    const compName = name || cleanDomain.split('.')[0];

    const created = await prisma.competitor.create({
      data: {
        businessId: biz.id,
        name: compName,
        domain: cleanDomain,
        trafficEstimate: 'Scanning...',
      },
    });

    res.json({ success: true, competitor: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/competitors/:id
router.delete('/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.competitor.delete({ where: { id } });
    res.json({ success: true, message: 'Competitor removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/competitors/action/add-to-calendar
router.post('/action/add-to-calendar', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId, topic, caption, hashtags, targetPlatform = 'linkedin' } = req.body;
    const biz = await resolveBusiness(req, businessId);
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    const post = await prisma.socialPost.create({
      data: {
        businessId: biz.id,
        platform: targetPlatform.toLowerCase(),
        contentType: 'post',
        topic: topic || 'Outranking Competitor Topic',
        caption: caption || `Here is why modern businesses choose ${biz.name} for reliable operations...`,
        creativeConcept: 'High-contrast data comparison banner highlighting 0 hidden charges & 24/7 reliability.',
        hashtagsJson: JSON.stringify(hashtags || ['BusinessGrowth', 'QualityFirst']),
        cta: 'Click our profile link to get a direct quote today.',
        scheduledTime: new Date(Date.now() + 24 * 3600 * 1000), // tomorrow
        status: 'SCHEDULED',
        isSandboxMode: false,
      },
    });

    res.json({ success: true, message: 'Opportunity added to Social Calendar Queue!', post });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
