import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from './auth';

/**
 * Safely resolves the tenant business scoped strictly to the authenticated user's organization.
 * Prevents any cross-tenant data leakage.
 */
export async function getTenantBusiness(
  req: AuthRequest,
  businessId?: string,
  res?: Response
) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    if (res) {
      res.status(401).json({ error: 'Unauthorized: missing tenant organization context' });
    }
    return null;
  }

  // If specific businessId was requested, check if it belongs to this organization
  if (businessId) {
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        organizationId,
      },
    });

    if (business) {
      return business;
    }
    // If specific ID not found, smoothly fall back to primary business
  }

  // Otherwise, get the primary business for this user's organization
  let primaryBusiness = await prisma.business.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
  });

  // Auto-provision default business profile if none exists yet for this organization
  if (!primaryBusiness) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    primaryBusiness = await prisma.business.create({
      data: {
        organizationId,
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
    });
    console.log(`✨ Auto-provisioned business profile for org: ${org?.name} (${primaryBusiness.id})`);
  }

  return primaryBusiness;
}
