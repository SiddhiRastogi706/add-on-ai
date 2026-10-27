import { prisma } from '../db';
import { prismaBillingStore } from './feature-billing.service';

// AI error ko alag pehchanne ke liye (agents isse rethrow karte hain)
export class WalletBillingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletBillingError';
  }
}

export class WalletService {
  // balancePaise = sirf top-up wallet; totalPaise = bonus + plan credit + wallet
  static async getWallet(organizationId: string) {
    const [balances, transactions] = await Promise.all([
      prismaBillingStore.getBalances(organizationId),
      prisma.walletTransaction.findMany({
        where: { organizationId, status: 'POSTED' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, amountPaise: true, type: true, status: true, description: true, createdAt: true },
      }),
    ]);

    return {
      balancePaise: balances.walletPaise,
      bonusPaise: balances.bonusPaise,
      planCreditPaise: balances.planCreditPaise,
      totalPaise: balances.bonusPaise + balances.planCreditPaise + balances.walletPaise,
      transactions,
    };
  }
}
