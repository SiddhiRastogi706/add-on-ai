import { randomUUID } from 'crypto';
import { prisma } from '../db';
import { walletBillingContext } from './wallet-billing-context';

interface TokenPricing {
  input: number;
  output: number;
}

interface WalletReservation {
  id: string;
  organizationId: string;
  amountPaise: number;
}

export class WalletBillingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletBillingError';
  }
}

function getPricing(model: string): TokenPricing {
  const rawPricing = process.env.AI_USAGE_PRICING_INR_PER_MILLION_TOKENS;
  if (!rawPricing) {
    throw new WalletBillingError(
      'AI wallet billing is not configured. Set AI_USAGE_PRICING_INR_PER_MILLION_TOKENS to the provider rates before using paid AI.'
    );
  }

  let pricing: Record<string, TokenPricing>;
  try {
    const parsed: unknown = JSON.parse(rawPricing);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Pricing must be a JSON object.');
    }
    pricing = parsed as Record<string, TokenPricing>;
  } catch {
    throw new WalletBillingError('AI wallet billing rates are invalid JSON.');
  }

  const modelPricing = pricing[model] || pricing['*'];
  if (
    !modelPricing ||
    !Number.isFinite(modelPricing.input) ||
    !Number.isFinite(modelPricing.output) ||
    modelPricing.input < 0 ||
    modelPricing.output < 0 ||
    (modelPricing.input === 0 && modelPricing.output === 0)
  ) {
    throw new WalletBillingError(`AI wallet pricing is missing or invalid for model "${model}".`);
  }

  return modelPricing;
}

function calculatePaise(inputTokens: number, outputTokens: number, pricing: TokenPricing): number {
  return ((inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000) * 100;
}

export class WalletService {
  static currentOrganizationId(): string | undefined {
    return walletBillingContext.getStore()?.organizationId;
  }

  private static async releaseExpiredReservations(organizationId: string): Promise<void> {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const expired = await tx.walletTransaction.findMany({
        where: {
          organizationId,
          type: 'AI_RESERVATION',
          status: 'PENDING',
          expiresAt: { lte: now },
        },
        select: { id: true, amountPaise: true },
      });
      if (!expired.length) return;

      for (const transaction of expired) {
        const reversed = await tx.walletTransaction.updateMany({
          where: { id: transaction.id, status: 'PENDING' },
          data: { status: 'REVERSED', amountPaise: 0 },
        });
        if (reversed.count === 1) {
          await tx.organization.update({
            where: { id: organizationId },
            data: { walletBalancePaise: { increment: -transaction.amountPaise } },
          });
        }
      }
    });
  }

  static async getWallet(organizationId: string) {
    await this.releaseExpiredReservations(organizationId);
    const [organization, transactions] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { walletBalancePaise: true },
      }),
      prisma.walletTransaction.findMany({
        where: { organizationId, status: 'POSTED' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          amountPaise: true,
          type: true,
          status: true,
          description: true,
          providerModel: true,
          inputTokens: true,
          outputTokens: true,
          createdAt: true,
        },
      }),
    ]);

    if (!organization) throw new Error('Wallet organization was not found.');
    return { balancePaise: organization.walletBalancePaise, transactions };
  }

  static async reserveAiUsage(
    organizationId: string,
    model: string,
    estimatedInputTokens: number,
    maxOutputTokens: number
  ): Promise<WalletReservation> {
    await this.releaseExpiredReservations(organizationId);
    const pricing = getPricing(model);
    const amountPaise = Math.ceil(calculatePaise(estimatedInputTokens, maxOutputTokens, pricing));
    const id = randomUUID();

    await prisma.$transaction(async (tx) => {
      const debit = await tx.organization.updateMany({
        where: { id: organizationId, walletBalancePaise: { gte: amountPaise } },
        data: { walletBalancePaise: { decrement: amountPaise } },
      });

      if (debit.count !== 1) {
        throw new WalletBillingError(
          `Not enough wallet balance for this AI request. Add funds to continue. Required reserve: ₹${(amountPaise / 100).toFixed(2)}.`
        );
      }

      await tx.walletTransaction.create({
        data: {
          id,
          organizationId,
          amountPaise: -amountPaise,
          type: 'AI_RESERVATION',
          status: 'PENDING',
          description: `Reserved for AI generation (${model})`,
          referenceId: `ai:${id}`,
          providerModel: model,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
    });

    return { id, organizationId, amountPaise };
  }

  static async settleAiUsage(
    reservation: WalletReservation,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    const pricing = getPricing(model);
    const exactUsagePaise = calculatePaise(inputTokens, outputTokens, pricing);

    await prisma.$transaction(async (tx) => {
      const record = await tx.walletTransaction.findUnique({ where: { id: reservation.id } });
      if (!record || record.status !== 'PENDING') {
        throw new WalletBillingError('AI wallet reservation is no longer active.');
      }

      const organization = await tx.organization.findUnique({
        where: { id: reservation.organizationId },
        select: { walletUsageRemainderPaise: true },
      });
      if (!organization) throw new WalletBillingError('AI wallet organization was not found.');

      const totalUsagePaise = organization.walletUsageRemainderPaise + exactUsagePaise;
      const actualPaise = Math.floor(totalUsagePaise);
      const adjustment = reservation.amountPaise - actualPaise;
      if (adjustment < 0) {
        const additionalDebit = await tx.organization.updateMany({
          where: {
            id: reservation.organizationId,
            walletBalancePaise: { gte: -adjustment },
          },
          data: { walletBalancePaise: { decrement: -adjustment } },
        });
        if (additionalDebit.count !== 1) {
          throw new WalletBillingError('Wallet balance could not cover the completed AI usage.');
        }
      } else if (adjustment > 0) {
        await tx.organization.update({
          where: { id: reservation.organizationId },
          data: { walletBalancePaise: { increment: adjustment } },
        });
      }

      await tx.walletTransaction.update({
        where: { id: reservation.id },
        data: {
          amountPaise: -actualPaise,
          type: 'AI_USAGE',
          status: 'POSTED',
          description: `AI usage (${model})`,
          inputTokens,
          outputTokens,
        },
      });

      await tx.organization.update({
        where: { id: reservation.organizationId },
        data: {
          aiTokensUsed: { increment: inputTokens + outputTokens },
          walletUsageRemainderPaise: totalUsagePaise - actualPaise,
        },
      });
    });
  }

  static async releaseAiUsage(reservation: WalletReservation): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const result = await tx.walletTransaction.updateMany({
        where: { id: reservation.id, status: 'PENDING' },
        data: { status: 'REVERSED', type: 'AI_RESERVATION', amountPaise: 0 },
      });

      if (result.count === 1) {
        await tx.organization.update({
          where: { id: reservation.organizationId },
          data: { walletBalancePaise: { increment: reservation.amountPaise } },
        });
      }
    });
  }
}
