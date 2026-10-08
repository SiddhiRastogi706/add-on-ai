import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiClient } from '../services/api';
import { useAuth } from '../store/AuthContext';
import {
  BrainCircuit,
  Globe,
  Building,
  Tag,
  Target,
  MapPin,
  Compass,
  DollarSign,
  Palette,
  Layers,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { refreshBusiness } = useAuth();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    industry: 'Professional Services',
    description: 'We help customers discover our services, trust our expertise, and convert more leads through digital marketing.',
    productsAndServices: ['Core Services', 'Premium Offer', 'Customer Support'],
    targetAudience: 'Customers, buyers, and decision-makers in our market',
    targetLocations: ['Local Market', 'Regional Market', 'Online'],
    marketingGoals: ['Leads', 'Website Traffic', 'Brand Awareness'],
    monthlyBudget: 50000,
    dailyBudgetLimit: 5000,
    brandColors: { primary: '#2563EB', secondary: '#10B981', accent: '#F59E0B' },
    brandTone: 'Professional, Trustworthy & Efficient',
    language: 'English',
    connectedAccounts: ['google_search_console', 'google_analytics', 'google_ads', 'meta_ads', 'linkedin'],
  });

  const totalSteps = 11;

  const handleNext = () => {
    setSubmitError(null);
    if (step === 1 && !formData.name.trim()) {
      setSubmitError('Please enter your business name.');
      return;
    }
    if (step === 2 && !formData.websiteUrl.trim()) {
      setSubmitError('Please enter your company website URL.');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      triggerAnalysis();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const triggerAnalysis = async () => {
    const businessName = formData.name.trim();
    const enteredWebsiteUrl = formData.websiteUrl.trim();
    if (!businessName || !enteredWebsiteUrl) {
      setSubmitError('Business name and website URL are required.');
      return;
    }

    const normalizedWebsiteUrl = /^https?:\/\//i.test(enteredWebsiteUrl)
      ? enteredWebsiteUrl
      : `https://${enteredWebsiteUrl}`;
    try {
      new URL(normalizedWebsiteUrl);
    } catch {
      setSubmitError('Please enter a valid company website URL.');
      return;
    }

    setSubmitError(null);
    setIsAnalyzing(true);

    try {
      await ApiClient.createBusiness({
        ...formData,
        name: businessName,
        websiteUrl: normalizedWebsiteUrl,
      });
    } catch (e) {
      setIsAnalyzing(false);
      setSubmitError(e instanceof Error ? e.message : 'Could not save your business details. Please try again.');
      return;
    }

    // Sequence through the 7 check milestones with animated delays
    const delays = [800, 1600, 2400, 3200, 4000, 4800, 5600];
    delays.forEach((delay, idx) => {
      setTimeout(() => {
        setAnalysisPhase(idx + 1);
        if (idx === delays.length - 1) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
          setTimeout(async () => {
            await refreshBusiness();
            onComplete();
          }, 1200);
        }
      }, delay);
    });
  };

  const marketingGoalOptions = [
    'Leads',
    'Sales',
    'Website Traffic',
    'Brand Awareness',
    'App Installs',
    'Local Customers',
    'Engagement',
  ];

  const integrationOptions = [
    { id: 'google_search_console', name: 'Google Search Console', icon: 'Search' },
    { id: 'google_analytics', name: 'Google Analytics 4', icon: 'BarChart2' },
    { id: 'google_ads', name: 'Google Ads', icon: 'Megaphone' },
    { id: 'meta_ads', name: 'Meta (Facebook & Instagram)', icon: 'Share2' },
    { id: 'linkedin', name: 'LinkedIn Marketing', icon: 'Linkedin' },
    { id: 'shopify', name: 'Shopify Storefront', icon: 'ShoppingBag' },
    { id: 'wordpress', name: 'WordPress CMS', icon: 'Globe' },
  ];

  const analysisMilestones = [
    'Crawling website architecture and metadata...',
    'Identifying core products and commercial offerings...',
    'Synthesizing target buyer personas and search intent...',
    'Detecting brand tone and communication guidelines...',
    'Discovering high-impact SEO keyword clusters...',
    'Generating cross-channel content topics and ad angles...',
    'Calibrating 10 autonomous AI marketing agents...',
  ];

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="w-full max-w-lg glass-card rounded-4xl p-8 sm:p-10 border border-indigo-100 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-500 via-indigo-600 to-blush-500 text-white flex items-center justify-center mx-auto mb-6 shadow-soft animate-pulse">
            <BrainCircuit className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            AI Understanding Your Business
          </h2>
          <p className="text-xs text-slate-500 mb-8">
            Analyzing {formData.websiteUrl} and constructing your autonomous 24/7 digital marketing engine.
          </p>

          <div className="space-y-3.5 text-left max-w-md mx-auto mb-8">
            {analysisMilestones.map((text, idx) => {
              const isPassed = analysisPhase > idx;
              const isCurrent = analysisPhase === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all ${
                    isPassed
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : isCurrent
                      ? 'bg-indigo-50 text-brand-700 border border-brand-200 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {isPassed ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    )}
                  </div>
                  <span className="text-xs">{text}</span>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 via-indigo-600 to-blush-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, (analysisPhase / 7) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-2xl glass-card rounded-4xl p-8 sm:p-10 border border-slate-200/80 shadow-soft">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-soft font-bold text-xs">
              {step}/{totalSteps}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Business Calibration Wizard</h3>
              <p className="text-[11px] text-slate-400">Configure once. MarketMind works 24/7.</p>
            </div>
          </div>

          <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-500 h-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Dynamic Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="min-h-[300px]"
          >
            {step === 1 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 1</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">What is your business name?</h2>
                <p className="text-xs text-slate-500 mb-6">
                  This identity will be referenced across all AI content, ads, and reports.
                </p>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-400"
                    placeholder="e.g. Truck Mitra"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 2</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">What is your primary website URL?</h2>
                <p className="text-xs text-slate-500 mb-6">
                  Our crawler will inspect public pages, metadata, canonicals, and structure.
                </p>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-400"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 3</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">Which industry best matches your business?</h2>
                <p className="text-xs text-slate-500 mb-6">Calibrates commercial search benchmarks and competitor models.</p>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-400"
                  placeholder="e.g. Enterprise Software & Automation"
                />
              </div>
            )}

            {step === 4 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 4</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">Briefly describe your business</h2>
                <p className="text-xs text-slate-500 mb-6">What value do you deliver and what problem do you solve?</p>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-400 leading-relaxed"
                  placeholder="Explain what your business does in 2-3 sentences..."
                />
              </div>
            )}

            {step === 5 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 5</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">Products and Services</h2>
                <p className="text-xs text-slate-500 mb-6">Comma-separated key offerings you sell or promote.</p>
                <input
                  type="text"
                  value={formData.productsAndServices.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productsAndServices: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-400"
                  placeholder="e.g. Workflow Engine, Advisory Services, Cloud Suite"
                />
              </div>
            )}

            {step === 6 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 6</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">Who is your target audience?</h2>
                <p className="text-xs text-slate-500 mb-6">Key decision makers and customer demographics.</p>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-400"
                  placeholder="e.g. CTOs, VP Engineers, and Operations Directors"
                />
              </div>
            )}

            {step === 7 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 7</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">Target Locations</h2>
                <p className="text-xs text-slate-500 mb-6">Comma-separated regions for local and national search targeting.</p>
                <input
                  type="text"
                  value={formData.targetLocations.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetLocations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-400"
                  placeholder="e.g. United States, Canada, United Kingdom"
                />
              </div>
            )}

            {step === 8 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 8</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">What is your primary marketing goal?</h2>
                <p className="text-xs text-slate-500 mb-6">Select the objectives that guide the AI Marketing Brain.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {marketingGoalOptions.map((goal) => {
                    const isSelected = formData.marketingGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? formData.marketingGoals.filter((g) => g !== goal)
                            : [...formData.marketingGoals, goal];
                          setFormData({ ...formData, marketingGoals: updated });
                        }}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all text-left ${
                          isSelected
                            ? 'bg-brand-50 border-brand-400 text-brand-700 ring-2 ring-brand-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 9 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 9</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">Marketing Budget & Safety Cap</h2>
                <p className="text-xs text-slate-500 mb-6">The AI will strictly never exceed these configured parameters.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Monthly Total Budget ($)</label>
                    <input
                      type="number"
                      value={formData.monthlyBudget}
                      onChange={(e) => setFormData({ ...formData, monthlyBudget: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-brand-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Max Daily Spend Limit ($)</label>
                    <input
                      type="number"
                      value={formData.dailyBudgetLimit}
                      onChange={(e) => setFormData({ ...formData, dailyBudgetLimit: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-brand-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 10 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 10</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">Brand Voice & Aesthetics</h2>
                <p className="text-xs text-slate-500 mb-6">Ensure tone consistency across all generated copy and creatives.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Brand Tone</label>
                    <input
                      type="text"
                      value={formData.brandTone}
                      onChange={(e) => setFormData({ ...formData, brandTone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-400"
                      placeholder="e.g. Authoritative, Modern & Data-Driven"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#537CF3] shadow-sm"></div>
                      <span className="text-xs font-semibold text-slate-700">Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1CB77B] shadow-sm"></div>
                      <span className="text-xs font-semibold text-slate-700">Secondary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#DC5495] shadow-sm"></div>
                      <span className="text-xs font-semibold text-slate-700">Accent</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 11 && (
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 11</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-2">Connect Marketing Accounts</h2>
                <p className="text-xs text-slate-500 mb-6">
                  Select accounts to activate. Unconfigured channels run in safe Sandbox Demo mode.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {integrationOptions.map((acc) => {
                    const isConnected = formData.connectedAccounts.includes(acc.id);
                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          const updated = isConnected
                            ? formData.connectedAccounts.filter((id) => id !== acc.id)
                            : [...formData.connectedAccounts, acc.id];
                          setFormData({ ...formData, connectedAccounts: updated });
                        }}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isConnected
                            ? 'bg-brand-50 border-brand-300 text-slate-800'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="text-xs font-semibold">{acc.name}</span>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                            isConnected ? 'bg-brand-500 text-white font-bold' : 'border border-slate-300'
                          }`}
                        >
                          {isConnected && '✓'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 mt-8">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {submitError && (
            <p role="alert" className="mx-3 text-xs font-semibold text-rose-600">
              {submitError}
            </p>
          )}

          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 shadow-soft flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5"
          >
            {step === totalSteps ? 'Launch Marketing Engine' : 'Next Step'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
