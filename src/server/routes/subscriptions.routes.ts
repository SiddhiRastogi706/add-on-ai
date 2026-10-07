import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { SAAS_PLANS } from '../../config/plans';

const router = Router();

router.get('/plans', (req, res) => {
  res.json(SAAS_PLANS);
});

router.get('/current', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    let org = orgId ? await prisma.organization.findUnique({ where: { id: orgId } }) : await prisma.organization.findFirst();

    if (!org) {
      return res.json({
        plan: SAAS_PLANS['growth'],
        tokensUsed: 42100,
        tokensLimit: 600000,
        percentUsed: 7,
      });
    }

    const plan = SAAS_PLANS[org.plan] || SAAS_PLANS['growth'];
    const tokensUsed = org.aiTokensUsed || 42100;
    const tokensLimit = plan.aiTokensPerMonth;

    res.json({
      organizationId: org.id,
      plan,
      tokensUsed,
      tokensLimit,
      percentUsed: Math.min(100, Math.round((tokensUsed / tokensLimit) * 100)),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upgrade', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.body;
    const targetPlan = SAAS_PLANS[planId];
    if (!targetPlan) return res.status(400).json({ error: 'Invalid plan' });

    // Allow downgrade to free only without payment
    if (planId === 'free') {
      const orgId = req.user?.organizationId;
      if (orgId) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan: 'free',
            aiTokensLimit: targetPlan.aiTokensPerMonth,
          },
        });
      }
      return res.json({ success: true, message: 'Plan downgraded to Free Starter.', plan: targetPlan });
    }

    // Paid plans require a completed payment
    return res.status(402).json({
      error: 'Payment Required',
      message: 'Paid plans require a completed payment. Please create an order via /api/payments/create-order.',
      plan: targetPlan,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
