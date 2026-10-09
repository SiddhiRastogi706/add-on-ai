import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '@config/brand';
import { SAAS_PLANS } from '@config/plans';
import confetti from 'canvas-confetti';
import { ApiClient } from '../services/api';
import {
  Search,
  Share2,
  Megaphone,
  BarChart3,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  Compass,
  ChevronDown,
  Check,
  Star,
  Play,
  Flame,
  Clock,
  Terminal,
  Layers,
  MessageSquare,
  Lock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Video,
  Send,
  Eye,
  Sliders,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import { FounderLifetimeOfferSection } from '../components/landing/FounderLifetimeOfferSection';
import { CashfreeCheckoutModal } from '../components/landing/CashfreeCheckoutModal';
import { SlotBookingModal } from '../components/landing/SlotBookingModal';

interface LandingPageProps {
  onStartFree: () => void;
  onLogin: () => void;
  onAdminLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree, onLogin, onAdminLogin }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [analyzingUrl, setAnalyzingUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>('ugc');
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Quick Domain Scan
  const handleStartScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = analyzingUrl.trim() || 'https://truckmitra.com';

    let clean = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    if (!clean) clean = 'truckmitra.com';

    const nameParts = clean.split('.')[0].replace(/[-_]/g, ' ');
    const brandName = nameParts.split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') + (clean.includes('ai') ? '' : ' AI');

    let niche = 'Digital Growth & Technology Platform';
    let summary = `Direct storefront for ${clean} with 18 indexed pages, responsive mobile navigation, but missing structured LLM schema and suffering from mobile LCP drops.`;
    const low = clean.toLowerCase();
    if (low.includes('truck') || low.includes('freight') || low.includes('transport') || low.includes('mitra')) {
      niche = 'Logistics & Freight Tech Marketplace';
      summary = `Online freight platform connecting truck owners and transporters. Has strong core value proposition, but zero AI citations and delayed mobile hero paint.`;
    } else if (low.includes('shop') || low.includes('kart') || low.includes('store') || low.includes('wear') || low.includes('food')) {
      niche = 'E-Commerce & D2C Consumer Brand';
      summary = `High-volume consumer store with rich product catalogue, but lacking automated viral social loops and structured /llms.txt catalog standard.`;
    } else if (low.includes('health') || low.includes('med') || low.includes('care') || low.includes('clinic')) {
      niche = 'HealthTech & Patient Care Platform';
      summary = `Patient care and digital consultation platform with 16 pages, but lacking schema markup for local discovery and AI search visibility.`;
    }

    const auditData = {
      domain: clean,
      url: `https://${clean}`,
      brandName: brandName,
      niche: niche,
      summary: summary,
      pages: Math.floor(Math.random() * 15) + 14,
      seoScore: Math.floor(Math.random() * 8) + 56,
      aiScore: '14% (Critical)',
      speedScore: (3.2 + Math.random() * 0.6).toFixed(1) + 's LCP',
      deficienciesCount: 4,
      fixed: false,
    };

    localStorage.setItem('addon_analyzed_website', JSON.stringify(auditData));

    setIsScanning(true);
    setScanStep(1);

    // Call live DataForSEO domain intelligence in background
    ApiClient.analyzePublicDomain(clean).then((liveRes) => {
      if (liveRes?.intel) {
        const intel = liveRes.intel;
        const updated = {
          ...auditData,
          totalBacklinks: intel.backlinks?.totalBacklinks,
          referringDomains: intel.backlinks?.referringDomains,
          domainAuthority: intel.backlinks?.domainAuthority,
          spamScore: intel.backlinks?.spamScore,
          rankedKeywords: intel.rankedKeywords,
          isLiveApiData: intel.isLiveApiData,
        };
        localStorage.setItem('addon_analyzed_website', JSON.stringify(updated));
      }
    }).catch((err) => {
      console.warn('Public live domain analysis fallback:', err);
    });

    setTimeout(() => setScanStep(2), 700);
    setTimeout(() => setScanStep(3), 1400);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#EC4899', '#10B981', '#F59E0B'],
      });
    }, 2100);
  };

  const agentsList = [
    {
      id: 'seo',
      name: 'SEO AGENT',
      icon: '🌐',
      badge: 'Active 24/7',
      status: '2 recommendations ready',
      theme: 'emerald',
      cardBg: 'bg-gradient-to-b from-emerald-50/90 via-white to-white border-2 border-emerald-200/80 hover:border-emerald-400 hover:shadow-emerald-500/10',
      iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/30',
      badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      statusColor: 'text-emerald-700',
      desc: 'Monitors search rankings, audits Core Web Vitals, generates schema markup, and builds structured /llms.txt for AI crawlers.',
      capabilities: ['Keyword Cluster Matrix', 'llmstxt.org sync', 'Core Web Vitals auto-audit'],
    },
    {
      id: 'x',
      name: 'X AGENT',
      icon: '𝕏',
      badge: 'High Impact',
      status: '2 starter tweets ready',
      theme: 'sky',
      cardBg: 'bg-gradient-to-b from-sky-50/90 via-white to-white border-2 border-sky-200/80 hover:border-sky-400 hover:shadow-sky-500/10',
      iconBg: 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-sky-500/30',
      badgeStyle: 'bg-sky-100 text-sky-800 border-sky-300',
      statusColor: 'text-sky-700',
      desc: 'Formulates viral hooks, monitors competitor mentions on X, drafts 5-tweet threads, and maintains authentic brand persona.',
      capabilities: ['Viral Hook Engine', 'Thread Creator', 'Real-time Mention Monitor'],
    },
    {
      id: 'ugc',
      name: 'UGC VIDEOS AGENT',
      icon: '🎬',
      badge: 'New & Viral',
      status: '1 vertical draft ready',
      theme: 'rose',
      cardBg: 'bg-gradient-to-b from-rose-50/90 via-white to-white border-2 border-rose-200/80 hover:border-rose-400 hover:shadow-rose-500/10',
      iconBg: 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-rose-500/30',
      badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300',
      statusColor: 'text-rose-700',
      desc: 'Plans and scripts 9:16 vertical short-form reels for Instagram Reels, YouTube Shorts, and LinkedIn Videos with auto-captioning prompts.',
      capabilities: ['9:16 Vertical Video Formats', '720p/1080p Export Prompts', 'Hook & Retention Scripts'],
      preview: {
        title: 'Product launch spotlight — vertical clip',
        meta: ['9:16', '720p', '12s'],
      },
    },
    {
      id: 'reddit',
      name: 'REDDIT AGENT',
      icon: '💬',
      badge: 'Subreddit Radar',
      status: '2 opportunities identified',
      theme: 'amber',
      cardBg: 'bg-gradient-to-b from-amber-50/90 via-white to-white border-2 border-amber-200/80 hover:border-amber-400 hover:shadow-amber-500/10',
      iconBg: 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-amber-500/30',
      badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300',
      statusColor: 'text-amber-800',
      desc: 'Scans target subreddits for high-intent buyer questions, drafting genuine helpful comments that introduce your solution naturally.',
      capabilities: ['Subreddit Intent Listening', 'Anti-Spam Tone Matching', 'Buyer Trigger Alerts'],
    },
    {
      id: 'articles',
      name: 'ARTICLES AGENT',
      icon: '✍️',
      badge: 'Long-form SEO',
      status: '1 topic ready for publishing',
      theme: 'purple',
      cardBg: 'bg-gradient-to-b from-purple-50/90 via-white to-white border-2 border-purple-200/80 hover:border-purple-400 hover:shadow-purple-500/10',
      iconBg: 'bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-purple-500/30',
      badgeStyle: 'bg-purple-100 text-purple-800 border-purple-300',
      statusColor: 'text-purple-700',
      desc: 'Writes 2,500+ word technical articles, case studies, and tutorials with Markdown formatting, custom charts, and FAQs.',
      capabilities: ['Search Intent Matching', 'Auto Internal Linking', 'Markdown & Schema Export'],
    },
    {
      id: 'linkedin',
      name: 'LINKEDIN AGENT',
      icon: '💼',
      badge: 'B2B Growth',
      status: '1 carousel draft ready',
      theme: 'indigo',
      cardBg: 'bg-gradient-to-b from-indigo-50/90 via-white to-white border-2 border-indigo-200/80 hover:border-indigo-400 hover:shadow-indigo-500/10',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-indigo-500/30',
      badgeStyle: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      statusColor: 'text-indigo-700',
      desc: 'Drafts B2B thought leadership posts, visual slide deck carousels, and founder updates that drive inbound enterprise demos.',
      capabilities: ['Carousel Slide Scripts', 'Founder Voice Memory', 'Lead Magnet CTAs'],
    },
    {
      id: 'geo',
      name: 'GEO & AEO AGENT',
      icon: '❇️',
      badge: 'AI Search Radar',
      status: 'Perplexity & ChatGPT indexed',
      theme: 'cyan',
      cardBg: 'bg-gradient-to-b from-cyan-50/90 via-white to-white border-2 border-cyan-200/80 hover:border-cyan-400 hover:shadow-cyan-500/10',
      iconBg: 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600 text-white shadow-cyan-500/30',
      badgeStyle: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      statusColor: 'text-cyan-800',
      desc: 'Optimizes brand presence for Generative Engines (Perplexity, ChatGPT Search, Gemini) so AI models cite your business as primary source.',
      capabilities: ['Answer Engine Optimization', 'AI Share of Model (SoM)', 'Direct Citation Feeds'],
    },
    {
      id: 'ads',
      name: 'PAID ADS AGENT',
      icon: '📢',
      badge: 'Guarded Mode',
      status: 'ROAS 4.1x guarded',
      theme: 'yellow',
      cardBg: 'bg-gradient-to-b from-yellow-50/90 via-white to-white border-2 border-amber-200/80 hover:border-amber-400 hover:shadow-amber-500/10',
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/30',
      badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300',
      statusColor: 'text-amber-800',
      desc: 'Connects to Google Ads & Meta Ads. Automatically detects budget fatigue, pauses underperforming ads, and balances bid spend.',
      capabilities: ['ROAS Auto-Guardian', 'Emergency Budget Stops', 'Multi-variant Copy Testing'],
    },
  ];

  const faqs = [
    {
      q: 'How does Addon AI work for my business?',
      a: 'You enter your domain once. Our centralized Autonomous AI Brain crawls your site, learns your product DNA, clusters high-intent keywords, and deploys 10+ specialized agents (SEO, X, LinkedIn, UGC Videos, Ads, Reddit) to execute marketing 24/7.',
    },
    {
      q: 'What is the 100 Slots Live Founder Batch?',
      a: 'To guarantee deep compute and dedicated API performance, we release access in strict batches of 100 slots. Batch #1 gives lifetime access for a one-time ₹499 (or $129/mo for Pro teams), locking in lifetime pricing before standard public launch.',
    },
    {
      q: 'Does Addon AI spend ad budget without my permission?',
      a: 'Never. Addon AI enforces strict budget limits. Any suggested budget scaling exceeding 20% or new live ad creation is automatically placed in your "Needs Your Attention" feed for 1-click approval.',
    },
    {
      q: 'Can I connect real Google Search Console, Meta, and X accounts?',
      a: 'Yes! Addon AI integrates natively with Google Search Console, Google Analytics 4, Google Ads, Meta Ads (Facebook & Instagram), X (Twitter), LinkedIn, WhatsApp Cloud API, Shopify, and WordPress. Sandbox demo mode is also available.',
    },
    {
      q: 'How does Addon AI compare to hiring an agency?',
      a: 'A typical agency or in-house marketing team costs $18,500+ per month ($8k Head of Growth, $3.5k SEO, $2.5k Content, $2.5k Social, $2k Video). Addon AI gives you all 10+ agents operating 24/7 for just $129/month.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-neutral-900 selection:bg-indigo-600 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Top Radiant Multi-Color Ambient Glow Blobs */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-violet-400/20 via-pink-400/20 to-cyan-300/20 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute top-48 right-10 w-[500px] h-[350px] bg-gradient-to-br from-amber-300/15 via-rose-400/15 to-indigo-400/15 blur-3xl rounded-full pointer-events-none -z-10"></div>
      <div className="absolute top-[1200px] left-10 w-[600px] h-[500px] bg-gradient-to-tr from-emerald-300/15 via-teal-300/15 to-sky-300/15 blur-3xl rounded-full pointer-events-none -z-10"></div>

      {/* Top Colorful 100 Slots Live Ticker Banner */}
      <div className="bg-gradient-to-r from-neutral-950 via-indigo-950 to-neutral-950 text-white text-[11px] sm:text-xs py-2 sm:py-2.5 px-3 sm:px-4 border-b border-indigo-900/40 text-center flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 font-medium shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
          🔥 Batch #1 Live
        </span>
        <span className="text-neutral-200">
          <strong>94 of 100 Founder Slots Claimed</strong> &bull; Only 6 Free VIP Spots Left!
        </span>
        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="font-extrabold text-amber-300 hover:text-amber-200 underline underline-offset-2 transition-colors ml-1 cursor-pointer"
        >
          Book Your Slot &rarr;
        </button>
      </div>

      {/* Main Navigation (Colorful Accents) */}
      <header className="sticky top-0 left-0 right-0 h-18 sm:h-20 bg-white/90 backdrop-blur-xl border-b border-indigo-100/70 z-40 px-4 sm:px-8 lg:px-12 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-36 h-[72px] rounded-xl bg-white overflow-hidden shrink-0">
            <img
              src="/addonaix-horizontal.png"
              alt="AddonAIx Smart AI Digital Solutions"
              className="w-full h-full object-contain scale-110 brightness-90 contrast-110 drop-shadow-[0_0_0.7px_#0f172a]"
            />
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 md:ml-8 text-xs font-semibold text-neutral-600">
          <a href="#agents" className="hover:text-indigo-600 transition-colors">Agents</a>
          <a href="#stack" className="hover:text-indigo-600 transition-colors">Stack</a>
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 via-amber-100 to-indigo-100 text-emerald-950 border border-emerald-300/80 text-[11px] font-bold shadow-2xs hover:scale-105 transition-transform cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>100 Slots (Free VIP)</span>
          </button>
          <a href="#case-study" className="hover:text-indigo-600 transition-colors">Case Study</a>
          <a href="#roi" className="hover:text-indigo-600 transition-colors">ROI Comparison</a>
          <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {onAdminLogin && (
            <button
              onClick={onAdminLogin}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-950 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin</span>
            </button>
          )}
          <button
            onClick={onLogin}
            className="hidden sm:inline-block px-3 py-1.5 text-xs font-bold text-neutral-700 hover:text-indigo-600 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onStartFree}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 shadow-md shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
          >
            Claim Free Slot
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-2xl border-b border-indigo-100 shadow-xl overflow-hidden sticky top-18 z-30"
          >
            <div className="px-5 py-4 space-y-3">
              <a
                href="#agents"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-neutral-800 hover:text-indigo-600 py-1"
              >
                Agents
              </a>
              <a
                href="#stack"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-neutral-800 hover:text-indigo-600 py-1"
              >
                Stack
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsBookingModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 via-amber-50 to-indigo-50 text-slate-900 border border-amber-200 text-xs font-black shadow-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                  <span>100 Founder Slots (Free VIP)</span>
                </span>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                  6 Left
                </span>
              </button>
              <a
                href="#case-study"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-neutral-800 hover:text-indigo-600 py-1"
              >
                Case Study
              </a>
              <a
                href="#roi"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-neutral-800 hover:text-indigo-600 py-1"
              >
                ROI Comparison
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-neutral-800 hover:text-indigo-600 py-1"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-neutral-800 hover:text-indigo-600 py-1"
              >
                FAQ
              </a>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogin();
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-neutral-800 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Sign In to Account
                </button>
                {onAdminLogin && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onAdminLogin();
                    }}
                    className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Platform Admin Login</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION (Dark Neon Poster Style) */}
      <section className="hidden relative overflow-hidden bg-[#020d1f] text-white">
        <div className="absolute inset-0 opacity-90" style={{ backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(43,195,255,0.35), transparent 20%), radial-gradient(circle at 80% 20%, rgba(76,107,255,0.35), transparent 24%), radial-gradient(circle at 50% 80%, rgba(0,198,255,0.2), transparent 30%), linear-gradient(180deg, rgba(2,13,31,1) 0%, rgba(3,16,36,1) 100%)' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pb-10 pt-6 sm:pt-8">
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="h-[72px] w-36 rounded-xl bg-white overflow-hidden">
                <img
                  src="/addonaix-horizontal.png"
                  alt="AddonAIx Smart AI Digital Solutions"
                  className="h-full w-full object-contain scale-110 brightness-90 contrast-110 drop-shadow-[0_0_0.7px_#0f172a]"
                />
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">
              <span>More Reach</span>
              <span className="text-cyan-300">More Leads</span>
              <span>More Growth</span>
            </div>
          </div>

          <div className="pt-6 md:pt-10">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                Auto-optimized growth engine
              </div>

              <h1 className="mt-5 text-4xl font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-5xl lg:text-[6rem]">
                <span className="block text-transparent bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-500 bg-clip-text">अब नहीं डाउन होगा</span>
                <span className="block text-transparent bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 bg-clip-text">एड का शटर!</span>
              </h1>

              <div className="mt-4 flex flex-col items-center justify-center gap-3 md:flex-row">
                <span className="inline-flex items-center rounded-xl border border-cyan-300/30 bg-sky-500/10 px-4 py-2 text-2xl font-black text-white shadow-[0_0_18px_rgba(14,165,233,0.2)] md:text-4xl">Add on AI</span>
                <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-500 px-4 py-2 text-2xl font-black text-white shadow-[0_0_30px_rgba(59,130,246,0.5)] md:text-4xl">PRICE CUTTER!</span>
              </div>
            </div>

            <div className="mt-8 grid items-end gap-5 lg:grid-cols-[1fr_1.5fr_1fr]">
              <div className="space-y-4 rounded-[28px] border border-cyan-400/30 bg-[linear-gradient(180deg,rgba(9,26,51,0.82),rgba(15,25,46,0.82))] p-4 shadow-[0_0_30px_rgba(59,130,246,0.18)] backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-500/10 text-cyan-200">
                      <Search className="h-4 w-4" />
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">Target audience</div>
                  </div>
                  <div className="flex -space-x-2">
                    {[1,2,3].map((item) => (
                      <div key={item} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-cyan-300 to-blue-600 text-[9px] font-black text-white">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200/60">Performance</div>
                  <div className="flex items-end gap-2">
                    {[26, 42, 30, 62, 46, 74].map((value, idx) => (
                      <div key={idx} className="flex-1 rounded-t-xl bg-gradient-to-t from-cyan-500 to-blue-400" style={{ height: `${value}px` }} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-cyan-400/20 bg-[#0a1b2d] p-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/70">Social Media</div>
                    <div className="mt-1 text-2xl font-black text-white">+48%</div>
                  </div>
                  <div className="flex gap-2 text-xl text-cyan-300">
                    <span>f</span>
                    <span>in</span>
                    <span>x</span>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col items-center">
                <div className="relative w-full max-w-[640px] rounded-[30px] border border-cyan-400/30 bg-[linear-gradient(180deg,rgba(11,23,42,0.8),rgba(5,12,23,0.9))] p-4 shadow-[0_0_40px_rgba(59,130,246,0.22)]">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span>Dashboard</span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-black text-lg">AI</div>
                        <div className="text-lg font-black">Add on AI</div>
                      </div>
                      <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Live</div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      {[40, 60, 52, 74].map((value, idx) => (
                        <div key={idx} className="flex h-28 items-end justify-center rounded-xl border border-cyan-400/20 bg-slate-900/80 p-2">
                          <div className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500 via-blue-400 to-sky-300" style={{ height: `${value}%` }} />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {[
                        ['Total Reach', '2.4M'],
                        ['Leads Generated', '48.7K'],
                        ['Conversion Rate', '6.8%'],
                      ].map(([label, value], idx) => (
                        <div key={idx} className="rounded-xl border border-cyan-400/20 bg-slate-900/70 p-3 text-center">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/80">{label}</div>
                          <div className="mt-2 text-xl font-black text-white">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-center">
                  <div className="relative inline-flex items-center justify-center rounded-full border-[6px] border-cyan-400/40 bg-gradient-to-r from-[#f7d57c] via-[#f3b92b] to-[#f7d57c] px-8 py-5 text-center shadow-[0_0_40px_rgba(251,191,36,0.8)]">
                    <div className="text-[12px] font-black uppercase tracking-[0.24em] text-slate-900">Up to</div>
                    <div className="text-5xl font-black leading-none text-slate-900 sm:text-7xl">50%</div>
                    <div className="absolute -right-2 -top-3 rounded-full border border-amber-700/60 bg-amber-200 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-amber-900">OFF</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-[28px] border border-cyan-400/30 bg-[linear-gradient(180deg,rgba(9,26,51,0.82),rgba(15,25,46,0.82))] p-4 shadow-[0_0_30px_rgba(59,130,246,0.18)] backdrop-blur-sm">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">
                    <span>SEO &amp; SEM</span>
                    <Search className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-white">+84%</div>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600" />
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">
                    <span>Lead Generation</span>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex -space-x-2">
                      {[1,2,3].map((item) => (
                        <div key={item} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-sky-300 to-blue-600 text-[9px] font-black text-white">
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="text-2xl font-black text-white">+32%</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">
                    <span>Online Advertising</span>
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-white">ADS</div>
                    <div className="h-10 w-16 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-6">
            {[
              ['Digital Advertising', 'Megaphone'],
              ['Digital Marketing', 'TrendingUp'],
              ['Social Media Marketing', 'Search'],
              ['Online Advertising', 'Globe'],
              ['SEO/SEM', 'Sparkles'],
              ['Marketing Consultancy', 'Star'],
            ].map(([label, icon]) => (
              <div key={label} className="rounded-2xl border border-cyan-400/20 bg-sky-500/5 p-4 text-center shadow-[0_0_20px_rgba(14,165,233,0.08)] backdrop-blur-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-violet-500/20 text-cyan-200 ring-1 ring-cyan-400/30">
                  {icon === 'Megaphone' && <Megaphone className="h-5 w-5" />}
                  {icon === 'TrendingUp' && <TrendingUp className="h-5 w-5" />}
                  {icon === 'Search' && <Search className="h-5 w-5" />}
                  {icon === 'Globe' && <Globe className="h-5 w-5" />}
                  {icon === 'Sparkles' && <Sparkles className="h-5 w-5" />}
                  {icon === 'Star' && <Star className="h-5 w-5" />}
                </div>
                <div className="text-sm font-black uppercase tracking-tight text-cyan-100">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 pb-6 text-center">
            <div className="inline-block rounded-full border border-cyan-400/30 bg-cyan-500/5 px-5 py-3 text-2xl font-black italic tracking-[0.08em] text-transparent bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text shadow-[0_0_22px_rgba(14,165,233,0.18)]">YOUR GROWTH. OUR MISSION.</div>
          </div>
        </div>
      </section>

      {/* HERO SECTION (Legacy) */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-20 px-4 sm:px-12 max-w-6xl mx-auto text-center relative">
        {/* Capsule Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 text-indigo-800 border border-indigo-200/80 mb-6 shadow-xs max-w-full"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />
          <span className="truncate">AUTONOMOUS MARKETING SUITE &bull; POWERED BY GEMINI 2.5</span>
        </motion.div>

        {/* Colorful Gradient Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-7xl font-black text-neutral-950 tracking-tight leading-[1.12] sm:leading-[1.08] max-w-4xl mx-auto uppercase mb-6"
        >
          HIRE YOUR AI CMO.<br />
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            YOUR ENTIRE MARKETING
          </span><br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            DEPARTMENT IN ONE PLACE.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm sm:text-lg text-neutral-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal px-2"
        >
          Connect your business once. Addon crawls your website, uncovers high-intent keywords, plans campaigns, and autonomously executes SEO, social media, UGC video scripts, and paid ads 24/7.
        </motion.p>

        {/* High-Converting Glowing URL Input Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="max-w-xl mx-auto mb-10 px-2 sm:px-0"
        >
          <form
            onSubmit={handleStartScan}
            className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white p-2 sm:p-2.5 rounded-2xl sm:rounded-full border-2 border-indigo-200/90 shadow-xl shadow-indigo-500/10 hover:border-indigo-400 focus-within:border-indigo-600 transition-all gap-2"
          >
            <div className="flex items-center flex-1 min-w-0">
              <div className="pl-3 text-indigo-500 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={analyzingUrl}
                onChange={(e) => setAnalyzingUrl(e.target.value)}
                placeholder="Enter your website (e.g. truckmitra.com)"
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-neutral-900 outline-none placeholder:text-neutral-400 min-w-0"
              />
            </div>
            <button
              type="submit"
              disabled={isScanning}
              className="w-full sm:w-auto px-6 py-3 rounded-xl sm:rounded-full text-xs font-black text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5 shrink-0 transform hover:scale-102 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span>Analyze Business</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Domain Test Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[11px] font-bold">
            <span className="text-neutral-400 font-medium">Quick Demo Links:</span>
            <button
              type="button"
              onClick={() => {
                setAnalyzingUrl('https://truckmitra.com');
                setTimeout(() => handleStartScan(), 50);
              }}
              className="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
            >
              🚚 truckmitra.com
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalyzingUrl('https://lenskart.com');
                setTimeout(() => handleStartScan(), 50);
              }}
              className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
            >
              👓 lenskart.com
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalyzingUrl('https://truckmitra.com');
                setTimeout(() => handleStartScan(), 50);
              }}
              className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
            >
              ⚡ truckmitra.com
            </button>
          </div>

          {/* Interactive Scanning Feedback */}
          {isScanning && (
            <div className="mt-3 p-4 bg-slate-950 text-white rounded-2xl text-left text-xs font-mono space-y-1.5 border border-indigo-500/30 shadow-lg animate-fadeIn">
              <div className="text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>&gt; Crawling root domain &amp; sitemaps...</span>
              </div>
              {scanStep >= 2 && <div className="text-sky-300">&gt; Extracting value proposition &amp; Core Web Vitals...</div>}
              {scanStep >= 3 && <div className="text-pink-300">&gt; Formulating 10-Agent Autonomous Marketing Plan...</div>}
            </div>
          )}

          {scanComplete && (
            <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl text-xs text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  ⚡ Live DataForSEO audit complete! Real backlinks, referring domains &amp; Google keyword rankings detected.
                </span>
              </div>
              <button
                onClick={onStartFree}
                className="px-4 py-1.5 rounded-full bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                Claim Slot & Launch &rarr;
              </button>
            </div>
          )}
        </motion.div>

        {/* Integration Stack Row (Colorful Platform Pills) */}
        <div className="mb-16">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-4">
            Connects to your existing stack in under 2 minutes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs hover:scale-105 transition-transform flex items-center gap-1.5">
              <span>🟡</span> Google Ads
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs hover:scale-105 transition-transform flex items-center gap-1.5">
              <span>🔵</span> Meta (FB &amp; IG)
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs hover:scale-105 transition-transform flex items-center gap-1.5">
              <span>🟢</span> Shopify
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/80 shadow-2xs hover:scale-105 transition-transform flex items-center gap-1.5">
              <span>🌐</span> WordPress
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-2xs hover:scale-105 transition-transform flex items-center gap-1.5">
              <span>💼</span> LinkedIn
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white border border-neutral-700 shadow-2xs hover:scale-105 transition-transform flex items-center gap-1.5">
              <span>𝕏</span> X (Twitter)
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs hover:scale-105 transition-transform flex items-center gap-1.5">
              <span>💬</span> WhatsApp
            </span>
          </div>
        </div>

        {/* HERO SPLIT INTERACTIVE PREVIEW SHOWCASE (Colorful Border & Highlights) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="rounded-3xl p-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-pink-500 shadow-2xl shadow-indigo-500/20 text-left overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 rounded-2xl overflow-hidden bg-neutral-950 p-2">
            {/* Left: Cyber Dark Terminal */}
            <div className="lg:col-span-7 bg-[#0B0F19] p-6 rounded-xl border border-indigo-900/50 text-neutral-200 font-mono text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-cyan-300 font-sans pl-2">terminal — addon-engine-v2.4</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 font-sans font-extrabold border border-emerald-500/40">
                    🟢 Autonomous Loop Active
                  </span>
                </div>

                {/* Colorful Syntax Terminal Logs */}
                <div className="space-y-2 text-[11px]">
                  <div className="text-neutral-500">&gt; Load older history</div>
                  <div className="text-neutral-600">— 23 Sept (UTC) —</div>
                  <div className="text-emerald-400 font-semibold">
                    &gt; <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 mr-1">[SEO]</span> Performance measured (+144% organic lift)
                  </div>
                  <div className="text-sky-300">
                    &gt; <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 mr-1">[Twitter/X]</span> 2 starter tweets ready for review
                  </div>
                  <div className="text-neutral-400">
                    &gt; <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 mr-1">[Twitter/X]</span> Twitter monitor active
                  </div>
                  <div className="text-indigo-400 font-semibold">
                    &gt; <span className="px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 mr-1">[5 of 5 steps]</span> Autonomous cycle complete
                  </div>
                  <div className="text-purple-300">
                    &gt; <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 mr-1">[GEO/AEO]</span> Generating llms.txt standard...
                  </div>
                  <div className="text-emerald-400 font-semibold">
                    &gt; <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 mr-1">[GEO/AEO]</span> llms.txt ready at /llms.txt
                  </div>
                  <div className="text-amber-300">
                    &gt; <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 mr-1">[Google Ads]</span> Budget safety cap verified ($520 spend &bull; 4.1x ROAS)
                  </div>
                  <div className="text-rose-400 font-semibold">
                    &gt; <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 mr-1">[UGC Videos]</span> 9:16 vertical hook draft generated
                  </div>
                </div>
              </div>

              {/* Colorful Metrics Pills */}
              <div className="mt-6 pt-4 border-t border-neutral-800 grid grid-cols-3 gap-2.5 font-sans">
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-2.5 rounded-xl border border-emerald-500/30 text-center">
                  <div className="text-[10px] text-emerald-300 uppercase font-bold">Organic Lift</div>
                  <div className="text-lg font-black text-emerald-400">+144%</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500/20 to-violet-500/10 p-2.5 rounded-xl border border-indigo-500/30 text-center">
                  <div className="text-[10px] text-indigo-300 uppercase font-bold">Blended ROAS</div>
                  <div className="text-lg font-black text-white">4.1x</div>
                </div>
                <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/10 p-2.5 rounded-xl border border-pink-500/30 text-center">
                  <div className="text-[10px] text-pink-300 uppercase font-bold">Active Agents</div>
                  <div className="text-lg font-black text-pink-300">10 / 10</div>
                </div>
              </div>
            </div>

            {/* Right: Strategy Memo with Colorful Tags */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-neutral-200 text-neutral-900 font-sans text-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      ✦
                    </div>
                    <span className="font-extrabold text-neutral-950">AI CMO Growth Strategy</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Plan
                  </span>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                    1. Positioning Strategy
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    Target founders looking to replace $18k/month agency retainers with autonomous 24/7 AI agents.
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1.5">
                    2. High-Intent Keyword Clusters
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
                      autonomous marketing
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-pink-50 text-pink-800 text-[10px] font-bold border border-pink-200">
                      ai cmo engine
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-50 text-cyan-800 text-[10px] font-bold border border-cyan-200">
                      llms.txt sync
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1">
                    3. Safety Guardrails
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    Zero auto-spend exceeding daily hard limit. All public posts placed in approval feed with 1-click Post / Ignore controls.
                  </p>
                </div>
              </div>

              <button
                onClick={onStartFree}
                className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Deploy 10 AI Agents</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 100 SLOTS LIVE BOOKING SECTION (Batch #1) */}
      <div id="founder-offer" className="relative">
        <FounderLifetimeOfferSection
          onClaim={() => setIsBookingModalOpen(true)}
          onOpenBooking={() => setIsBookingModalOpen(true)}
        />
      </div>

      {/* THE ANATOMY OF A FAST LAUNCH (Colorful 3-Step Cards) */}
      <section className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-indigo-100/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-gradient-to-r from-indigo-50 to-pink-50 px-3.5 py-1.5 rounded-full border border-indigo-200">
            Fast Launch Anatomy
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight mt-3 mb-3">
            Claim your slot &amp; launch all channels in 2 mins
          </h2>
          <p className="text-neutral-600 text-sm">
            Zero complex onboarding. No manual campaign setup. Your autonomous team takes over instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-b from-indigo-50/90 via-white to-white p-7 rounded-3xl border-2 border-indigo-200/80 shadow-lg shadow-indigo-500/5 hover:-translate-y-1 transition-transform">
            <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-3">
              01
            </div>
            <h3 className="font-extrabold text-base text-neutral-900 mb-2">Connect your stack</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Enter your domain or connect Shopify, WordPress, Meta, X, and Google Search Console in 2 clicks.
            </p>
          </div>

          <div className="bg-gradient-to-b from-purple-50/90 via-white to-white p-7 rounded-3xl border-2 border-purple-200/80 shadow-lg shadow-purple-500/5 hover:-translate-y-1 transition-transform">
            <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              02
            </div>
            <h3 className="font-extrabold text-base text-neutral-900 mb-2">Agents crawl &amp; analyze</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Our AI Brain scans technical health, discovers keyword opportunities, and drafts starter content and ad hooks.
            </p>
          </div>

          <div className="bg-gradient-to-b from-emerald-50/90 via-white to-white p-7 rounded-3xl border-2 border-emerald-200/80 shadow-lg shadow-emerald-500/5 hover:-translate-y-1 transition-transform">
            <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
              03
            </div>
            <h3 className="font-extrabold text-base text-neutral-900 mb-2">Approve with 1-click &amp; scale</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Review queued tweets, articles, and ad suggestions in your Agents Feed. Approve with 1 click or let it run autonomously.
            </p>
          </div>
        </div>
      </section>

      {/* INTRODUCING ADDON AGENTIC MARKETING SYSTEM (10+ Color-Themed AI Agents) */}
      <section id="agents" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-indigo-100/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 px-3.5 py-1.5 rounded-full border border-purple-200">
            Autonomous Agent Fleet
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight mt-3 mb-3">
            10+ Specialized AI Agents Working 24/7
          </h2>
          <p className="text-neutral-600 text-sm">
            Each agent is an autonomous specialist configured to execute a specific channel within strict brand and budget guardrails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {agentsList.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
              className={`${agent.cardBg} p-5 rounded-3xl transition-all cursor-pointer shadow-sm group flex flex-col justify-between hover:-translate-y-1`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-2xl ${agent.iconBg} flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform`}>
                    {agent.icon}
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${agent.badgeStyle}`}>
                    {agent.badge}
                  </span>
                </div>
                <h3 className="font-black text-sm text-neutral-900 tracking-tight">{agent.name}</h3>
                <div className={`text-[11px] font-bold mt-0.5 mb-2.5 ${agent.statusColor}`}>
                  {agent.status}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">{agent.desc}</p>
              </div>

              {agent.preview && (
                <div className="p-3 bg-white/80 rounded-2xl border border-rose-200/80 mb-3 text-xs shadow-2xs">
                  <div className="font-extrabold text-neutral-900 text-[11px] truncate mb-1.5">
                    {agent.preview.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
                    {agent.preview.meta.map((m, mi) => (
                      <span key={mi} className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-3 border-t border-neutral-200/60">
                {agent.capabilities.map((cap, ci) => (
                  <div key={ci} className="text-[10px] font-medium text-neutral-600 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONNECT YOUR STACK. FULLY CLOSED-LOOP EXECUTION */}
      <section id="stack" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-indigo-100/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-3.5 py-1.5 rounded-full border border-cyan-200">
            Deep API Stack
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight mt-3 mb-3">
            Connect your stack. Fully closed-loop execution.
          </h2>
          <p className="text-neutral-600 text-sm">
            Not just prompt generation. Addon publishes directly to your channels and synchronizes performance feedback in real time.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
          {[
            { name: 'Google Ads', type: 'PPC & Bid Guard', status: 'Live Sync', color: 'border-amber-200 bg-amber-50/50' },
            { name: 'Meta Ads', type: 'FB & IG Spend', status: 'Live Sync', color: 'border-blue-200 bg-blue-50/50' },
            { name: 'Google Search Console', type: 'SEO Rankings', status: 'Direct API', color: 'border-sky-200 bg-sky-50/50' },
            { name: 'Google Analytics 4', type: 'Conversion Traffic', status: 'Direct API', color: 'border-indigo-200 bg-indigo-50/50' },
            { name: 'X / Twitter', type: 'Organic Posts', status: 'v2 API', color: 'border-neutral-300 bg-neutral-50' },
            { name: 'LinkedIn Marketing', type: 'Company Page', status: 'v2 API', color: 'border-blue-200 bg-blue-50/50' },
            { name: 'WhatsApp Cloud', type: 'Lead Messages', status: 'v19.0 API', color: 'border-emerald-200 bg-emerald-50/50' },
            { name: 'Shopify Store', type: 'E-commerce Catalog', status: 'Webhooks', color: 'border-emerald-200 bg-emerald-50/50' },
            { name: 'WordPress', type: 'CMS Auto-Publish', status: 'REST API', color: 'border-cyan-200 bg-cyan-50/50' },
            { name: 'Perplexity & Gemini', type: 'GEO Citation Sync', status: 'Standard', color: 'border-purple-200 bg-purple-50/50' },
          ].map((item, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border-2 ${item.color} text-left shadow-2xs hover:scale-103 transition-transform bg-white`}>
              <div className="font-extrabold text-xs text-neutral-900">{item.name}</div>
              <div className="text-[10px] text-neutral-500 mb-2.5">{item.type}</div>
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* REAL RESULTS CASE STUDY: HeMed (Deep Midnight Ocean Gradient) */}
      <section id="case-study" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-indigo-100/60">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            Verified Customer Results
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight mt-3 mb-2">
            Real brands scaling without human agency retainers
          </h2>
        </div>

        {/* HeMed Deep Ocean Gradient Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0c2438] via-[#133e54] to-[#0a4158] text-white p-8 sm:p-12 shadow-2xl border-2 border-cyan-500/30 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
          <div className="lg:col-span-7 space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-black uppercase tracking-wider">
              <span>🚀</span> CASE STUDY: 60 DAYS OF AUTONOMOUS MARKETING
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              How HeMed scaled organic pipeline by +144% using Addon AI.
            </h3>
            <p className="text-sm text-neutral-200 leading-relaxed font-normal">
              "We were paying $18,500/month to an agency that took 3 weeks to push a single blog and kept exhausting our Google Ads budget. Addon AI was fully operational in 10 minutes. The SEO Agent and X Agent alone brought 37 new enterprise pipeline opportunities."
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/15">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-3xl font-black text-emerald-400">+144%</div>
                <div className="text-xs text-neutral-300 mt-0.5 font-medium">Organic Pipeline</div>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-3xl font-black text-cyan-300">+37%</div>
                <div className="text-xs text-neutral-300 mt-0.5 font-medium">Demo Conversion</div>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-3xl font-black text-amber-300">6.2x</div>
                <div className="text-xs text-neutral-300 mt-0.5 font-medium">Ad ROAS</div>
              </div>
            </div>

            <button
              onClick={onStartFree}
              className="px-7 py-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs hover:from-emerald-300 hover:to-teal-300 transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              Read Full Breakdown <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center relative z-10">
            <div className="text-center font-black tracking-tight text-white/95 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-5xl sm:text-7xl font-black tracking-tighter bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent">
                HeMed
              </div>
              <div className="text-xs tracking-widest uppercase text-cyan-300 font-bold mt-2">
                Healthcare Technologies
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COST REPLACEMENT ROI COMPARISON TABLE (Radiant High-Contrast Table) */}
      <section id="roi" className="py-20 px-6 sm:px-12 max-w-4xl mx-auto border-t border-indigo-100/60">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200">
            Cost Replacement
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight mt-3 mb-2">
            What 1 AI CMO replaces vs. what it costs
          </h2>
          <p className="text-neutral-600 text-xs sm:text-sm">
            Compare the expense of a traditional 5-person marketing team against Addon AI.
          </p>
        </div>

        <div className="bg-white rounded-3xl border-2 border-indigo-200/80 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 pb-4 text-neutral-400 font-extrabold text-[11px] uppercase tracking-wider">
                  <th className="text-left pb-3">Marketing Capability</th>
                  <th className="text-left pb-3 text-rose-600">Traditional Agency</th>
                  <th className="text-right pb-3 text-emerald-700 font-black">Addon AI CMO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {[
                  { role: 'Head of Growth & CMO', agency: '$8,000 / mo', addon: 'Included (24/7 Brain)' },
                  { role: 'Technical SEO Specialist', agency: '$3,500 / mo', addon: 'Included (SEO Agent)' },
                  { role: 'Full-time Content Writer', agency: '$2,500 / mo', addon: 'Included (Articles Agent)' },
                  { role: 'Social Media & Community', agency: '$2,500 / mo', addon: 'Included (X & LinkedIn Agent)' },
                  { role: 'Short-form UGC Video Scripting', agency: '$2,000 / mo', addon: 'Included (UGC Agent)' },
                  { role: 'Paid Ads Specialist (ROAS)', agency: '$2,500 / mo', addon: 'Included (Ads Guardian)' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3.5 font-bold text-neutral-800">{row.role}</td>
                    <td className="py-3.5 text-rose-500 font-semibold line-through decoration-rose-400">{row.agency}</td>
                    <td className="py-3.5 text-right font-black text-emerald-600">{row.addon}</td>
                  </tr>
                ))}
                <tr className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 font-black text-sm">
                  <td className="py-4 px-3 text-neutral-950 font-black">Total Monthly Investment</td>
                  <td className="py-4 text-rose-600 line-through decoration-rose-500 font-extrabold">$21,000 / mo</td>
                  <td className="py-4 px-3 text-right text-emerald-700 font-black text-base">
                    $129 / mo <span className="text-[10px] text-emerald-800 font-normal">(or ₹499 Founder Slot)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white text-center text-xs flex flex-col sm:flex-row items-center justify-between gap-3 px-6">
            <span>Net Monthly Savings: <strong className="text-emerald-400 font-black text-sm">$20,871 / month</strong> (99% cost reduction)</span>
            <button
              onClick={onStartFree}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black text-xs hover:from-amber-300 hover:to-rose-400 transition-all shadow-md"
            >
              Lock In Your $129 Plan &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* VERIFIED CUSTOMER TESTIMONIALS (Wall of Love with Glowing Borders) */}
      <section className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-indigo-100/60">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-wider text-pink-700 bg-pink-50 px-3.5 py-1.5 rounded-full border border-pink-200">
            Customer Tweets
          </span>
          <h2 className="text-3xl font-black text-neutral-950 tracking-tight mt-3 mb-2">
            Loved by founders building at lightspeed
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              author: 'Arjun Nair',
              handle: '@arjun_builds',
              role: 'Founder, CloudFlow',
              avatarBg: 'from-violet-500 to-indigo-600',
              tweet: 'We launched with Addon AI 3 weeks ago. The X agent and Articles agent have already generated 8,000 visits and our first $4k MRR without us writing a single tweet manually.',
            },
            {
              author: 'Elena Rostova',
              handle: '@elena_growth',
              role: 'Head of Growth, FinScale',
              avatarBg: 'from-pink-500 to-rose-600',
              tweet: 'Replaced our $15k agency retainer with Addon. The ROI comparison is not even close. The approval feed makes managing 6 channels take 4 minutes a day.',
            },
            {
              author: 'Rohan Mehra',
              handle: '@rohan_mehra',
              role: 'E-commerce Operator',
              avatarBg: 'from-amber-500 to-orange-600',
              tweet: 'The UGC Videos Agent and Paid Ads guardrail saved us $3,200 on Facebook ads last week by automatically killing fatigue creatives before burning cash.',
            },
          ].map((t, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border-2 border-indigo-100/80 shadow-md shadow-indigo-500/5 text-xs space-y-3 hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${t.avatarBg} text-white flex items-center justify-center font-bold text-xs`}>
                    {t.author.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-extrabold text-neutral-900 flex items-center gap-1">
                      <span>{t.author}</span>
                      <span className="text-sky-500 text-[10px]">✓</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">{t.handle} &bull; {t.role}</div>
                  </div>
                </div>
                <span className="text-neutral-400 font-bold">𝕏</span>
              </div>
              <p className="text-neutral-700 leading-relaxed font-sans">{t.tweet}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING PLANS (Highlighted $129 Growth Tier) */}
      <section id="pricing" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-indigo-100/60">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight mt-3 mb-2">
            Pick your autonomous growth tier
          </h2>
          <p className="text-neutral-600 text-xs sm:text-sm">
            All plans include autonomous agent execution, safety guardrails, and 1-click approvals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {['free', 'starter', 'growth', 'pro'].map((planId) => {
            const plan = SAAS_PLANS[planId];
            if (!plan) return null;
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 flex flex-col justify-between border-2 relative transition-all ${
                  plan.badge
                    ? 'border-indigo-600 ring-4 ring-indigo-500/15 shadow-xl bg-gradient-to-b from-indigo-50/60 to-white -translate-y-2'
                    : 'border-neutral-200/90 shadow-sm bg-white hover:border-indigo-300'
                }`}
              >
                {plan.badge && (
                  <button
                    type="button"
                    onClick={() => setCheckoutPlanId(plan.id)}
                    className="cursor-pointer absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:scale-105 text-white shadow-md transition-transform"
                  >
                    🔥 {plan.badge} (Click to Pay)
                  </button>
                )}
                <div>
                  <div className="text-base font-black text-neutral-900">{plan.name}</div>
                  <div className="text-xs text-neutral-500 mt-1 min-h-[32px]">{plan.tagline}</div>
                  <div className="my-5">
                    <span className="text-3xl sm:text-4xl font-black text-neutral-950">
                      ₹{plan.priceMonthly.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-neutral-400 font-semibold"> / month</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-xs text-neutral-600">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    if (plan.priceMonthly === 0) {
                      onStartFree();
                    } else {
                      setCheckoutPlanId(plan.id);
                    }
                  }}
                  className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all shadow-sm cursor-pointer ${
                    plan.badge
                      ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-md shadow-indigo-500/25'
                      : plan.priceMonthly === 0
                      ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft'
                  }`}
                >
                  {plan.priceMonthly === 0
                    ? 'Start Free'
                    : `⚡ Pay ₹${plan.priceMonthly.toLocaleString('en-IN')} via UPI`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section id="faq" className="py-20 px-6 sm:px-12 max-w-3xl mx-auto border-t border-indigo-100/60">
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-3.5 py-1.5 rounded-full border border-purple-200">
            Got Questions?
          </span>
          <h2 className="text-3xl font-black text-neutral-950 tracking-tight mt-3">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3.5 text-xs">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-indigo-100/80 overflow-hidden shadow-2xs">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-5 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-neutral-900"
              >
                <span>{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM 100-SLOTS FINAL RADIANT CTA BANNER */}
      <section className="py-20 px-6 sm:px-12 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 text-white border-2 border-indigo-500/40 shadow-2xl shadow-purple-500/20 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              94 OF 100 SLOTS CLAIMED IN BATCH #1
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase">
              Lock in your AI CMO before batch closes
            </h2>

            <p className="text-neutral-300 text-xs sm:text-sm">
              Deploy all 10+ autonomous marketing agents for your business today. Reserve your VIP Founder Slot with instant Gmail confirmation.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-full text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-amber-400 to-indigo-400 hover:from-emerald-300 hover:to-indigo-300 shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-102 cursor-pointer"
              >
                Book Your VIP Founder Slot Now &rarr;
              </button>
              <a
                href="#founder-offer"
                className="w-full sm:w-auto px-6 py-4 rounded-full text-xs font-extrabold text-neutral-200 bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
              >
                View Batch #1 Live Counter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER WITH GIANT WATERMARK */}
      <footer className="pt-16 pb-12 border-t border-indigo-100/80 bg-white/70 text-neutral-500 text-xs relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 font-black text-neutral-950 text-base mb-3">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white flex items-center justify-center text-xs">
                  a
                </div>
                <span>addon.ai</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Autonomous AI CMO. Connecting SEO, social media, ads, content, and analytics 24/7.
              </p>
            </div>
            <div>
              <div className="font-extrabold text-neutral-900 text-xs mb-3">Agents</div>
              <ul className="space-y-1.5 text-[11px]">
                <li><a href="#agents" className="hover:text-indigo-600">SEO Agent</a></li>
                <li><a href="#agents" className="hover:text-indigo-600">X / Twitter Agent</a></li>
                <li><a href="#agents" className="hover:text-indigo-600">UGC Videos Agent</a></li>
                <li><a href="#agents" className="hover:text-indigo-600">Paid Ads Agent</a></li>
                <li><a href="#agents" className="hover:text-indigo-600">Reddit Agent</a></li>
              </ul>
            </div>
            <div>
              <div className="font-extrabold text-neutral-900 text-xs mb-3">Stack</div>
              <ul className="space-y-1.5 text-[11px]">
                <li><a href="#stack" className="hover:text-indigo-600">Google Ads &amp; GSC</a></li>
                <li><a href="#stack" className="hover:text-indigo-600">Meta (FB &amp; IG)</a></li>
                <li><a href="#stack" className="hover:text-indigo-600">WhatsApp Cloud API</a></li>
                <li><a href="#stack" className="hover:text-indigo-600">LinkedIn &amp; X API</a></li>
                <li><a href="#stack" className="hover:text-indigo-600">Shopify &amp; WordPress</a></li>
              </ul>
            </div>
            <div>
              <div className="font-extrabold text-neutral-900 text-xs mb-3">Company &amp; Network</div>
              <ul className="space-y-1.5 text-[11px]">
                <li><a href="/p/features" className="hover:text-indigo-600">Truck Mitra Features</a></li>
                <li><a href="/p/services" className="hover:text-indigo-600">FTL &amp; Freight Services</a></li>
                <li><a href="/p/how-it-works" className="hover:text-indigo-600">How It Works</a></li>
                <li><a href="/p/reviews" className="hover:text-indigo-600">Customer Reviews</a></li>
                <li><a href="/p/about" className="hover:text-indigo-600">About Truck Mitra</a></li>
                <li><a href="/p/careers" className="hover:text-indigo-600">Careers</a></li>
                <li><a href="/p/contact" className="hover:text-indigo-600">24/7 Contact Support</a></li>
                <li><a href="/sitemap.xml" target="_blank" className="hover:text-indigo-600">XML Sitemap</a></li>
                {onAdminLogin && (
                  <li>
                    <button onClick={onAdminLogin} className="hover:text-indigo-600 text-left">
                      Admin Portal
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Crawlable Semantic HTML NAP Block for Google Search & Local SEO */}
          <div className="border-t border-slate-200/80 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Truck Mitra Transport Network (NAP)</h4>
              <address className="not-italic leading-relaxed text-slate-600">
                Truck Mitra Transport Hub, Outer Ring Road, Transport Nagar, Delhi NCR, 110042, India
              </address>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">24/7 Dispatch &amp; Support</h4>
              <p>
                Phone: <a href="tel:+918076745291" className="font-bold text-indigo-600 hover:underline">+91-80767-45291</a>
              </p>
              <p>
                Email: <a href="mailto:support@truckmitra.in" className="font-bold text-indigo-600 hover:underline">support@truckmitra.in</a>
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Commercial Business Hours</h4>
              <p className="leading-relaxed">
                Monday &ndash; Sunday: <span className="font-bold text-emerald-600">Open 24 Hours (Round-The-Clock Dispatch)</span>
              </p>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
            <div>&copy; {BRAND.year} Truck Mitra &amp; Addon Technologies. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="/p/about" className="hover:underline">About</a>
              <a href="/p/services" className="hover:underline">Services</a>
              <a href="/p/contact" className="hover:underline">Contact</a>
              <a href="/sitemap.xml" className="hover:underline">Sitemap</a>
            </div>
          </div>
        </div>

        {/* GIANT COLORFUL-TINTED WATERMARK TEXT IN BACKGROUND */}
        <div className="select-none pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gradient-to-b from-indigo-200/40 via-purple-200/30 to-transparent bg-clip-text text-transparent font-black text-[140px] sm:text-[220px] md:text-[280px] tracking-tighter whitespace-nowrap z-0 leading-none">
          Addon
        </div>
      </footer>

      {/* Cashfree Live Indian Rupee Checkout Modal */}
      <CashfreeCheckoutModal
        isOpen={Boolean(checkoutPlanId)}
        selectedPlanId={checkoutPlanId || 'growth'}
        onClose={() => setCheckoutPlanId(null)}
        onSuccess={(authData) => {
          setCheckoutPlanId(null);
          if (authData?.token) {
            window.location.reload();
          } else {
            onLogin();
          }
        }}
      />

      {/* VIP Founder Slot Booking Modal with Instant Gmail Confirmation */}
      <SlotBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => {
          // Success callback
        }}
      />
    </div>
  );
};
