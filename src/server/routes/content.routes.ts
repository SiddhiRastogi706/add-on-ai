import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { chargeForFeature } from '../services/feature-billing.service';
import { getTenantBusiness } from '../middleware/tenant';
import { ContentAgent } from '../ai/agents/content.agent';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const biz = await getTenantBusiness(req, businessId);

    if (!biz) return res.json([]);

    const items = await prisma.contentItem.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      items.map((item) => ({
        ...item,
        targetKeywords: JSON.parse(item.targetKeywordsJson || '[]'),
        faqs: JSON.parse(item.faqsJson || '[]'),
        internalLinksSuggestions: JSON.parse(item.internalLinksJson || '[]'),
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', authMiddleware, chargeForFeature('content_generate'), async (req: AuthRequest, res: Response) => {
  try {
    const { businessId, topic, contentType, targetKeyword } = req.body;
    const biz = await getTenantBusiness(req, businessId, res);

    if (!biz) return;

    const content = await ContentAgent.generateContent({
      businessId: biz.id,
      businessName: biz.name,
      industry: biz.industry,
      topic: topic || `${biz.industry} Automation Best Practices`,
      contentType: contentType || 'BLOG_POST',
      targetKeyword: targetKeyword || `${biz.industry} solutions`,
      brandTone: biz.brandTone,
    });

    const record = await prisma.contentItem.create({
      data: {
        businessId: biz.id,
        title: content.title,
        contentType: content.contentType,
        slug: content.slug,
        h1: content.h1,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        content: content.content,
        status: content.status,
        targetKeywordsJson: JSON.stringify(content.targetKeywords),
        faqsJson: JSON.stringify(content.faqs || []),
        ctaText: content.ctaText,
        internalLinksJson: JSON.stringify(content.internalLinksSuggestions || []),
        aiConfidenceScore: content.aiConfidenceScore,
        isFactValidated: content.isFactValidated,
        wordCount: content.wordCount,
      },
    });

    res.json({
      success: true,
      content: {
        ...record,
        targetKeywords: content.targetKeywords,
        faqs: content.faqs,
        internalLinksSuggestions: content.internalLinksSuggestions,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.contentItem.update({
      where: { id },
      data: { status },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
