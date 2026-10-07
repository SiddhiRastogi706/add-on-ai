import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { Settings, ShieldCheck, DollarSign, Zap, Check, Sparkles, Building, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SettingsView: React.FC = () => {
  const { business, refreshBusiness } = useAuth();
  const [plans, setPlans] = useState<any>({});
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Budget settings
  const [monthlyBudget, setMonthlyBudget] = useState(business?.monthlyBudget || 50000);
  const [dailyBudgetLimit, setDailyBudgetLimit] = useState(business?.dailyBudgetLimit || 2000);
  const [savedMsg, setSavedMsg] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        ApiClient.getPlans(),
        ApiClient.getCurrentSubscription(),
      ]);
      setPlans(pRes || {});
      setSubData(sRes);
    } catch (e) {
      console.error('Failed loading settings data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.updateBudgetLimits({
        monthlyBudget,
        dailyBudgetLimit,
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
      await refreshBusiness();
    } catch (e) {
      console.error(e);
    }
  };

  const loadCashfreeScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Cashfree) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planId: string) => {
    setPaymentError(null);

    // Free plan downgrade
    if (planId === 'free') {
      try {
        setPaymentProcessing(true);
        await ApiClient.upgradePlan('free');
        confetti({ particleCount: 80, spread: 60 });
        await loadData();
      } catch (err: any) {
        setPaymentError(err.message || 'Failed to switch to free plan');
      } finally {
        setPaymentProcessing(false);
      }
      return;
    }

    // Paid plan: Cashfree (or Razorpay) Checkout flow
    try {
      setPaymentProcessing(true);

      const config = await ApiClient.getPaymentConfig();
      if (!config.configured) {
        setPaymentError('Payment gateway is not configured on this server. Please check credentials in .env.');
        setPaymentProcessing(false);
        return;
      }

      const order = await ApiClient.createOrder({
        planId,
        billingCycle: 'monthly',
      });

      // 1. CASHFREE PRODUCTION CHECKOUT (UPI, CARDS, NETBANKING)
      if (order.provider === 'cashfree' && order.paymentSessionId) {
        const cfLoaded = await loadCashfreeScript();
        if (!cfLoaded) {
          setPaymentError('Failed to load Cashfree payment SDK. Please check your internet connection.');
          setPaymentProcessing(false);
          return;
        }

        const cashfree = (window as any).Cashfree({ mode: order.env === 'sandbox' ? 'sandbox' : 'production' });

        cashfree.checkout({
          paymentSessionId: order.paymentSessionId,
          redirectTarget: '_modal',
        }).then(async (result: any) => {
          if (result.error) {
            console.warn('[Cashfree] Checkout dismissed or error:', result.error);
            setPaymentProcessing(false);
            return;
          }

          try {
            setPaymentProcessing(true);
            await ApiClient.verifyCashfreePayment(order.orderId);
            confetti({ particleCount: 120, spread: 70 });
            await loadData();
          } catch (verifyErr: any) {
            console.warn('[Cashfree] Immediate verification poll:', verifyErr.message);
            await loadData();
          } finally {
            setPaymentProcessing(false);
          }
        });
        return;
      }

      // 2. RAZORPAY FALLBACK CHECKOUT
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPaymentError('Failed to load payment SDK. Please check your network connection.');
        setPaymentProcessing(false);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'MarketMind AI',
        description: `Subscription: ${order.plan.name} Plan`,
        order_id: order.orderId,
        theme: {
          color: '#4f46e5',
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setPaymentProcessing(true);
            await ApiClient.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            confetti({ particleCount: 120, spread: 70 });
            await loadData();
          } catch (verifyErr: any) {
            setPaymentError(verifyErr.message || 'Payment verification failed');
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        setPaymentError(resp.error?.description || 'Payment was unsuccessful');
        setPaymentProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to initiate payment');
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Organization Settings & SaaS Subscription</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your AI token quotas, advertising spend limits, brand guidelines, and subscription plan.
        </p>
      </div>

      {/* AI Token Meter & Current Plan */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft bg-gradient-to-r from-white via-indigo-50/20 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Subscription</span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-extrabold text-slate-900">{subData?.plan?.name || 'Growth Automation'}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-brand-700 border border-brand-200">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{subData?.plan?.tagline}</p>
          </div>

          <div className="w-full md:w-80 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>AI Token Consumption</span>
              <span>{(subData?.tokensUsed || 42100).toLocaleString()} / {(subData?.tokensLimit || 600000).toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-500 via-indigo-600 to-blush-500 h-full rounded-full"
                style={{ width: `${subData?.percentUsed || 7}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 text-right">{subData?.percentUsed || 7}% monthly quota used</div>
          </div>
        </div>
      </div>

      {/* Spend Limits & Budget Form */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-4">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          Advertising Budget & Autonomous Safety Limits
        </h3>
        <p className="text-xs text-slate-500">
          The AI will continuously balance bids across channels but will strictly pause when reaching configured caps.
        </p>

        <form onSubmit={handleSaveBudget} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Budget Hard Cap ($)</label>
            <input
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Daily Spend ($)</label>
            <input
              type="number"
              value={dailyBudgetLimit}
              onChange={(e) => setDailyBudgetLimit(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-400"
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between pt-2">
            {savedMsg && <span className="text-xs font-bold text-emerald-600">✓ Safety limits updated successfully!</span>}
            <button
              type="submit"
              className="ml-auto px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-soft transition-all"
            >
              Save Limits
            </button>
          </div>
        </form>
      </div>

      {/* Subscription Plans Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Available SaaS Subscription Tiers</h3>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ⚡ Instant UPI, Cards & NetBanking via Cashfree
          </span>
        </div>

        {paymentError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="font-medium">{paymentError}</span>
            </div>
            <button
              onClick={() => setPaymentError(null)}
              className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded-lg"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.values(plans).map((plan: any) => {
            const isCurrent = subData?.plan?.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`glass-card rounded-3xl p-6 flex flex-col justify-between border ${
                  isCurrent ? 'border-brand-500 ring-2 ring-brand-200/60 shadow-lg bg-white' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-base">{plan.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-4 min-h-[30px]">{plan.tagline}</div>

                  <div className="mb-4">
                    <span className="text-2xl font-extrabold text-slate-900">
                      ₹{plan.priceMonthly.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {plan.id === 'founder_slot' ? ' (Lifetime)' : '/mo'}
                    </span>
                  </div>

                  <ul className="space-y-2 text-[11px] text-slate-600 mb-6">
                    {plan.features.map((f: string, fi: number) => (
                      <li key={fi} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={isCurrent || paymentProcessing}
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : paymentProcessing
                      ? 'bg-slate-300 text-slate-500 cursor-wait'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft cursor-pointer'
                  }`}
                >
                  {isCurrent
                    ? 'Active Plan'
                    : paymentProcessing
                    ? 'Processing...'
                    : plan.id === 'free'
                    ? 'Downgrade to Free'
                    : `⚡ Pay ₹${plan.priceMonthly.toLocaleString('en-IN')} via UPI`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
