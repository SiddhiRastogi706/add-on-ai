import { Router, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { openStreetMapSearchLimiter } from '../middleware/rate-limit';
import { getTenantBusiness } from '../middleware/tenant';
import { OpenStreetMapError, OpenStreetMapService } from '../services/openstreetmap.service';
import { SerperError, SerperService } from '../services/serper.service';
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

router.get('/local-config', (_req, res) => {
  res.json({
    configured: SerperService.isConfigured() || OpenStreetMapService.isConfigured(),
    provider: SerperService.isConfigured() ? 'Serper.dev' : 'OpenStreetMap',
  });
});

router.post('/local-search', authMiddleware, openStreetMapSearchLimiter, async (req: AuthRequest, res: Response) => {
  const { businessType, location } = req.body as {
    businessType?: unknown;
    location?: unknown;
  };
  if (
    typeof businessType !== 'string' ||
    typeof location !== 'string' ||
    !businessType.trim() ||
    !location.trim() ||
    businessType.length > 100 ||
    location.length > 100
  ) {
    return res.status(400).json({
      error: 'Enter a business or service and a city or area (up to 100 characters each).',
    });
  }

  try {
    const results = SerperService.isConfigured()
      ? await SerperService.searchCompetitors(businessType.trim(), location.trim())
      : await OpenStreetMapService.searchCompetitors(businessType.trim(), location.trim());
    res.json(results);
  } catch (error) {
    if (error instanceof SerperError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OpenStreetMapError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('[CompetitorsRoute] Competitor search failed:', error);
    return res.status(500).json({ error: 'Local competitor search failed unexpectedly.' });
  }
});

router.post('/analyze', optionalAuthMiddleware, (_req: AuthRequest, res: Response) => {
  res.status(410).json({
    error: 'The legacy domain audit used modeled estimates and has been retired. Use POST /api/competitors/local-search for live local listings.',
  });
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
