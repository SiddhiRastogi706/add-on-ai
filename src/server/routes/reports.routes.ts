import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getTenantBusiness } from '../middleware/tenant';
import { ReportingAgent } from '../ai/agents/reporting.agent';
import { EmailService } from '../services/email.service';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const biz = await getTenantBusiness(req, businessId);

    if (!biz) return res.json([]);

    const reports = await prisma.executiveReport.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      reports.map((r) => ({
        ...r,
        sections: JSON.parse(r.sectionsJson || '{}'),
        metricsSummary: JSON.parse(r.metricsJson || '{}'),
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { type, businessId } = req.body;
    const biz = await getTenantBusiness(req, businessId, res);

    if (!biz) return;

    const rep = ReportingAgent.generateReport(biz, type || 'WEEKLY_REVIEW');
    const record = await prisma.executiveReport.create({
      data: {
        businessId: biz.id,
        type: rep.type,
        periodLabel: rep.periodLabel,
        sectionsJson: JSON.stringify(rep.sections),
        metricsJson: JSON.stringify(rep.metricsSummary),
      },
    });

    res.json({
      ...record,
      sections: rep.sections,
      metricsSummary: rep.metricsSummary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CSV export
router.get('/:id/export-csv', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const biz = await getTenantBusiness(req);
    if (!biz) return res.status(404).send('Business not found');

    const report = await prisma.executiveReport.findFirst({
      where: { id, businessId: biz.id },
    });
    if (!report) return res.status(404).send('Report not found');

    const sections = JSON.parse(report.sectionsJson || '{}');
    const metrics = JSON.parse(report.metricsJson || '{}');

    let csv = `MarketMind AI Executive Marketing Briefing\n`;
    csv += `Type,${report.type}\nPeriod,${report.periodLabel}\nGenerated,${report.createdAt}\n\n`;
    csv += `Metric,Value\n`;
    csv += `Traffic Change %,+${metrics.trafficChangePct}%\n`;
    csv += `Leads Generated,${metrics.leadsGenerated}\n`;
    csv += `Ad Spend Total,$${metrics.adSpend}\n`;
    csv += `Average ROAS,${metrics.avgRoas}x\n`;
    csv += `SEO Issues Resolved,${metrics.seoIssuesFixed}\n`;
    csv += `Social Posts Published,${metrics.socialPostsPublished}\n\n`;
    csv += `Section,Content\n`;
    csv += `"What Happened","${(sections.whatHappened || '').replace(/"/g, '""')}"\n`;
    csv += `"Why It Happened","${(sections.whyItHappened || '').replace(/"/g, '""')}"\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=marketmind-report-${report.id.slice(0, 8)}.csv`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Email report to user or recipient
router.post('/:id/email', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { to } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized: missing organization context' });
    }

    const report = await prisma.executiveReport.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!report || report.business.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const targetEmail = to || req.user?.email;
    if (!targetEmail) {
      return res.status(400).json({ error: 'Recipient email is required.' });
    }

    const sections = JSON.parse(report.sectionsJson || '{}');
    const metrics = JSON.parse(report.metricsJson || '{}');

    const emailData = EmailService.templates.weeklyReport({
      businessName: report.business.name || 'Your Business',
      periodLabel: report.periodLabel,
      metricsSummary: metrics,
      sections,
    });

    const sendResult = await EmailService.sendEmail({
      to: targetEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      organizationId,
    });

    if (!sendResult.sent && sendResult.reason === 'not_configured') {
      return res.json({
        success: false,
        configured: false,
        message: 'Resend email service is not configured. Email was not dispatched.',
      });
    }

    if (!sendResult.sent && sendResult.error) {
      return res.status(502).json({
        success: false,
        error: `Failed to deliver email: ${sendResult.error}`,
      });
    }

    res.json({
      success: true,
      message: `Report successfully emailed to ${targetEmail}`,
      id: sendResult.id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
