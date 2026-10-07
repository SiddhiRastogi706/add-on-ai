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
      include: { profileAI: true, websites: true },
    });

    if (!business && req.user?.organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: req.user.organizationId } });
      business = await prisma.business.create({
        data: {
          organizationId: req.user.organizationId,
          name: org?.name || 'Truck Mitra',
          industry: 'Logistics & Fleet Transport',
          websiteUrl: 'https://truckmitra.com',
          description: 'Online truck transport booking, freight rates, and fleet logistics across India.',
          productsAndServices: JSON.stringify(['Full Truckload Transport', 'Intercity Freight Booking', 'Verified Fleet Network']),
          targetAudience: 'Shippers, Fleet Owners, Transport Managers & SME Manufacturers',
          targetLocations: JSON.stringify(['India', 'Delhi NCR', 'Mumbai', 'Bangalore']),
          marketingGoals: JSON.stringify(['Increase Freight Booking Leads', 'Acquire Verified Fleet Partners']),
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

    let orgId = req.user?.organizationId;
    if (!orgId) {
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: { name: `${name} Workspace`, plan: 'growth' },
        });
      }
      orgId = org.id;
    }

    const business = await prisma.business.create({
      data: {
        organizationId: orgId,
        name: name || 'MarketMind Brand',
        websiteUrl: websiteUrl || 'https://marketmind.ai',
        industry: industry || 'Technology & SaaS',
        description: description || 'Pioneering intelligent automation and digital solutions.',
        productsAndServices: JSON.stringify(productsAndServices || ['Cloud Growth Platform', 'Automation Suite']),
        targetAudience: targetAudience || 'Founders, CMOs, and Marketing Directors',
        targetLocations: JSON.stringify(targetLocations || ['Global', 'North America']),
        marketingGoals: JSON.stringify(marketingGoals || ['Leads', 'Sales', 'Website Traffic']),
        monthlyBudget: Number(monthlyBudget) || 50000,
        dailyBudgetLimit: Number(dailyBudgetLimit) || 2000,
        brandColors: JSON.stringify(brandColors || { primary: '#537CF3', secondary: '#1CB77B', accent: '#DC5495' }),
        brandTone: brandTone || 'Professional & Authoritative',
        language: language || 'English',
      },
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
