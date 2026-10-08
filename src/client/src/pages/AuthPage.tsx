import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { ApiClient } from '../services/api';
import { BRAND } from '@config/brand';
import {
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Zap,
  Sparkles,
  TrendingUp,
  User,
  Building,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Flame,
  PartyPopper,
  X
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup' | 'admin';
  onSuccess: () => void;
  onBack?: () => void;
}

// FIX 5: safe localStorage read (private mode / blocked storage mein crash nahi hoga)
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signup', onSuccess, onBack }) => {
  // Authentication Step: 'phone' (enter number) -> 'otp' (verify 6-digit code)
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(initialMode === 'admin');

  // Phone Form State
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  // OTP Form State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [smsProvider, setSmsProvider] = useState<string>('');
  const [smsSent, setSmsSent] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Google Account Chooser Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleSigningInEmail, setGoogleSigningInEmail] = useState<string | null>(null);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  // FIX 3: simple init, koi "siddhi" filter hack nahi
  const [googleAccounts, setGoogleAccounts] = useState<Array<{ name: string; email: string; color: string }>>(() => {
    try {
      const saved = localStorage.getItem('addon_google_accounts');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((a: any) => a?.email) : [];
    } catch {
      return [];
    }
  });

  // FIX 1: admin credentials ab hardcoded nahi hain
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // FIX 5: claimed offer safe read
  const claimedOffer = safeGetItem('claimed_offer');

  // Input Refs for 6-Digit OTP auto-advance
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { login } = useAuth();

  // Handle countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle OTP digit changes
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (!clean) {
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (clean.length > 1) {
      // Pasted multi-digit OTP
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = clean;
    setOtpDigits(newDigits);

    // Auto-advance to next box
    if (index < 5 && clean) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // STEP 1: Send 6-Digit OTP to Phone Number
  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setMessage(null);

    const cleanNum = phoneNumber.replace(/\D/g, '');
    if (cleanNum.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${cleanNum}`;
      const res = await ApiClient.sendPhoneOtp({
        phone: fullPhone,
        name: fullName.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        organizationName: workspaceName.trim() || undefined,
      });

      if (!res.smsSent) {
        setSmsSent(false);
        setError('SMS delivery was not confirmed. Please try again later or contact support.');
        return;
      }

      setMaskedPhone(res.phone || `${countryCode} ${cleanNum.slice(0, 2)}••••••${cleanNum.slice(-2)}`);
      setRawPhone(fullPhone);
      setSmsProvider(res.provider || 'sms');
      setSmsSent(true);

      // FIX 4: demo OTP sirf development mein
      if (res.demoOtp && import.meta.env.DEV) {
        setSandboxCode(res.demoOtp);
      }

      setMessage(res.message || `6-digit verification code sent to ${fullPhone}`);
      setStep('otp');
      setCountdown(45);

      // Auto-focus first OTP digit input after render
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP to mobile. Please check number.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify 6-digit OTP and Log In
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await ApiClient.verifyPhoneOtp({
        phone: rawPhone,
        otp: otpCode,
        name: fullName.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        organizationName: workspaceName.trim() || undefined,
      });

      setMessage(res.message || 'Mobile number verified successfully! Welcome to Addon AI.');

      if (res.token && res.user) {
        await login(res.token, res.user);
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        throw new Error('Verification succeeded but failed to issue session token.');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid or expired OTP. Please enter the correct 6 digits.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fast Auto-fill for Developer Sandbox (sirf DEV mein use hota hai)
  const handleFillSandboxCode = () => {
    const code = sandboxCode || '123456';
    const digits = code.slice(0, 6).split('');
    setOtpDigits(digits);
    otpInputRefs.current[5]?.focus();
  };

  // FIX 2: Google sign-in abhi sirf DEV mein (production mein fake login band)
  const handleGoogleSignIn = () => {
    if (!import.meta.env.DEV) {
      setError('Google sign-in is currently unavailable. Please use mobile OTP.');
      return;
    }
    setError(null);
    setShowGoogleModal(true);
    if (googleAccounts.length === 0) {
      setShowCustomGoogleInput(true);
    }
  };

  // Remove an account from this browser device
  const handleRemoveGoogleAccount = (e: React.MouseEvent, emailToRemove: string) => {
    e.stopPropagation();
    const updated = googleAccounts.filter(
      (a) => a.email.toLowerCase() !== emailToRemove.toLowerCase()
    );
    setGoogleAccounts(updated);
    try {
      localStorage.setItem('addon_google_accounts', JSON.stringify(updated));
    } catch {}
    if (updated.length === 0) {
      setShowCustomGoogleInput(true);
    }
  };

  // Select and Authenticate with a Google Account (DEV only, see handleGoogleSignIn)
  const handleSelectGoogleAccount = async (accountEmail: string, accountName: string) => {
    if (!import.meta.env.DEV) return;
    setError(null);
    setGoogleSigningInEmail(accountEmail);
    try {
      const palette = ['bg-[#4285F4]', 'bg-[#EA4335]', 'bg-[#FBBC05]', 'bg-[#34A853]', 'bg-[#673AB7]', 'bg-[#00897B]'];
      const charSum = accountEmail.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const chosenColor = palette[Math.abs(charSum) % palette.length];

      const updated = [
        { name: accountName, email: accountEmail, color: chosenColor },
        ...googleAccounts.filter((a) => a.email.toLowerCase() !== accountEmail.toLowerCase()),
      ];
      setGoogleAccounts(updated);
      try {
        localStorage.setItem('addon_google_accounts', JSON.stringify(updated.slice(0, 5)));
      } catch {}

      const res = await ApiClient.googleLogin({ email: accountEmail, name: accountName });
      await login(res.token, res.user);
      setShowGoogleModal(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setGoogleSigningInEmail(null);
    }
  };

  // Demo Login (abhi UI mein use nahi ho raha)
  const handleDemoSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await ApiClient.demoLogin();
      await login(res.token, res.user);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  // Master Admin Login
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await ApiClient.adminLogin({ email: adminEmail, password: adminPassword });
      await login(res.token, res.user);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-10 bg-slate-950 relative overflow-hidden">
      {/* Top Floating Back to Website Button */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-30">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else window.location.href = '/';
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold transition-all backdrop-blur-md shadow-lg cursor-pointer group hover:border-indigo-500/50"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-400" />
          <span>Back to Website</span>
        </button>
      </div>

      {/* Dynamic Background Mesh & Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-rose-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-purple-900/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Glass Shell Container */}
      <div className="w-full max-w-5xl bg-slate-900/90 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 my-10 sm:my-0">

        {/* Left Value Showcase Column */}
        <div className="hidden lg:flex lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-900 text-white flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Info */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  {BRAND.appName}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    v2.4
                  </span>
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] font-semibold text-slate-300">Passwordless Real Mobile Identity</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Scale Your Marketing <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-300 to-purple-400">on Autopilot.</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect SEO crawlers, multi-channel ad scaling, and viral social distribution into one unified autonomous command center.
              </p>
            </div>

            {/* Feature Highlight Pills */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Instant Phone OTP Sign-In</div>
                  <div className="text-[11px] text-slate-400">No passwords to remember. Instant 6-digit verification code delivered directly to your phone.</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">24/7 Multi-Agent Orchestration</div>
                  <div className="text-[11px] text-slate-400">10 AI specialists work concurrently on SEO, copy, ads, and lead qualification.</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Google Gemini 2.5 Copilot</div>
                  <div className="text-[11px] text-slate-400">Conversational AI marketing advisor ready to assist in natural English & Hinglish.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Live Metric Badge */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">4.1x Blended ROAS</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">1,200+ Growth Tasks Run</span>
          </div>
        </div>

        {/* Right Authentication Form Column */}
        <div className="w-full lg:col-span-7 p-5 sm:p-8 lg:p-12 bg-white text-slate-900 flex flex-col justify-center relative">

          {/* Mobile-Only Brand Header */}
          <div className="lg:hidden flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base leading-tight flex items-center gap-1.5">
                {BRAND.appName}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  v2.4
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Autonomous AI Marketing Engine</div>
            </div>
          </div>

          {/* Top Admin Switcher Pill & Back to Home */}
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onBack) onBack();
                  else window.location.href = '/';
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 py-1 pr-2.5 border-r border-slate-200 cursor-pointer group"
                title="Return to Home Website"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-indigo-600" />
                <span>Home</span>
              </button>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                {isAdminMode ? 'Platform Administration' : 'Secure Phone Authentication'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setError(null);
                setMessage(null);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-indigo-50"
            >
              {isAdminMode ? (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Switch to Mobile OTP</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Master Admin</span>
                </>
              )}
            </button>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Founder Slot #1 Lifetime Offer Banner */}
          {claimedOffer === 'lifetime_499' && !isAdminMode && (
            <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-amber-500/15 to-indigo-500/15 border-2 border-emerald-400 text-xs text-slate-900 flex items-center justify-between shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Flame className="w-4 h-4 fill-white animate-pulse" />
                </span>
                <div>
                  <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
                    🎉 Slot #1 Booking is 100% FREE!
                    <PartyPopper className="w-3.5 h-3.5 text-rose-500" />
                  </span>
                  <span className="text-[11px] text-slate-700 font-medium">
                    ₹0 charged today. Verify phone number to claim your reserved lifetime slot.
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0">
                ⚡ FREE BOOKING
              </span>
            </div>
          )}

          {/* Mode 1: MASTER ADMIN FORM */}
          {isAdminMode ? (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Master Command Center</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Super Admin
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Access live platform controls: users, registered numbers, active campaigns, and billing.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Master Administrator Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="Admin email"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Master Key / Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Master admin password"
                      className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-black hover:to-indigo-900 transition-all shadow-lg flex items-center justify-center gap-2 mt-3"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Master Access...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Authorize Master Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : step === 'phone' ? (
            /* Mode 2: STEP 1 - PHONE NUMBER INPUT */
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Sign in with Mobile Phone</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    No Password Needed
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your full name, work email, and mobile number. A 6-digit OTP will be sent to your phone and login notification to your email.
                </p>
              </div>

              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Full Name</span>
                    <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">Primary Account</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all tracking-wide"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Your name will appear on automated AI reports and notifications.
                  </span>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Work Email / Gmail</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">Login Alerts & Reports</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alex@yourcompany.com"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all tracking-wide"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Real-time security alerts and executive reports will be delivered to this address.
                  </span>
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Mobile Phone Number (For 6-Digit SMS OTP)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shrink-0 cursor-pointer"
                    >
                      <option value="+91">🇮🇳 +91 (India)</option>
                      <option value="+1">🇺🇸 +1 (US/Canada)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+971">🇦🇪 +971 (UAE)</option>
                      <option value="+65">🇸🇬 +65 (Singapore)</option>
                    </select>

                    <div className="relative flex-1">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all tracking-wide"
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1.5 block">
                    Real 6-digit OTP will be sent directly to this number via SMS.
                  </span>
                </div>

                {/* Optional Company / Workspace Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
                  >
                    <span>{showAdditionalDetails ? '− Hide company details' : '+ Add company / workspace name (optional)'}</span>
                  </button>

                  {showAdditionalDetails && (
                    <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Company / Workspace Name</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          placeholder="e.g. Growth AI"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
                  className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending 6-Digit OTP to Phone...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Send 6-Digit OTP to Phone</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="relative my-5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <span className="relative bg-white px-3 text-xs font-bold text-slate-400 tracking-wider">
                    OR
                  </span>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-3 group hover:border-slate-300 cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </form>
            </div>
          ) : (
            /* Mode 3: STEP 2 - ENTER 6-DIGIT OTP CODE */
            <div className="space-y-6 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setError(null);
                  setMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Change Mobile Number
              </button>

              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Enter 6-Digit OTP</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Gateway accepted
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  The SMS gateway accepted the OTP request for{' '}
                  <span className="font-bold text-slate-800 font-mono">{maskedPhone}</span>.
                </p>
                <p className="text-[11px] text-amber-700 mt-1">
                  Phone delivery is not confirmed yet. Check your SMS inbox and spam messages.
                </p>
                {(fullName || email) && (
                  <div className="mt-2 text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-1.5 inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Signing in as: {fullName || 'Founder'} {email ? `• ${email}` : ''}</span>
                  </div>
                )}
              </div>

              {/* DEV only: sandbox OTP auto-fill */}
              {import.meta.env.DEV && sandboxCode && (
                <button
                  type="button"
                  onClick={handleFillSandboxCode}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300"
                >
                  [DEV] Auto-fill sandbox OTP
                </button>
              )}

              {/* 6-Digit Individual Input Boxes */}
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Verification Code
                  </label>
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-3 w-full max-w-sm mx-auto">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        maxLength={index === 0 ? 6 : 1}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-full aspect-square max-h-14 sm:max-h-16 text-center text-lg sm:text-2xl font-black rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all font-mono shadow-xs"
                      />
                    ))}
                  </div>
                </div>

                {/* Resend Code Button & Timer */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">
                    Didn't receive the SMS?
                  </span>
                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={() => handleSendPhoneOtp()}
                    className="font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 flex items-center gap-1 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{countdown > 0 ? `Resend code in ${countdown}s` : 'Resend SMS OTP'}</span>
                  </button>
                </div>

                {/* Submit Verification Button */}
                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6}
                  className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying & Opening Addon AI...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify OTP & Enter Addon AI</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Google Account Chooser Modal (DEV only, since handleGoogleSignIn blocks it in production) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-md my-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between shrink-0">
              <div className="space-y-1">
                <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Choose an account</h3>
                <p className="text-xs text-slate-500">
                  to continue to <strong className="text-blue-600 font-bold">Addon AI</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(false);
                  setShowCustomGoogleInput(false);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account List */}
            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {googleAccounts.map((acc, idx) => {
                const isCurrent = googleSigningInEmail === acc.email;
                return (
                  <div
                    key={idx}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => handleSelectGoogleAccount(acc.email, acc.name)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-9 h-9 rounded-full ${acc.color || 'bg-indigo-600'} text-white flex items-center justify-center text-sm font-semibold shrink-0 shadow-xs`}>
                        {acc.name ? acc.name.charAt(0).toUpperCase() : acc.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {acc.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono truncate">
                          {acc.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveGoogleAccount(e, acc.email)}
                        className="text-slate-300 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-xs font-bold"
                        title="Remove account from device"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Account Input Box */}
              {(showCustomGoogleInput || googleAccounts.length === 0) && (
                <div className="p-6 bg-slate-50/70 space-y-3.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {googleAccounts.length > 0 ? 'Sign in with another Google account:' : 'Sign in with your Google account:'}
                    </span>
                    {googleAccounts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowCustomGoogleInput(false)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        ← Back to accounts list
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Email (Gmail or Google Workspace)</label>
                      <input
                        type="email"
                        required
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="e.g. yourname@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Display Name</label>
                      <input
                        type="text"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {googleAccounts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowCustomGoogleInput(false)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!customGoogleEmail.includes('@') || Boolean(googleSigningInEmail)}
                      onClick={() => {
                        const emailVal = customGoogleEmail.trim().toLowerCase();
                        const nameVal = customGoogleName.trim() || emailVal.split('@')[0];
                        handleSelectGoogleAccount(emailVal, nameVal);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {googleSigningInEmail ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <span>Continue with Google &rarr;</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Use Another Account Button */}
              {!showCustomGoogleInput && googleAccounts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    Use another account
                  </div>
                </button>
              )}
            </div>

            {/* Footer Notice */}
            <div className="p-5 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
              To continue, Google will share your name, email address, and language preference with Addon AI.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};