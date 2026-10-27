import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { runBackgroundAI } from '../services/feature-billing.service';
import { getTenantBusiness } from '../middleware/tenant';
import { MarketingBrainOrchestrator } from '../ai/brain.orchestrator';

const router = Router();

// Get live brain state and 10 agents
router.get('/state', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const biz = await getTenantBusiness(req, businessId);
    if (!biz) {
      return res.status(404).json({ error: 'No business found for your organization' });
    }

    const state = await MarketingBrainOrchestrator.getBrainState(biz.id);
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger full AI re-sync
router.post('/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.body;
    const biz = await getTenantBusiness(req, businessId);
    if (!biz) {
      return res.status(404).json({ error: 'No business found for your organization to re-sync' });
    }

    const targetBizId = biz.id;

    // Background mein; free plan par skip, paid par credit se charge
    void runBackgroundAI(req.user!, 'brain_onboarding', () =>
      MarketingBrainOrchestrator.runFullOnboardingAnalysis(targetBizId)
    ).then((status) => {
      if (status === 'skipped') console.log('[brain] manual sync skipped: AI automation is off for this plan');
    });

    res.json({ success: true, message: 'Marketing Brain orchestrated cycle initiated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
