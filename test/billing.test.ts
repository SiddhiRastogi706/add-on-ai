import { strict as assert } from 'node:assert';
import { FEATURES, PRICING, decide, splitDebit } from '../src/config/pricing';
import { BillingStore, ChargeRecord, beginCharge, refundCharge, runBackgroundAI } from '../src/server/services/feature-billing.service';

// In-memory store: prisma store jaisi hi guarded semantics
function memStore(init: { bonus?: number; plan?: number; wallet?: number; cost?: number } = {}) {
  const s = {
    bal: { bonusPaise: init.bonus ?? 0, planCreditPaise: init.plan ?? 0, walletPaise: init.wallet ?? 0 },
    cost: init.cost ?? 0,
    demo: new Map<string, number>(),
    charges: new Map<string, ChargeRecord>(),
    n: 0,
  };
  const store: BillingStore = {
    getBalances: async () => ({ ...s.bal }),
    getCostToday: async () => s.cost,
    getDemoUsed: async (u, g) => s.demo.get(`${u}:${g}`) ?? 0,
    tryUseDemo: async (u, g, limit) => {
      const k = `${u}:${g}`;
      const c = s.demo.get(k) ?? 0;
      if (c >= limit) return false;
      s.demo.set(k, c + 1);
      return true;
    },
    undoDemo: async (u, g) => { s.demo.set(`${u}:${g}`, Math.max(0, (s.demo.get(`${u}:${g}`) ?? 0) - 1)); },
    tryDebit: async (_o, d) => {
      if (s.bal.bonusPaise < d.bonusPaise || s.bal.planCreditPaise < d.planCreditPaise || s.bal.walletPaise < d.walletPaise) return false;
      s.bal.bonusPaise -= d.bonusPaise; s.bal.planCreditPaise -= d.planCreditPaise; s.bal.walletPaise -= d.walletPaise;
      return true;
    },
    credit: async (_o, d) => { s.bal.bonusPaise += d.bonusPaise; s.bal.planCreditPaise += d.planCreditPaise; s.bal.walletPaise += d.walletPaise; },
    reserveCost: async (_o, _d, c, cap) => { if (s.cost + c > cap) return false; s.cost += c; return true; },
    releaseCost: async (_o, _d, c) => { s.cost = Math.max(0, s.cost - c); },
    createCharge: async (r) => { const id = `c${++s.n}`; s.charges.set(id, { ...r, id, status: 'ACTIVE' }); return id; },
    getCharge: async (id) => s.charges.get(id) ?? null,
    markRefunded: async (id) => { const c = s.charges.get(id); if (!c || c.status !== 'ACTIVE') return false; c.status = 'REFUNDED'; return true; },
    bumpDailyUsage: async () => undefined,
  };
  return { s, store };
}

const user = { id: 'u1', organizationId: 'o1', role: 'ADMIN' };
const tests: Array<[string, () => Promise<void>]> = [];
const test = (name: string, fn: () => Promise<void>) => tests.push([name, fn]);

test('splitDebit: bonus -> plan credit -> wallet order', async () => {
  assert.deepEqual(splitDebit(500, { bonusPaise: 200, planCreditPaise: 200, walletPaise: 500 }), { bonusPaise: 200, planCreditPaise: 200, walletPaise: 100 });
  assert.deepEqual(splitDebit(100, { bonusPaise: 300, planCreditPaise: 0, walletPaise: 0 }), { bonusPaise: 100, planCreditPaise: 0, walletPaise: 0 });
  assert.equal(splitDebit(500, { bonusPaise: 100, planCreditPaise: 100, walletPaise: 100 }), null);
});

test('decide: super admin always free, even with no balance and cap hit', async () => {
  const d = decide({ feature: 'poster_photo', isSuperAdmin: true, demoUsed: 99, balances: { bonusPaise: 0, planCreditPaise: 0, walletPaise: 0 }, orgCostTodayPaise: 1e9 });
  assert.equal(d.action, 'allow_free');
});

test('demo: pehle free demos, counter per user, phir 402', async () => {
  const { s, store } = memStore();
  for (let i = 0; i < PRICING.freeDemo.text; i++) {
    const r = await beginCharge(store, user, 'content_generate');
    assert.ok(r.ok && r.mode === 'demo');
  }
  const blocked = await beginCharge(store, user, 'content_generate');
  assert.ok(!blocked.ok);
  if (!blocked.ok) {
    assert.equal(blocked.status, 402);
    assert.equal(blocked.body.code, 'INSUFFICIENT_BALANCE');
    assert.equal(blocked.body.needPaise, FEATURES.content_generate.pricePaise);
    assert.equal(blocked.body.message, 'Top-up karo');
  }
  // dusra user, same org: apna demo milega
  const other = await beginCharge(store, { ...user, id: 'u2' }, 'content_generate');
  assert.ok(other.ok && other.mode === 'demo');
  assert.equal(s.demo.get('u1:text'), PRICING.freeDemo.text);
});

