import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getTenantBusiness } from '../middleware/tenant';
import { AutomationEngine } from '../automation/engine';
import { prisma } from '../db';

const router = Router();

router.get('/status', authMiddleware, (req: AuthRequest, res: Response) => {
  const modules = AutomationEngine.getStatus();
  res.json({ modules });
});

router.post('/pause-all', authMiddleware, (req: AuthRequest, res: Response) => {
  AutomationEngine.pauseAll();
  res.json({ success: true, message: 'All automated background workers paused.' });
});

router.post('/resume-all', authMiddleware, (req: AuthRequest, res: Response) => {
  AutomationEngine.resumeAll();
  res.json({ success: true, message: 'All automated background workers resumed.' });
});

router.post('/toggle-module', authMiddleware, (req: AuthRequest, res: Response) => {
  const { moduleId, isEnabled } = req.body;
  AutomationEngine.toggleModule(moduleId, isEnabled);
  res.json({ success: true, moduleId, isEnabled });
});

router.get('/logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const biz = await getTenantBusiness(req, businessId);

    if (!biz) return res.json([]);

    const logs = await prisma.activityLog.findMany({
      where: { businessId: biz.id },
      orderBy: { timestamp: 'desc' },
      take: 40,
    });

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
