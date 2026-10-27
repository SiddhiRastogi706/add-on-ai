import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import {
  Balances,
  FEATURES,
  FeatureId,
  PRICING,
  decide,
  planConfig,
  splitDebit,
} from '../../config/pricing';

// ---------- Store: DB access ek jagah, taaki logic bina DB ke test ho sake ----------

export interface ChargeRecord {
  id: string;
  orgId: string;
  userId: string;
  feature: string;
  kind: 'DEMO' | 'PAID';
  demoGroup?: string | null;
  bonusPaise: number;
  planPaise: number;
  walletPaise: number;
  costPaise: number;
  costDate: string;
  status: 'ACTIVE' | 'REFUNDED';
}

export interface BillingStore {
  getBalances(orgId: string): Promise<Balances>;
  getCostToday(orgId: string, date: string): Promise<number>;
  getDemoUsed(userId: string, group: string): Promise<number>;
  tryUseDemo(userId: string, group: string, limit: number): Promise<boolean>;
  undoDemo(userId: string, group: string): Promise<void>;
  // Guarded debit: kisi bhi bucket mein kam paisa ho to false
  tryDebit(orgId: string, split: Balances): Promise<boolean>;
  credit(orgId: string, split: Balances): Promise<void>;
  reserveCost(orgId: string, date: string, costPaise: number, capPaise: number): Promise<boolean>;
  releaseCost(orgId: string, date: string, costPaise: number): Promise<void>;
  createCharge(record: Omit<ChargeRecord, 'id' | 'status'>): Promise<string>;
  getCharge(id: string): Promise<ChargeRecord | null>;
  // ACTIVE -> REFUNDED sirf ek baar hota hai
  markRefunded(id: string): Promise<boolean>;
  bumpDailyUsage(userId: string, feature: string, date: string): Promise<void>;
}

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export interface BillingUser {
  id: string;
  organizationId: string;
  role: string;
}

export type BeginResult =
  | { ok: true; chargeId: string | null; mode: 'free' | 'demo' | 'paid' }
  | { ok: false; status: 402; body: { error: string; code: string; needPaise: number; message: string } };

const MAX_ATTEMPTS = 4;

export async function beginCharge(store: BillingStore, user: BillingUser, feature: FeatureId): Promise<BeginResult> {
  const cfg = FEATURES[feature];
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  if (isSuperAdmin) return { ok: true, chargeId: null, mode: 'free' };

  const date = todayKey();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const [balances, costToday, demoUsed] = await Promise.all([
      store.getBalances(user.organizationId),
      store.getCostToday(user.organizationId, date),
      store.getDemoUsed(user.id, cfg.group),
    ]);

    const decision = decide({ feature, isSuperAdmin, demoUsed, balances, orgCostTodayPaise: costToday });

    if (decision.action === 'allow_free') return { ok: true, chargeId: null, mode: 'free' };

    if (decision.action === 'block') {
      return {
        ok: false,
        status: 402,
        body: { error: decision.message, code: decision.code, needPaise: decision.needPaise, message: decision.message },
      };
    }

    if (decision.action === 'use_demo') {
      // Atomic: AI call se pehle counter +1
      if (!(await store.tryUseDemo(user.id, cfg.group, PRICING.freeDemo[cfg.group]))) continue;
      if (!(await store.reserveCost(user.organizationId, date, cfg.estCostPaise, PRICING.dailyAiCostCapPaise))) {
        await store.undoDemo(user.id, cfg.group);
        return capBlock();
      }
      const id = await store.createCharge({
        orgId: user.organizationId, userId: user.id, feature, kind: 'DEMO', demoGroup: cfg.group,
        bonusPaise: 0, planPaise: 0, walletPaise: 0, costPaise: cfg.estCostPaise, costDate: date,
      });
      await store.bumpDailyUsage(user.id, feature, date);
      return { ok: true, chargeId: id, mode: 'demo' };
    }

    const split = splitDebit(decision.pricePaise, balances);
    if (!split) continue;
    if (!(await store.tryDebit(user.organizationId, split))) continue; // balance beech mein badla, dobara try
    if (!(await store.reserveCost(user.organizationId, date, cfg.estCostPaise, PRICING.dailyAiCostCapPaise))) {
      await store.credit(user.organizationId, split);
      return capBlock();
    }
    const id = await store.createCharge({
      orgId: user.organizationId, userId: user.id, feature, kind: 'PAID', demoGroup: null,
      bonusPaise: split.bonusPaise, planPaise: split.planCreditPaise, walletPaise: split.walletPaise,
      costPaise: cfg.estCostPaise, costDate: date,
    });
    await store.bumpDailyUsage(user.id, feature, date);
    return { ok: true, chargeId: id, mode: 'paid' };
  }

  return {
    ok: false,
    status: 402,
    body: { error: 'Busy, please retry', code: 'CONTENTION', needPaise: 0, message: 'Thodi der baad dobara try karo.' },
  };
}