test('images group poster_prompt aur poster_photo ka demo share karte hain', async () => {
  const { store } = memStore();
  const a = await beginCharge(store, user, 'poster_prompt');
  assert.ok(a.ok && a.mode === 'demo');
  const b = await beginCharge(store, user, 'poster_photo');
  assert.ok(!b.ok);
});

test('charge: demo khatam, balance se kata aur bucket order sahi', async () => {
  const { s, store } = memStore({ bonus: 100, plan: 100, wallet: 1000 });
  s.demo.set('u1:text', PRICING.freeDemo.text);
  const r = await beginCharge(store, user, 'social_calendar'); // 500
  assert.ok(r.ok && r.mode === 'paid');
  assert.deepEqual(s.bal, { bonusPaise: 0, planCreditPaise: 0, walletPaise: 700 });
});

test('refund: poora amount usi bucket mein wapas, double refund nahi', async () => {
  const { s, store } = memStore({ bonus: 100, plan: 100, wallet: 1000 });
  s.demo.set('u1:text', PRICING.freeDemo.text);
  const r = await beginCharge(store, user, 'social_calendar');
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(await refundCharge(store, r.chargeId), true);
  assert.equal(await refundCharge(store, r.chargeId), false);
  assert.deepEqual(s.bal, { bonusPaise: 100, planCreditPaise: 100, walletPaise: 1000 });
});

test('refund: demo use hua tha to counter wapas', async () => {
  const { s, store } = memStore();
  const r = await beginCharge(store, user, 'copilot_chat');
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(s.demo.get('u1:chat'), 1);
  await refundCharge(store, r.chargeId);
  assert.equal(s.demo.get('u1:chat'), 0);
});

test('insufficient balance: needPaise shortfall batata hai', async () => {
  const { s, store } = memStore({ wallet: 150 });
  s.demo.set('u1:images', PRICING.freeDemo.images);
  const r = await beginCharge(store, user, 'poster_photo');
  assert.ok(!r.ok);
  if (!r.ok) assert.equal(r.body.needPaise, FEATURES.poster_photo.pricePaise - 150);
  assert.equal(s.bal.walletPaise, 150);
});

test('daily cost cap: block aur demo/charge wapas', async () => {
  const { s, store } = memStore({ wallet: 5000, cost: PRICING.dailyAiCostCapPaise - 1 });
  const r = await beginCharge(store, user, 'content_generate');
  assert.ok(!r.ok);
  if (!r.ok) assert.equal(r.body.code, 'DAILY_CAP');
  assert.equal(s.demo.get('u1:text') ?? 0, 0);
  assert.equal(s.bal.walletPaise, 5000);
});

test('SUPER_ADMIN: koi charge nahi, koi demo nahi', async () => {
  const { s, store } = memStore();
  const r = await beginCharge(store, { ...user, role: 'SUPER_ADMIN' }, 'poster_photo');
  assert.ok(r.ok && r.mode === 'free' && r.chargeId === null);
  assert.equal(s.demo.size, 0);
  assert.equal(s.charges.size, 0);
});

test('background AI: free plan skip, paid charge, fail par refund, SUPER_ADMIN bypass', async () => {
  const { s, store } = memStore({ wallet: 5000 });
  s.demo.set('u1:text', PRICING.freeDemo.text);
  let ran = 0;
  const free = await runBackgroundAI(user, 'brain_onboarding', async () => { ran++; }, store, async () => 'free');
  assert.equal(free, 'skipped');
  assert.equal(ran, 0);
  assert.equal(s.bal.walletPaise, 5000);

  const paid = await runBackgroundAI(user, 'brain_onboarding', async () => { ran++; }, store, async () => 'growth');
  assert.equal(paid, 'done');
  assert.equal(s.bal.walletPaise, 5000 - FEATURES.brain_onboarding.pricePaise);

  const failed = await runBackgroundAI(user, 'brain_onboarding', async () => { throw new Error('boom'); }, store, async () => 'growth');
  assert.equal(failed, 'failed');
  assert.equal(s.bal.walletPaise, 5000 - FEATURES.brain_onboarding.pricePaise);

  const admin = await runBackgroundAI({ ...user, role: 'SUPER_ADMIN' }, 'brain_onboarding', async () => { ran++; }, store, async () => 'free');
  assert.equal(admin, 'done');
  assert.equal(s.bal.walletPaise, 5000 - FEATURES.brain_onboarding.pricePaise);
});

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log(`  PASS: ${name}`); }
    catch (e: any) { failed++; console.error(`  FAIL: ${name}\n    ${e?.message}`); }
  }
  console.log(`\n${tests.length - failed}/${tests.length} passed`);
  process.exit(failed ? 1 : 0);
})();
