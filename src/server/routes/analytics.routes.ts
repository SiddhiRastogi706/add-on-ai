import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getTenantBusiness } from '../middleware/tenant';
import { AnalyticsAgent } from '../ai/agents/analytics.agent';
import { GA4Service } from '../services/ga4.service';

const router = Router();

router.get('/snapshot', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const range = (req.query.range as any) || '30d';
    const snapshot = AnalyticsAgent.getSnapshot(range);
    res.json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/daily-summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const biz = await getTenantBusiness(req, req.query.businessId as string);
    const summary = AnalyticsAgent.generateDailySummary(biz?.name || 'Your Business');
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/ga4
 * Authenticated endpoint to fetch live Google Analytics 4 performance reports for the last 30 days.
 * Returns configured: false if GA4_PROPERTY_ID or Google OAuth tokens are missing.
 *
 * NOTE: The Google OAuth refresh token must be generated with the scope
 * https://www.googleapis.com/auth/analytics.readonly in addition to webmasters.readonly.
 */
router.get('/ga4', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    if (businessId) {
      const biz = await getTenantBusiness(req, businessId, res);
      if (!biz) return;
    }

    const report = await GA4Service.getReport(undefined, req.user?.organizationId);
    res.json(report);
  } catch (err: any) {
    console.error('[AnalyticsRoutes] GA4 report error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