function capBlock(): BeginResult {
  const message = 'Aaj ki AI limit poori ho gayi hai. Kal dobara try karo.';
  return { ok: false, status: 402, body: { error: message, code: 'DAILY_CAP', needPaise: 0, message } };
}

// AI call fail ho to poora amount (ya demo) wapas
export async function refundCharge(store: BillingStore, chargeId: string | null | undefined): Promise<boolean> {
  if (!chargeId) return false;
  const charge = await store.getCharge(chargeId);
  if (!charge) return false;
  if (!(await store.markRefunded(chargeId))) return false; // pehle refund ho chuka

  if (charge.kind === 'DEMO') {
    if (charge.demoGroup) await store.undoDemo(charge.userId, charge.demoGroup);
  } else {
    await store.credit(charge.orgId, {
      bonusPaise: charge.bonusPaise,
      planCreditPaise: charge.planPaise,
      walletPaise: charge.walletPaise,
    });
  }
  await store.releaseCost(charge.orgId, charge.costDate, charge.costPaise);
  return true;
}

// ---------- Prisma store ----------

export const prismaBillingStore: BillingStore = {
  async getBalances(orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        bonusPaise: true, bonusExpiresAt: true,
        planCreditPaise: true, planCreditExpiresAt: true,
        walletBalancePaise: true,
      },
    });
    if (!org) return { bonusPaise: 0, planCreditPaise: 0, walletPaise: 0 };
    const now = Date.now();
    const live = (amount: number, exp: Date | null) => (!exp || exp.getTime() > now ? amount : 0);
    return {
      bonusPaise: live(org.bonusPaise, org.bonusExpiresAt),
      planCreditPaise: live(org.planCreditPaise, org.planCreditExpiresAt),
      walletPaise: org.walletBalancePaise,
    };
  },

  async getCostToday(orgId, date) {
    const row = await prisma.orgAiCostDaily.findUnique({ where: { orgId_date: { orgId, date } } });
    return row?.costPaise ?? 0;
  },

  async getDemoUsed(userId, group) {
    const row = await prisma.demoUsage.findUnique({ where: { userId_group: { userId, group } } });
    return row?.count ?? 0;
  },

  async tryUseDemo(userId, group, limit) {
    const bump = await prisma.demoUsage.updateMany({
      where: { userId, group, count: { lt: limit } },
      data: { count: { increment: 1 } },
    });
    if (bump.count === 1) return true;
    try {
      if (limit < 1) return false;
      await prisma.demoUsage.create({ data: { userId, group, count: 1 } });
      return true;
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err;
      return false; // row pehle se hai aur limit poori
    }
  },

  async undoDemo(userId, group) {
    await prisma.demoUsage.updateMany({ where: { userId, group, count: { gt: 0 } }, data: { count: { decrement: 1 } } });
  },

  async tryDebit(orgId, s) {
    const res = await prisma.organization.updateMany({
      where: {
        id: orgId,
        bonusPaise: { gte: s.bonusPaise },
        planCreditPaise: { gte: s.planCreditPaise },
        walletBalancePaise: { gte: s.walletPaise },
      },
      data: {
        bonusPaise: { decrement: s.bonusPaise },
        planCreditPaise: { decrement: s.planCreditPaise },
        walletBalancePaise: { decrement: s.walletPaise },
      },
    });
    return res.count === 1;
  },

  async credit(orgId, s) {
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        bonusPaise: { increment: s.bonusPaise },
        planCreditPaise: { increment: s.planCreditPaise },
        walletBalancePaise: { increment: s.walletPaise },
      },
    });
  },

  async reserveCost(orgId, date, costPaise, capPaise) {
    await prisma.orgAiCostDaily.upsert({
      where: { orgId_date: { orgId, date } },
      create: { orgId, date, costPaise: 0 },
      update: {},
    });
    const res = await prisma.orgAiCostDaily.updateMany({
      where: { orgId, date, costPaise: { lte: capPaise - costPaise } },
      data: { costPaise: { increment: costPaise } },
    });
    return res.count === 1;
  },

  async releaseCost(orgId, date, costPaise) {
    await prisma.orgAiCostDaily.updateMany({
      where: { orgId, date, costPaise: { gte: costPaise } },
      data: { costPaise: { decrement: costPaise } },
    });
  },

  async createCharge(r) {
    const row = await prisma.featureCharge.create({
      data: {
        orgId: r.orgId, userId: r.userId, feature: r.feature, kind: r.kind, demoGroup: r.demoGroup ?? null,
        bonusPaise: r.bonusPaise, planPaise: r.planPaise, walletPaise: r.walletPaise,
        costPaise: r.costPaise, costDate: r.costDate,
      },
    });
    return row.id;
  },

  async getCharge(id) {
    const row = await prisma.featureCharge.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id, orgId: row.orgId, userId: row.userId, feature: row.feature,
      kind: row.kind as 'DEMO' | 'PAID', demoGroup: row.demoGroup,
      bonusPaise: row.bonusPaise, planPaise: row.planPaise, walletPaise: row.walletPaise,
      costPaise: row.costPaise, costDate: row.costDate || todayKey(row.createdAt),
      status: row.status as 'ACTIVE' | 'REFUNDED',
    };
  },

  async markRefunded(id) {
    const res = await prisma.featureCharge.updateMany({ where: { id, status: 'ACTIVE' }, data: { status: 'REFUNDED' } });
    return res.count === 1;
  },

  async bumpDailyUsage(userId, feature, date) {
    await prisma.dailyUsage.upsert({
      where: { userId_feature_date: { userId, feature, date } },
      create: { userId, feature, date, count: 1 },
      update: { count: { increment: 1 } },
    });
  },
};

