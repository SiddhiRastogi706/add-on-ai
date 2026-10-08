import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { MarketingBrainOrchestrator } from '../ai/brain.orchestrator';
import { BudgetService } from '../services/budget.service';

const router = Router();

// Get active business
router.get('/active', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let business = await prisma.business.findFirst({
      where: { organizationId: req.user?.organizationId },
      orderBy: { createdAt: 'asc' },
      include: { profileAI: true, websites: true },
    });

    if (!business && req.user?.organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: req.user.organizationId } });
      business = await prisma.business.create({
        data: {
          organizationId: req.user.organizationId,
          name: org?.name || 'Your Business',
          industry: 'Professional Services',
          websiteUrl: 'https://yourwebsite.com',
          description: 'Digital growth business profile for our company.',
          productsAndServices: JSON.stringify(['Core Offer', 'Lead Generation', 'Customer Support']),
          targetAudience: 'Prospective customers and decision-makers in our market',
          targetLocations: JSON.stringify(['Local Market', 'Regional Market', 'Online']),
          marketingGoals: JSON.stringify(['Generate Leads', 'Increase Traffic', 'Improve Brand Awareness']),
          brandColors: JSON.stringify({ primary: '#2563EB', secondary: '#10B981', accent: '#F59E0B' }),
          brandTone: 'Professional, Trustworthy & Efficient',
          dailyBudgetLimit: 5000,
          currency: 'INR',
        },
        include: { profileAI: true, websites: true },
      });
      console.log(`✨ Created initial business profile for /active: ${business.name}`);
    }

    if (!business) {
      return res.status(404).json({ message: 'No business found for your organization.' });
    }

    res.json({
      business: {
        ...business,
        productsAndServices: JSON.parse(business.productsAndServices || '[]'),
        targetLocations: JSON.parse(business.targetLocations || '[]'),
        marketingGoals: JSON.parse(business.marketingGoals || '[]'),
        brandColors: JSON.parse(business.brandColors || '{"primary":"#537CF3","secondary":"#1CB77B","accent":"#DC5495"}'),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create business from onboarding wizard
router.post('/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      websiteUrl,
      industry,
      description,
      productsAndServices,
      targetAudience,
      targetLocations,
      marketingGoals,
      monthlyBudget,
      dailyBudgetLimit,
      brandColors,
      brandTone,
      language,
    } = req.body;

    const businessName = typeof name === 'string' ? name.trim() : '';
    const submittedWebsiteUrl = typeof websiteUrl === 'string' ? websiteUrl.trim() : '';
    if (!businessName || !submittedWebsiteUrl) {
      return res.status(400).json({ error: 'Business name and website URL are required.' });
    }

    let normalizedWebsiteUrl = submittedWebsiteUrl;
    if (!/^https?:\/\//i.test(normalizedWebsiteUrl)) {
      normalizedWebsiteUrl = `https://${normalizedWebsiteUrl}`;
    }
    try {
      new URL(normalizedWebsiteUrl);
    } catch {
      return res.status(400).json({ error: 'Please provide a valid website URL.' });
    }

    let orgId = req.user?.organizationId;
    if (!orgId) {
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: { name: `${businessName} Workspace`, plan: 'growth' },
        });
      }
      orgId = org.id;
    }

    const businessData = {
      name: businessName,
      websiteUrl: normalizedWebsiteUrl,
      industry: industry || 'Professional Services',
      description: description || 'Digital growth business profile for our company.',
      productsAndServices: JSON.stringify(productsAndServices || ['Core Offer', 'Lead Generation', 'Customer Support']),
      targetAudience: targetAudience || 'Prospective customers and decision-makers in our market',
      targetLocations: JSON.stringify(targetLocations || ['Local Market', 'Regional Market', 'Online']),
      marketingGoals: JSON.stringify(marketingGoals || ['Generate Leads', 'Increase Traffic', 'Improve Brand Awareness']),
      monthlyBudget: Number(monthlyBudget) || 50000,
      dailyBudgetLimit: Number(dailyBudgetLimit) || 2000,
      brandColors: JSON.stringify(brandColors || { primary: '#537CF3', secondary: '#1CB77B', accent: '#DC5495' }),
      brandTone: brandTone || 'Professional & Authoritative',
      language: language || 'English',
    };

    // Update the organization's primary profile so /active keeps returning the submitted details.
    const existingBusiness = await prisma.business.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'asc' },
    });

    const business = existingBusiness
      ? await prisma.business.update({
          where: { id: existingBusiness.id },
          data: businessData,
        })
      : await prisma.business.create({
          data: { organizationId: orgId, ...businessData },
        });

    // Run the complete initial AI onboarding analysis asynchronously
    MarketingBrainOrchestrator.runFullOnboardingAnalysis(business.id).catch((e) =>
      console.error('Error in background full onboarding analysis:', e)
    );

    res.json({
      success: true,
      businessId: business.id,
      message: 'Business created. AI Marketing Brain is analyzing your brand and website.',
    });
  } catch (err: any) {
    console.error('Business creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Trigger emergency stop
router.post('/:id/emergency-stop', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    await BudgetService.triggerEmergencyStop(id, reason || 'User requested emergency manual stop from control panel');
    res.json({ success: true, message: 'Emergency stop activated. All active campaigns paused.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Resume automation
router.post('/:id/resume', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await BudgetService.resumeAutomation(id);
    res.json({ success: true, message: 'Automation resumed. AI Marketing Brain operational.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
