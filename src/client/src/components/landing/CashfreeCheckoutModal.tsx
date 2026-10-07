import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Sparkles,
  CreditCard,
  QrCode,
  Building2,
  AlertCircle
} from 'lucide-react';
import { ApiClient } from '../../services/api';
import { SAAS_PLANS, SaaSPlan } from '@config/plans';

interface CashfreeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: string;
  onSuccess?: (authData?: any) => void;
}

export const CashfreeCheckoutModal: React.FC<CashfreeCheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlanId,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);

  // Pre-populate if stored locally
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.name) setName(u.name);
        if (u.email) setEmail(u.email);
        if (u.phoneNumber) setPhone(u.phoneNumber);
      }
    } catch (e) {}
  }, [isOpen]);

  if (!isOpen) return null;

  const isSlot = selectedPlanId === 'founder_slot' || selectedPlanId === 'slot_499';
  const plan: SaaSPlan = isSlot
    ? SAAS_PLANS.founder_slot
    : SAAS_PLANS[selectedPlanId] || SAAS_PLANS.growth;

  const priceAmount = isSlot ? 499 : plan.priceMonthly;

  // Load Cashfree JS SDK v3
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

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (!cleanName) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address for your invoice');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number for UPI');
      return;
    }

    try {
      setIsProcessing(true);

      // 1. Create order on backend (Cashfree Production)
      const order = await ApiClient.createOrder({
        planId: isSlot ? 'founder_slot' : plan.id,
        billingCycle: isSlot ? 'lifetime' : ('monthly' as any),
        customerName: cleanName,
        customerEmail: cleanEmail,
        customerPhone: cleanPhone,
      });

      if (!order || !order.paymentSessionId) {
        throw new Error('Could not initiate payment session with Cashfree.');
      }

      // 2. Load SDK
      const sdkReady = await loadCashfreeScript();
      if (!sdkReady) {
        throw new Error('Cashfree payment SDK failed to load. Please check your internet.');
      }

      const cashfree = (window as any).Cashfree({
        mode: order.env === 'sandbox' ? 'sandbox' : 'production',
      });

      // 3. Trigger Modal Checkout
      cashfree
        .checkout({
          paymentSessionId: order.paymentSessionId,
          redirectTarget: '_modal',
        })
        .then(async (result: any) => {
          if (result.error) {
            console.warn('[Cashfree] Checkout closed or error:', result.error);
            setIsProcessing(false);
            return;
          }

          // 4. Verify payment with backend
          try {
            setIsProcessing(true);
            const verifyRes = await ApiClient.verifyCashfreePayment(order.orderId);

            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
            });

            if (verifyRes.token) {
              localStorage.setItem('auth_token', verifyRes.token);
              if (verifyRes.user) {
                localStorage.setItem('auth_user', JSON.stringify(verifyRes.user));
              }
            }

            setIsSuccess(true);
            setSuccessDetails({
              orderId: order.orderId,
              cfOrderId: verifyRes.cfOrderId,
              planName: plan.name,
              amount: priceAmount,
              email: cleanEmail,
            });

            setTimeout(() => {
              if (onSuccess) {
                onSuccess(verifyRes);
              }
            }, 2500);
          } catch (verifyErr: any) {
            console.error('[Cashfree Verify Error]:', verifyErr);
            setErrorMessage('Payment received! Finalizing account activation...');
            setTimeout(() => {
              if (onSuccess) onSuccess();
            }, 3000);
          } finally {
            setIsProcessing(false);
          }
        });
    } catch (err: any) {
      console.error('[Checkout Error]:', err);
      setErrorMessage(err.message || 'Payment initiation failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ⚡ Live Cashfree Gateway (INR)
            </span>
            {plan.badge && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40">
                {plan.badge}
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight">{plan.name}</h3>
          <p className="text-xs text-slate-300 mt-1">{plan.tagline}</p>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-baseline justify-between">
            <div className="text-xs text-slate-400">Total Payable Amount:</div>
            <div className="text-3xl font-black text-emerald-400 flex items-baseline gap-1">
              <span>₹{priceAmount.toLocaleString('en-IN')}</span>
              <span className="text-xs text-slate-300 font-medium">
                {isSlot ? '(One-time Lifetime)' : '/ month'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-black text-slate-900">Payment Successful!</h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Your <strong className="text-slate-900">{successDetails?.planName}</strong> has been
                activated immediately.
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-bold text-slate-800">{successDetails?.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">
                    ₹{successDetails?.amount?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax Invoice Sent To:</span>
                  <span className="font-bold text-slate-800">{successDetails?.email}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 pt-2">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                <span>Redirecting to your workspace...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Input Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Harshita Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (For PDF Tax Invoice & Login) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. harshita@truckmitra.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    GST-compliant invoice receipt will be delivered instantly to this email.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (For UPI / SMS) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="px-3 py-2.5 bg-slate-100 text-slate-600 font-bold text-sm border-r border-slate-300">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Supported Payment Badges */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                  <span>Supported Indian Payment Modes:</span>
                  <span className="text-emerald-600 font-black">Zero Extra Fee</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-700">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>UPI / QR</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>RuPay / Cards</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Net Banking</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center">
                  GPay • PhonePe • Paytm • BHIM • SBI • HDFC • ICICI • Axis • RuPay
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Opening Cashfree UPI Gateway...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-200" />
                    <span>
                      Pay ₹{priceAmount.toLocaleString('en-IN')} via UPI / Cashfree
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-slate-500">
                  <Lock className="w-3 h-3 text-emerald-600" /> 256-Bit SSL Encrypted
                </span>
                <span>•</span>
                <span className="text-slate-500">RBI Licensed PG (Cashfree)</span>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
