// Single source of truth: AI feature prices, free demo limits, plan credits aur cost cap.
// Saare amounts paise mein hain (100 paise = Rs 1). Yahi file edit karke prices badlo.

export type DemoGroup = 'text' | 'images' | 'chat';

export interface FeatureConfig {
  label: string;
  group: DemoGroup;
  pricePaise: number; // user se kitna kata jayega
  estCostPaise: number; // hamara andaza ka asli AI kharcha (daily cap ke liye)
}

export const FEATURES = {
  content_generate: { label: 'Content draft', group: 'text', pricePaise: 200, estCostPaise: 50 },
  seo_audit: { label: 'SEO audit (AI)', group: 'text', pricePaise: 300, estCostPaise: 80 },
  social_calendar: { label: '7-day social calendar', group: 'text', pricePaise: 500, estCostPaise: 120 },
  ads_campaign: { label: 'Ads campaign draft', group: 'text', pricePaise: 300, estCostPaise: 80 },
  recommendations: { label: 'AI recommendations', group: 'text', pricePaise: 100, estCostPaise: 30 },
  comment_triage: { label: 'Comment triage', group: 'text', pricePaise: 100, estCostPaise: 30 },
  brain_onboarding: { label: 'Marketing brain analysis', group: 'text', pricePaise: 1500, estCostPaise: 400 },
  copilot_chat: { label: 'Copilot message', group: 'chat', pricePaise: 100, estCostPaise: 25 },
  poster_prompt: { label: 'Poster (one-prompt)', group: 'images', pricePaise: 500, estCostPaise: 60 },
  poster_photo: { label: 'Poster from photo', group: 'images', pricePaise: 1000, estCostPaise: 400 },
} as const satisfies Record<string, FeatureConfig>;

export type FeatureId = keyof typeof FEATURES;

export const PRICING = {
  // Free users ko har group mein lifetime itne demo milenge
  freeDemo: { text: 2, images: 1, chat: 5 } as Record<DemoGroup, number>,
  // Ek organization ka din ka max estimated AI kharcha
  dailyAiCostCapPaise: 50000,
  topUpOptionsPaise: [10000, 50000],
  plans: {
    free: { monthlyCreditPaise: 0, oneTimeBonusPaise: 0, aiAutomation: false },
    starter: { monthlyCreditPaise: 40000, oneTimeBonusPaise: 0, aiAutomation: true },
    growth: { monthlyCreditPaise: 150000, oneTimeBonusPaise: 0, aiAutomation: true },
    pro: { monthlyCreditPaise: 400000, oneTimeBonusPaise: 0, aiAutomation: true },
    founder_slot: { monthlyCreditPaise: 0, oneTimeBonusPaise: 30000, aiAutomation: true },
  } as Record<string, { monthlyCreditPaise: number; oneTimeBonusPaise: number; aiAutomation: boolean }>,
  bonusExpiryMonths: 12,
};

export type PlanKey = keyof typeof PRICING.plans;

export function planConfig(plan: string | null | undefined) {
  return PRICING.plans[plan || 'free'] || PRICING.plans.free;
}

export interface Balances {
  bonusPaise: number;
  planCreditPaise: number;
  walletPaise: number;
}

export const totalBalance = (b: Balances) => b.bonusPaise + b.planCreditPaise + b.walletPaise;

export interface DecideInput {
  feature: FeatureId;
  isSuperAdmin: boolean;
  demoUsed: number; // is user ka is feature ke group mein used demo
  balances: Balances;
  orgCostTodayPaise: number;
}

export type Decision =
  | { action: 'allow_free' }
  | { action: 'use_demo' }
  | { action: 'charge'; pricePaise: number }
  | { action: 'block'; code: 'DAILY_CAP' | 'INSUFFICIENT_BALANCE'; needPaise: number; message: string };

export function decide(input: DecideInput): Decision {
  const f: FeatureConfig = FEATURES[input.feature];
  if (input.isSuperAdmin) return { action: 'allow_free' };

  if (input.orgCostTodayPaise + f.estCostPaise > PRICING.dailyAiCostCapPaise) {
    return {
      action: 'block',
      code: 'DAILY_CAP',
      needPaise: 0,
      message: 'Aaj ki AI limit poori ho gayi hai. Kal dobara try karo.',
    };
  }

  if (input.demoUsed < PRICING.freeDemo[f.group]) return { action: 'use_demo' };

  const shortfall = f.pricePaise - totalBalance(input.balances);
  if (shortfall > 0) {
    return {
      action: 'block',
      code: 'INSUFFICIENT_BALANCE',
      needPaise: shortfall,
      message: 'Top-up karo',
    };
  }
  return { action: 'charge', pricePaise: f.pricePaise };
}

// Pehle bonus, phir plan credit, aakhir mein wallet se kaato. Paisa kam ho to null.
export function splitDebit(pricePaise: number, b: Balances): Balances | null {
  if (pricePaise < 0 || totalBalance(b) < pricePaise) return null;
  let left = pricePaise;
  const take = (available: number) => {
    const used = Math.min(available, left);
    left -= used;
    return used;
  };
  return {
    bonusPaise: take(b.bonusPaise),
    planCreditPaise: take(b.planCreditPaise),
    walletPaise: take(b.walletPaise),
  };
}
