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
    });
    console.log(`✨ Auto-provisioned business profile for org: ${org?.name} (${primaryBusiness.id})`);
  }

  return primaryBusiness;
}
