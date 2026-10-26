import React from 'react';
import { ArrowLeft, Wallet, X, ShieldCheck, LoaderCircle } from 'lucide-react';
import { ApiClient } from '../../services/api';

interface WalletTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

declare global {
  interface Window {
    Cashfree?: (options: { mode: 'sandbox' | 'production' }) => any;
    Razorpay?: new (options: Record<string, any>) => { open: () => void };
  }
}

const loadScript = (src: string): Promise<boolean> =>
  new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const WalletTopUpModal: React.FC<WalletTopUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = React.useState(500);
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [balancePaise, setBalancePaise] = React.useState<number | null>(null);
  const [transactions, setTransactions] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!isOpen) return;
    setError('');
    ApiClient.getWallet()
      .then((wallet) => {
        setBalancePaise(wallet.balancePaise);
        setTransactions(wallet.transactions || []);
      })
      .catch((walletError: any) => setError(walletError.message || 'Could not load your wallet.'));
  }, [isOpen]);

  if (!isOpen) return null;

  const finishTopUp = async (orderId: string, provider: 'cashfree' | 'razorpay') => {
    if (provider === 'cashfree') {
      await ApiClient.verifyCashfreePayment(orderId);
    }
    await onSuccess();
    onClose();
  };

  const handleTopUp = async () => {
    setError('');
    if (!Number.isInteger(amount) || amount < 100 || amount > 50000) {
      setError('Enter a whole-rupee amount between ₹100 and ₹50,000.');
      return;
    }

    setProcessing(true);
    try {
      const order = await ApiClient.createOrder({ planId: 'wallet_topup', walletAmount: amount });

      if (order.provider === 'cashfree' && order.paymentSessionId) {
        const loaded = await loadScript('https://sdk.cashfree.com/js/v3/cashfree.js');
        if (!loaded || !window.Cashfree) throw new Error('Could not load Cashfree checkout.');
        const cashfree = window.Cashfree({ mode: order.env === 'sandbox' ? 'sandbox' : 'production' });
        const result = await cashfree.checkout({
          paymentSessionId: order.paymentSessionId,
          redirectTarget: '_modal',
        });
        if (result?.error) throw new Error('Payment was not completed. Please try again.');
        await finishTopUp(order.orderId, 'cashfree');
        return;
      }

      if (order.provider === 'razorpay' && order.keyId) {
        const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        if (!loaded || !window.Razorpay) throw new Error('Could not load Razorpay checkout.');
        const checkout = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Addon AI Wallet',
          description: `Wallet top-up ₹${amount}`,
          order_id: order.orderId,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await ApiClient.verifyPayment(response);
              await onSuccess();
              onClose();
            } catch (verificationError: any) {
              setError(verificationError.message || 'Could not verify the payment.');
            } finally {
              setProcessing(false);
            }
          },
          modal: { ondismiss: () => setProcessing(false) },
          theme: { color: '#4F46E5' },
        });
        checkout.open();
        return;
      }

      throw new Error('Wallet payment gateway is not available.');
    } catch (topUpError: any) {
      setError(topUpError.message || 'Wallet top-up failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[96vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0b1030] via-indigo-900 to-violet-700 px-6 pb-5 pt-4 text-white">
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="relative mb-3 flex items-center justify-between">
            <button type="button" onClick={onClose} disabled={processing} aria-label="Back" className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/25">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button type="button" onClick={onClose} disabled={processing} aria-label="Close wallet top-up" className="rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <span className="flex w-full items-center justify-center rounded-2xl bg-white px-3 py-3 shadow-lg">
              <img src="/addonaix-horizontal.png" alt="AddonAIX" className="h-24 w-full max-w-xs object-contain" />
            </span>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Add money to your wallet</h2>
                <p className="mt-0.5 text-xs text-indigo-100">AI usage is deducted from your wallet automatically</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Available balance</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {balancePaise === null ? '—' : `₹${(balancePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`rounded-xl border px-3 py-3 text-sm font-bold transition-colors ${
                  amount === preset
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-indigo-200'
                }`}
              >
                ₹{preset.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold text-slate-600">
            Custom amount (₹100–₹50,000)
            <div className="mt-1.5 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
              <span className="text-sm font-bold text-slate-500">₹</span>
              <input
                type="number"
                min={100}
                max={50000}
                step={1}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="w-full border-0 bg-transparent px-2 py-3 text-sm font-semibold text-slate-800 outline-none"
              />
            </div>
          </label>

          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}

          <button
            type="button"
            onClick={handleTopUp}
            disabled={processing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {processing ? 'Verifying payment...' : `Add ₹${amount.toLocaleString('en-IN')}`}
          </button>
          <p className="text-center text-[11px] text-slate-400">Secure payment via Cashfree / Razorpay</p>

          {transactions.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-xs font-bold text-slate-700">Recent wallet activity</h3>
              <div className="max-h-32 space-y-2 overflow-y-auto">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700">{transaction.description}</p>
                      <p className="text-[10px] text-slate-400">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`shrink-0 font-bold ${transaction.amountPaise < 0 ? 'text-slate-700' : 'text-emerald-600'}`}>
                      {transaction.amountPaise < 0 ? '−' : '+'}₹{(Math.abs(transaction.amountPaise) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
