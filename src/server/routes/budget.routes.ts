import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getTenantBusiness } from '../middleware/tenant';
import { BudgetService } from '../services/budget.service';

const router = Router();

router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const biz = await getTenantBusiness(req, businessId, res);
    if (!biz) return;

    const status = await BudgetService.getBusinessBudgetStatus(biz.id);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/limits', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId, monthlyBudget, dailyBudgetLimit } = req.body;
    const biz = await getTenantBusiness(req, businessId, res);
    if (!biz) return;

    const updated = await prisma.business.update({
      where: { id: biz.id },
      data: {
        monthlyBudget: Number(monthlyBudget) || biz.monthlyBudget,
        dailyBudgetLimit: Number(dailyBudgetLimit) || biz.dailyBudgetLimit,
      },
    });

    res.json({
      success: true,
      monthlyBudget: updated.monthlyBudget,
      dailyBudgetLimit: updated.dailyBudgetLimit,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
