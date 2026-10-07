import { prisma } from '../db';

export interface BudgetStatus {
  monthlyBudget: number;
  monthlySpendSoFar: number;
  monthlyRemaining: number;
  dailyBudgetLimit: number;
  todaySpend: number;
  emergencyStopActive: boolean;
  status: 'NORMAL' | 'WARNING' | 'EMERGENCY_STOPPED' | 'EXCEEDED';
  percentUsed: number;
}

export class BudgetService {
  static async getBusinessBudgetStatus(businessId: string): Promise<BudgetStatus> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { adCampaigns: true },
    });

    if (!business) {
      throw new Error(`Business ${businessId} not found`);
    }

    if (business.emergencyStop) {
      return {
        monthlyBudget: business.monthlyBudget,
        monthlySpendSoFar: 0,
        monthlyRemaining: 0,
        dailyBudgetLimit: business.dailyBudgetLimit,
        todaySpend: 0,
        emergencyStopActive: true,
        status: 'EMERGENCY_STOPPED',
        percentUsed: 0,
      };
    }

    // Sum spend from ad campaigns
    let totalSpend = 0;
    for (const camp of business.adCampaigns) {
      try {
        const metrics = JSON.parse(camp.metricsJson || '{}');
        totalSpend += metrics.spend || 0;
      } catch {}
    }

    const todaySpend = Math.round(totalSpend * 0.08); // Today's slice of ad spend
    const percentUsed = Math.min(100, Math.round((totalSpend / (business.monthlyBudget || 1)) * 100));

    let status: BudgetStatus['status'] = 'NORMAL';
    if (percentUsed >= 95) {
      status = 'EXCEEDED';
    } else if (percentUsed >= 80) {
      status = 'WARNING';
    }

    return {
      monthlyBudget: business.monthlyBudget,
      monthlySpendSoFar: totalSpend,
      monthlyRemaining: Math.max(0, business.monthlyBudget - totalSpend),
      dailyBudgetLimit: business.dailyBudgetLimit,
      todaySpend,
      emergencyStopActive: false,
      status,
      percentUsed,
    };
  }

  static async triggerEmergencyStop(businessId: string, reason: string): Promise<void> {
    await prisma.business.update({
      where: { id: businessId },
      data: { emergencyStop: true },
    });

    // Pause all running ad campaigns immediately
    await prisma.adCampaign.updateMany({
      where: { businessId, status: 'ACTIVE' },
      data: { status: 'PAUSED' },
    });

    // Log the emergency action
    await prisma.activityLog.create({
      data: {
        businessId,
        agentType: 'OPTIMIZATION_AGENT',
        actionSummary: '🚨 EMERGENCY STOP ACTIVATED',
        details: `All active campaigns and autonomous budget shifts were immediately paused. Reason: ${reason}`,
        status: 'WARNING',
        traceId: `emg-${Date.now()}`,
      },
    });
  }

  static async resumeAutomation(businessId: string): Promise<void> {
    await prisma.business.update({
      where: { id: businessId },
      data: { emergencyStop: false },
    });

    await prisma.activityLog.create({
      data: {
        businessId,
        agentType: 'OPTIMIZATION_AGENT',
        actionSummary: '✅ Automation Resumed',
        details: 'Emergency stop cleared. Autonomous campaign monitoring and optimization resumed.',
        status: 'SUCCESS',
        traceId: `res-${Date.now()}`,
      },
    });
  }

  static checkBudgetPermitted(
    currentDailySpend: number,
    proposedNewDailySpend: number,
    maxDailyLimit: number
  ): { allowed: boolean; requiresApproval: boolean; reason?: string } {
    if (proposedNewDailySpend > maxDailyLimit) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Proposed daily spend ($${proposedNewDailySpend}) strictly exceeds configured hard limit of $${maxDailyLimit}.`,
      };
    }

    const increaseRatio = (proposedNewDailySpend - currentDailySpend) / (currentDailySpend || 1);
    if (increaseRatio > 0.2) {
      return {
        allowed: true,
        requiresApproval: true,
        reason: `Budget increase of ${(increaseRatio * 100).toFixed(1)}% exceeds the 20% safe auto-scale threshold. Human approval required.`,
      };
    }

    return { allowed: true, requiresApproval: false };
  }
}
