import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getTenantBusiness } from '../middleware/tenant';
import { LeadAgent } from '../ai/agents/lead.agent';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const biz = await getTenantBusiness(req, businessId);

    if (!biz) return res.json([]);

    const leads = await prisma.lead.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      leads.map((l) => ({
        ...l,
        notes: JSON.parse(l.notesJson || '[]'),
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId, name, email, phone, company, source, notes, valueEstimated } = req.body;
    const biz = await getTenantBusiness(req, businessId, res);

    if (!biz) return;

    const scoring = LeadAgent.scoreAndPrioritize({
      name,
      email,
      company,
      source: source || 'Direct Website',
      messageOrNote: Array.isArray(notes) ? notes.join(' ') : notes,
    });

    const lead = await prisma.lead.create({
      data: {
        businessId: biz.id,
        name,
        email,
        phone,
        company,
        source: source || 'Direct Website',
        status: 'NEW',
        leadScore: scoring.score,
        aiPriority: scoring.priority,
        aiSuggestedAction: scoring.suggestedAction,
        notesJson: JSON.stringify(Array.isArray(notes) ? notes : [notes || 'Lead initiated contact']),
        valueEstimated: Number(valueEstimated) || 1200,
      },
    });

    res.json(lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.lead.update({
      where: { id },
      data: { status },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
