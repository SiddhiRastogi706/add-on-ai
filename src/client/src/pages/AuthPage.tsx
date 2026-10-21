import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { ApiClient } from '../services/api';
import { BRAND } from '@config/brand';
import {
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
} from 'lucide-react';

interface GoogleCredentialResponse {
  credential: string;
}

let initializedGoogleClientId: string | null = null;
let activeGoogleCredentialHandler: ((response: GoogleCredentialResponse) => void) | null = null;

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select: boolean;
        cancel_on_tap_outside: boolean;
      }) => void;
      renderButton: (element: HTMLElement, options: {
        type: 'standard';
        theme: 'outline';
        size: 'large';
        text: 'continue_with';
        shape: 'pill';
        width: number;
      }) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

interface AuthPageProps {
  initialMode?: 'login' | 'signup' | 'admin';
  onSuccess: (user?: { id: string; role: string }) => void;
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
  const [smsProviderReference, setSmsProviderReference] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [googleButtonLoading, setGoogleButtonLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // FIX 1: admin credentials ab hardcoded nahi hain
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // FIX 5: claimed offer safe read
  const claimedOffer = safeGetItem('claimed_offer');

  // Input Refs for 6-Digit OTP auto-advance
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const { login } = useAuth();

  const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
    setError(null);
    setLoading(true);
    try {
      const result = await ApiClient.googleLogin(response.credential);
      await login(result.token, result.user);
      onSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminMode) {
      setGoogleButtonLoading(false);
      return;
    }

    let cancelled = false;
    let initialized = false;
    setGoogleButtonLoading(true);

    const renderGoogleButton = (clientId: string) => {
      const identityApi = window.google?.accounts?.id;
      if (cancelled || initialized || !googleButtonRef.current || !identityApi) return;
      initialized = true;
      activeGoogleCredentialHandler = handleGoogleCredential;
      if (initializedGoogleClientId !== clientId) {
        identityApi.initialize({
          client_id: clientId,
          callback: (response) => void activeGoogleCredentialHandler?.(response),
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        initializedGoogleClientId = clientId;
      }
      identityApi.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: Math.min(400, Math.floor(googleButtonRef.current.clientWidth)),
      });
      setError(null);
      setGoogleButtonLoading(false);
    };

    void ApiClient.getGoogleAuthConfig()
      .then(({ clientId }) => {
        if (cancelled) return;
        if (!clientId) {
          setGoogleButtonLoading(false);
          setError('Google sign-in is not configured. Please use phone OTP or contact support.');
          return;
        }

        const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-identity-services]');
        if (window.google?.accounts?.id) {
          renderGoogleButton(clientId);
          return;
        }
        if (existingScript) {
          const onLoad = () => renderGoogleButton(clientId);
          const onError = () => {
            if (!cancelled) {
              setGoogleButtonLoading(false);
              setError('Could not load Google sign-in. Check your internet connection and retry.');
            }
          };
          if (existingScript.dataset.loaded === 'true') {
            renderGoogleButton(clientId);
          } else {
            existingScript.addEventListener('load', onLoad, { once: true });
            existingScript.addEventListener('error', onError, { once: true });
          }
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentityServices = 'true';
        script.onload = () => {
          script.dataset.loaded = 'true';
          renderGoogleButton(clientId);
        };
        script.onerror = () => {
          if (!cancelled) {
            setGoogleButtonLoading(false);
            setError('Could not load Google sign-in. Check your internet connection and retry.');
          }
        };
        document.head.appendChild(script);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setGoogleButtonLoading(false);
          setError(err.message || 'Could not initialize Google sign-in.');
        }
      });

    return () => {
      cancelled = true;
      if (activeGoogleCredentialHandler === handleGoogleCredential) {
        activeGoogleCredentialHandler = null;
      }
    };
  }, [isAdminMode]);

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

    setSandboxCode(null);
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
      setSmsProviderReference(res.providerReference || null);
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
          onSuccess(res.user);
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
    if (!sandboxCode) return;
    const digits = sandboxCode.slice(0, 6).split('');
    setOtpDigits(digits);
    otpInputRefs.current[5]?.focus();
  };

  // Demo Login (abhi UI mein use nahi ho raha)
  const handleDemoSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await ApiClient.demoLogin();
      await login(res.token, res.user);
      onSuccess(res.user);
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
      onSuccess(res.user);
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
              <div className="w-32 h-14 shrink-0">
                <img
                  src="/addonaix-horizontal.png"
                  alt="AddonAIx Smart AI Digital Solutions"
                  className="w-full h-full object-contain scale-110 brightness-90 contrast-110 drop-shadow-[0_0_0.7px_#0f172a]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-semibold text-slate-300">AI-Powered Growth Platform</span>
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
            <div className="w-26 h-[52px] shrink-0">
              <img
                src="/addonaix-horizontal.png"
                alt="AddonAIx Smart AI Digital Solutions"
                className="w-full h-full object-contain scale-110 brightness-90 contrast-110 drop-shadow-[0_0_0.7px_#0f172a]"
              />
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
                <div className="relative flex min-h-12 w-full items-center justify-center">
                  {googleButtonLoading && (
                    <span className="absolute h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                  )}
                  <div ref={googleButtonRef} className={googleButtonLoading ? 'invisible' : 'flex w-full justify-center'} />
                </div>
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
                    {sandboxCode ? 'Development OTP' : 'Gateway accepted'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {sandboxCode ? (
                    <>Development mode is using a sandbox OTP for <span className="font-bold text-slate-800 font-mono">{maskedPhone}</span>; no SMS was sent.</>
                  ) : (
                    <>The SMS gateway accepted the OTP request for <span className="font-bold text-slate-800 font-mono">{maskedPhone}</span>.</>
                  )}
                </p>
                <p className="text-[11px] text-amber-700 mt-1">
                  {sandboxCode
                    ? 'Use the development sandbox OTP button below to fill in the verification code.'
                    : `Phone delivery is not confirmed yet. Check your SMS inbox and spam messages.${smsProviderReference ? ` Provider reference: ${smsProviderReference}.` : ''}`}
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

    </div>
  );
};