// ---------- Express middleware ----------

interface BillingRequest extends Request {
  user?: BillingUser & { email?: string };
  billing?: { chargeId: string | null; mode: 'free' | 'demo' | 'paid' };
}

// authMiddleware ke BAAD lagao. 402 = top-up chahiye. Response error (>=400) aaye to auto refund.
export function chargeForFeature(feature: FeatureId, store: BillingStore = prismaBillingStore) {
  return async (req: BillingRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized', message: 'Login required.' });
    try {
      const result = await beginCharge(store, req.user, feature);
      if (result.ok === false) return res.status(result.status).json(result.body);

      req.billing = { chargeId: result.chargeId, mode: result.mode };
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          refundCharge(store, result.chargeId).catch((e) => console.error('[billing] refund failed:', e?.message));
        }
      });
      next();
    } catch (err: any) {
      console.error('[billing] charge failed:', err?.message);
      res.status(500).json({ error: 'Billing check failed', message: 'Billing check failed. Please try again.' });
    }
  };
}

// ---------- Plan credit / bonus grants ----------

const addMonths = (d: Date, m: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
};

// Plan activate/renew: pichhla unused credit expire (overwrite), carry-forward nahi
export async function grantPlanCredit(orgId: string, plan: string, now = new Date()) {
  const amount = planConfig(plan).monthlyCreditPaise;
  await prisma.organization.update({
    where: { id: orgId },
    data: { planCreditPaise: amount, planCreditExpiresAt: addMonths(now, 1) },
  });
}

// Founder slot: ek baar ka non-withdrawable bonus
export async function grantFounderBonus(orgId: string, now = new Date()) {
  const amount = planConfig('founder_slot').oneTimeBonusPaise;
  if (amount <= 0) return;
  await prisma.organization.update({
    where: { id: orgId },
    data: { bonusPaise: { increment: amount }, bonusExpiresAt: addMonths(now, PRICING.bonusExpiryMonths) },
  });
}

// ---------- Background AI (onboarding brain etc.) ----------

// Free plan par aiAutomation off hai; paid par bhi credit/cap se count hota hai
export async function runBackgroundAI(
  user: BillingUser,
  feature: FeatureId,
  fn: () => Promise<void>,
  store: BillingStore = prismaBillingStore,
  planLookup: (orgId: string) => Promise<string> = async (orgId) =>
    (await prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } }))?.plan || 'free'
): Promise<'skipped' | 'blocked' | 'done' | 'failed'> {
  if (user.role !== 'SUPER_ADMIN' && !planConfig(await planLookup(user.organizationId)).aiAutomation) return 'skipped';
  const result = await beginCharge(store, user, feature);
  if (result.ok === false) return 'blocked';
  try {
    await fn();
    return 'done';
  } catch (err: any) {
    console.error(`[billing] background ${feature} failed:`, err?.message);
    await refundCharge(store, result.chargeId);
    return 'failed';
  }
}

export async function getWalletSummary(orgId: string) {
  const b = await prismaBillingStore.getBalances(orgId);
  return { ...b, totalPaise: b.bonusPaise + b.planCreditPaise + b.walletPaise };
}
