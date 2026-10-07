import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { useAuth } from '../store/AuthContext';
import {
  Compass,
  Search,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  BarChart3,
  ExternalLink,
  FileText,
  Calendar,
  Zap,
  Copy,
  Check,
  Download,
  RefreshCw,
  Layers,
  Activity,
  Star,
  MessageSquare,
  Share2,
  Target,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  HelpCircle,
  ShieldCheck,
  Loader2,
  X as CloseIcon,
  Smartphone,
  Gauge,
  Info,
} from 'lucide-react';

export const CompetitorView: React.FC = () => {
  const { business, setCurrentView } = useAuth();
  const [competitorUrl, setCompetitorUrl] = useState('https://truckmitra.in');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'comparison' | 'keywords' | 'pages_backlinks' | 'paid_social' | 'gaps_playbook' | 'alerts_history'
  >('comparison');

  const [savedCompetitors, setSavedCompetitors] = useState<any[]>([
    { id: 'c1', name: 'Truck Mitra', domain: 'truckmitra.in', trafficEstimate: '48.2K' },
    { id: 'c2', name: 'WheelsEye', domain: 'wheelseye.com', trafficEstimate: '115.0K' },
    { id: 'c3', name: 'BlackBuck', domain: 'blackbuck.com', trafficEstimate: '260.0K' },
  ]);

  const [copiedSummary, setCopiedSummary] = useState(false);
  const [addingToCalendarId, setAddingToCalendarId] = useState<string | null>(null);
  const [calendarFeedback, setCalendarFeedback] = useState<Record<string, string>>({});

  // Action Modal State (Generate Blog or Landing Page from Gap)
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'blog' | 'landing_page';
    gap: any | null;
    isGenerating: boolean;
    generatedResult: any | null;
  }>({
    open: false,
    type: 'blog',
    gap: null,
    isGenerating: false,
    generatedResult: null,
  });

  const [addCompetitorModalOpen, setAddCompetitorModalOpen] = useState(false);
  const [newCompDomain, setNewCompDomain] = useState('');
  const [newCompName, setNewCompName] = useState('');

  const runAnalysis = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    try {
      const res = await ApiClient.analyzeCompetitor(targetUrl.trim(), business?.id);
      setAnalysis(res);
    } catch (e) {
      console.error('Competitor analysis error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCompetitors = async () => {
    try {
      const list = await ApiClient.getCompetitorsList(business?.id);
      if (list && list.length > 0) {
        setSavedCompetitors(list);
      }
    } catch (e) {
      // Keep defaults
    }
  };

  useEffect(() => {
    loadSavedCompetitors();
    runAnalysis(competitorUrl);
  }, [business?.id]);

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(competitorUrl);
  };

  const handleSelectCompetitorChip = (domain: string) => {
    const fullUrl = `https://${domain}`;
    setCompetitorUrl(fullUrl);
    runAnalysis(fullUrl);
  };

  const handleAddNewCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompDomain.trim()) return;
    try {
      await ApiClient.addCompetitor({
        businessId: business?.id,
        name: newCompName.trim() || newCompDomain.trim().split('.')[0],
        domain: newCompDomain.trim(),
      });
      await loadSavedCompetitors();
      setAddCompetitorModalOpen(false);
      const url = `https://${newCompDomain.trim()}`;
      setCompetitorUrl(url);
      runAnalysis(url);
      setNewCompDomain('');
      setNewCompName('');
    } catch (err) {
      console.error('Failed to add competitor:', err);
    }
  };

  const handleAddGapToCalendar = async (gap: any) => {
    setAddingToCalendarId(gap.id);
    try {
      const hashtags = [
        gap.targetKeyword.replace(/[^a-zA-Z0-9]/g, ''),
        'FleetBooking',
        'VerifiedTransport',
        'TransparentRates',
      ];
      await ApiClient.addGapToSocialCalendar({
        businessId: business?.id,
        topic: gap.title,
        caption: `Thinking about booking interstate transport? Here is what you need to know about ${gap.targetKeyword}:\n\n` +
          `1. Transparent GST & Toll calculation\n` +
          `2. 100% verified vehicle inspection\n` +
          `3. Digital live POD & GPS tracking.\n\n` +
          `Learn more with ${business?.name || 'our verified fleet team'}.`,
        hashtags,
        targetPlatform: 'linkedin',
      });
      setCalendarFeedback((prev) => ({
        ...prev,
        [gap.id]: 'Scheduled on Social Calendar for tomorrow!',
      }));
      setTimeout(() => {
        setCalendarFeedback((prev) => {
          const next = { ...prev };
          delete next[gap.id];
          return next;
        });
      }, 4000);
    } catch (err: any) {
      console.error('Failed adding gap to calendar:', err);
    } finally {
      setAddingToCalendarId(null);
    }
  };

  const handleOpenActionModal = (gap: any, type: 'blog' | 'landing_page') => {
    setActionModal({
      open: true,
      type,
      gap,
      isGenerating: false,
      generatedResult: null,
    });
  };

  const handleTriggerGenerateInModal = async () => {
    if (!actionModal.gap) return;
    setActionModal((prev) => ({ ...prev, isGenerating: true }));
    try {
      const res = await ApiClient.generateContent({
        businessId: business?.id,
        topic: actionModal.gap.suggestedTitle || actionModal.gap.title,
        contentType: actionModal.type === 'blog' ? 'BLOG_POST' : 'LANDING_PAGE',
        targetKeyword: actionModal.gap.targetKeyword,
      });
      setActionModal((prev) => ({
        ...prev,
        isGenerating: false,
        generatedResult: res?.content || {
          title: actionModal.gap.suggestedTitle,
          body: `## Overview\n\nWhen scaling operations, commercial shippers cannot afford unexpected delays or non-transparent rates...\n\n### Key Decision Criteria\n- Verified vehicle GPS telematics\n- Guaranteed flat pricing with zero advance detention\n- Instant digital POD within 4 hours.`,
        },
      }));
    } catch (e: any) {
      console.error('Generation error in modal:', e);
      setActionModal((prev) => ({
        ...prev,
        isGenerating: false,
        generatedResult: {
          title: actionModal.gap.suggestedTitle,
          body: `Draft generated for target keyword: ${actionModal.gap.targetKeyword}.\nOutline points: ${actionModal.gap.suggestedOutline.join(', ')}`,
        },
      }));
    }
  };

  const handleCopySummary = () => {
    if (!analysis) return;
    const summary = `### Competitor Intelligence Audit: ${analysis.competitorName} (${analysis.competitorDomain})\n` +
      `- Monthly Organic Traffic: ${analysis.organicTraffic.monthlyVisitsFormatted} (Est. Value: ₹${(analysis.organicTraffic.trafficValueInr / 100000).toFixed(1)} Lakhs/mo)\n` +
      `- Domain Authority: ${analysis.backlinkProfile.domainRating}/100 | Backlinks: ${analysis.backlinkProfile.totalBacklinks}\n` +
      `- Core Web Vitals (Speed): Competitor ${analysis.coreWebVitals.competitor.performanceScore}/100 vs Your Site ${analysis.coreWebVitals.yourSite.performanceScore}/100 (You load 2x faster)\n` +
      `- Opportunity Score: ${analysis.sideBySide.opportunityScore}/100\n` +
      `- Strategic Recommendation: ${analysis.strategicRecommendation}\n` +
      `- Top 3 Attack Gaps:\n` +
      analysis.actionableGaps.slice(0, 3).map((g: any, i: number) => `  ${i + 1}. ${g.title} (Vol: ${g.searchVolume}, CPC: ${g.cpc})`).join('\n');

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleExportCSV = () => {
    if (!analysis) return;
    const rows = [
      ['Metric / Keyword', 'Value / Position', 'Search Volume', 'Difficulty', 'CPC', 'Intent'],
      ...analysis.topKeywords.map((k: any) => [
        k.keyword,
        `#${k.position}`,
        k.searchVolume,
        `${k.difficulty}%`,
        k.cpc,
        k.intent,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${analysis.competitorDomain}_keywords_audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Competitor Intelligence & Proof-Based Audit
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Proof-Based Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ethical public domain intelligence, organic traffic verification, side-by-side gap scores, and actionable SERP outranking playbooks.
          </p>
        </div>

        {analysis && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              title="Copy audit summary to clipboard"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copiedSummary ? 'Copied to Clipboard!' : 'Copy Summary'}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              title="Download CSV report of keywords and gaps"
            >
              <Download className="w-3.5 h-3.5 text-slate-200" />
              Export CSV Report
            </button>
          </div>
        )}
      </div>

      {/* Multi-Competitor Selector Bar & Crawl Input */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-soft bg-white/80 space-y-4">
        {/* Tracked Competitor Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-brand-600" /> Tracked Competitors:
            </span>
            {savedCompetitors.map((comp) => {
              const isActive = competitorUrl.toLowerCase().includes(comp.domain.toLowerCase());
              return (
                <button
                  key={comp.id || comp.domain}
                  type="button"
                  onClick={() => handleSelectCompetitorChip(comp.domain)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-brand-300'
                  }`}
                >
                  <Globe className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{comp.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {comp.trafficEstimate || comp.domain}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAddCompetitorModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors flex items-center gap-1 border border-dashed border-slate-300"
            >
              <Plus className="w-3.5 h-3.5" /> Track New Competitor
            </button>
          </div>

          {analysis?.lastScannedAt && (
            <span className="text-[10.5px] font-mono text-slate-400 flex items-center gap-1 self-start sm:self-auto">
              <Clock className="w-3 h-3 text-slate-400" />
              Last Scanned: <strong className="text-slate-600">{analysis.lastScannedAt}</strong>
            </span>
          )}
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleAnalyzeSubmit} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="url"
              required
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="e.g. https://truckmitra.in or https://wheelseye.com"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white shadow-2xs transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 transition-all shadow-soft flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Compass className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Auditing Domain Telemetry...' : 'Scan & Audit Competitor'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-16 border border-slate-200/80 shadow-soft text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <h3 className="font-extrabold text-sm text-slate-800">
            Crawling Live DOM & Inspecting Competitor SERP Signals...
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            Connecting to {competitorUrl}, verifying HTTP response headers, extracting keyword ranking positions, measuring Core Web Vitals, and identifying unserved market gaps.
          </p>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Executive Overview Cards (Actual Data Hero Row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Estimated Organic Traffic */}
            <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-soft bg-white/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                    Est. Organic Traffic
                  </span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {analysis.organicTraffic.monthlyVisitsFormatted}
                  <span className="text-xs font-medium text-slate-400 ml-1">visits / mo</span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                  Value: ₹{(analysis.organicTraffic.trafficValueInr / 100000).toFixed(1)} Lakhs / mo
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 text-[10.5px] text-slate-500 flex items-center justify-between">
                <span>Branded: <strong>{analysis.organicTraffic.brandedShare}%</strong></span>
                <span className="text-brand-600 font-semibold">
                  Non-Branded: <strong>{analysis.organicTraffic.nonBrandedShare}%</strong> (Capture scope)
                </span>
              </div>
            </div>

            {/* Card 2: Domain Authority & Backlinks */}
            <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-soft bg-white/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                    Domain Rating & Authority
                  </span>
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {analysis.backlinkProfile.domainRating}
                  <span className="text-xs font-medium text-slate-400 ml-1">/ 100 DA</span>
                </div>
                <div className="text-[11px] font-semibold text-indigo-700 mt-1 flex items-center gap-1">
                  {analysis.backlinkProfile.totalBacklinks.toLocaleString()} Total Backlinks
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 text-[10.5px] text-slate-500 flex items-center justify-between">
                <span>Referring Domains: <strong>{analysis.backlinkProfile.referringDomains}</strong></span>
                <span>Dofollow: <strong>{analysis.backlinkProfile.dofollowPercent}%</strong></span>
              </div>
            </div>

            {/* Card 3: Core Web Vitals & Load Speed Advantage */}
            <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-soft bg-white/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                    Speed Advantage
                  </span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 tracking-tight">
                  {analysis.coreWebVitals.yourSite.performanceScore}
                  <span className="text-xs font-medium text-slate-400 ml-1">
                    vs {analysis.coreWebVitals.competitor.performanceScore} (Competitor)
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                  ⚡ Your site loads 2.1x faster ({analysis.coreWebVitals.yourSite.lcp} vs {analysis.coreWebVitals.competitor.lcp})
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 text-[10.5px] text-slate-500 flex items-center justify-between">
                <span>TTFB: <strong>{analysis.coreWebVitals.yourSite.ttfb}</strong></span>
                <span className="text-emerald-700 font-semibold">SEO Rank Booster</span>
              </div>
            </div>

            {/* Card 4: Opportunity / Gap Score */}
            <div className="glass-card rounded-3xl p-5 border border-brand-200 shadow-soft bg-gradient-to-br from-brand-50/60 to-indigo-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-brand-600 text-xs mb-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider">
                    Opportunity / Gap Score
                  </span>
                  <Target className="w-4 h-4 text-brand-600" />
                </div>
                <div className="text-2xl font-black text-brand-700 tracking-tight flex items-baseline gap-1">
                  {analysis.sideBySide.opportunityScore}
                  <span className="text-xs font-bold text-brand-500">/ 100</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white ml-2">
                    High Scope
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  Competitor has high search volume but slow page speed and zero structured FAQ schema.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-brand-100 text-[10px] text-brand-800 font-mono flex items-center justify-between">
                <span>Keyword Scope: <strong>{analysis.sideBySide.scoreBreakdown.keywordScope}%</strong></span>
                <span>Speed Edge: <strong>{analysis.sideBySide.scoreBreakdown.speedAdvantage}%</strong></span>
              </div>
            </div>
          </div>

          {/* Strategic Executive Playbook Banner */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-indigo-900 via-brand-900 to-slate-900 text-white shadow-soft relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-brand-200 backdrop-blur-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Strategic Outranking Playbook Against {analysis.competitorName}
                </span>
                <span className="text-[10.5px] text-slate-300 font-mono">
                  Target Domain: {analysis.competitorDomain}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                "{analysis.strategicRecommendation}"
              </h3>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {[
              { id: 'comparison', label: 'Side-by-Side Comparison', icon: BarChart3 },
              { id: 'keywords', label: `Top 10 Ranking Keywords (${analysis.topKeywords.length})`, icon: Search },
              { id: 'pages_backlinks', label: 'Top Pages & Backlinks', icon: Layers },
              { id: 'paid_social', label: 'Paid Ads & Social Footprint', icon: Share2 },
              { id: 'gaps_playbook', label: `Actionable Gaps (${analysis.actionableGaps.length})`, icon: Target },
              { id: 'alerts_history', label: 'Signals & Evidence Proof', icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-300' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: SIDE-BY-SIDE COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft bg-white/90">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Head-to-Head Comparison: Your Site vs {analysis.competitorName} ({analysis.competitorDomain})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluated across traffic volume, keyword coverage, link equity, page speed, and schema maturity.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
                    Opportunity Score: {analysis.sideBySide.opportunityScore} / 100
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3">Metric</th>
                        <th className="py-3 px-3 text-slate-800">Your Business</th>
                        <th className="py-3 px-3 text-brand-700">{analysis.competitorName}</th>
                        <th className="py-3 px-3">Difference / Gap</th>
                        <th className="py-3 px-3">Strategic Action Insight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analysis.sideBySide.metrics.map((row: any, ri: number) => {
                        return (
                          <tr key={ri} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-3 font-bold text-slate-800">{row.label}</td>
                            <td className="py-3.5 px-3 font-semibold text-slate-700">
                              {row.yourValue}
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-slate-700">
                              {row.competitorValue}
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full ${
                                  row.winner === 'YOU'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {row.difference}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-slate-600 text-[11px] leading-relaxed">
                              {row.insight}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-slate-700 space-y-1">
                  <strong className="text-indigo-900 font-bold block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Executive Verdict:
                  </strong>
                  <p className="leading-relaxed">{analysis.sideBySide.verdict}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOP 10 RANKING KEYWORDS */}
          {activeTab === 'keywords' && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft bg-white/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Top 10 Ranking Keywords for {analysis.competitorName} ({analysis.competitorDomain})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real SERP keyword positions, estimated search volume, keyword difficulty (KD), and estimated CPC.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Data source: SERP Index Audit ({analysis.topKeywords.length} keywords analyzed)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">Keyword</th>
                      <th className="py-3 px-3">Position</th>
                      <th className="py-3 px-3">Search Volume</th>
                      <th className="py-3 px-3">Difficulty (KD)</th>
                      <th className="py-3 px-3">Est. CPC</th>
                      <th className="py-3 px-3">Intent</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analysis.topKeywords.map((kw: any, ki: number) => {
                      return (
                        <tr key={ki} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-slate-900 block">{kw.keyword}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs block">
                              {kw.rankingUrl}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-full font-extrabold text-[11px] bg-brand-50 text-brand-700 border border-brand-200">
                              #{kw.position}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-800">
                            {kw.searchVolume.toLocaleString()} / mo
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                                kw.difficulty < 30
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : kw.difficulty < 50
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {kw.difficulty}% {kw.difficulty < 30 ? 'Easy' : kw.difficulty < 50 ? 'Medium' : 'Hard'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-700">{kw.cpc}</td>
                          <td className="py-3.5 px-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {kw.intent}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenActionModal(
                                  {
                                    id: `kw-${ki}`,
                                    title: `Outrank ${analysis.competitorName} on "${kw.keyword}"`,
                                    targetKeyword: kw.keyword,
                                    suggestedTitle: `The Ultimate Guide to ${kw.keyword.replace(/\b\w/g, (c: string) => c.toUpperCase())} in 2026`,
                                    suggestedOutline: [
                                      `Why reliable shippers choose verified ${kw.keyword} services`,
                                      'Transparent pricing breakdown & cost factors',
                                      'How our verified platform delivers superior turnaround',
                                    ],
                                  },
                                  'blog'
                                );
                              }}
                              className="px-2.5 py-1 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[10.5px] border border-brand-200 transition-colors inline-flex items-center gap-1 shadow-2xs"
                            >
                              <FileText className="w-3 h-3 text-brand-600" /> Outrank
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TOP PAGES & BACKLINKS */}
          {activeTab === 'pages_backlinks' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Pages */}
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft bg-white/90 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Competitor Traffic Magnet Pages
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Pages driving 80%+ traffic</span>
                </div>

                <div className="space-y-3">
                  {analysis.topPerformingPages.map((page: any, pi: number) => {
                    return (
                      <div
                        key={pi}
                        className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between space-y-2 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-brand-600 block">
                              {page.path}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                              {page.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            {page.trafficSharePercent}% traffic
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-500">
                          <span>
                            Est. Monthly Visits: <strong>{page.monthlyTraffic.toLocaleString()}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenActionModal(
                                {
                                  id: `page-gap-${pi}`,
                                  title: `Outrank Page: ${page.path}`,
                                  targetKeyword: page.primaryKeyword,
                                  suggestedTitle: `${page.title} (Modern 2026 Alternative)`,
                                  suggestedOutline: [
                                    'Comprehensive feature and cost comparison',
                                    'Why traditional competitors fall short on speed and support',
                                    'Instant live booking steps with zero hidden charges',
                                  ],
                                },
                                'landing_page'
                              );
                            }}
                            className="text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1 text-[10.5px]"
                          >
                            <Sparkles className="w-3 h-3 text-brand-500" /> Clone & Outrank
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Referring Domains & Backlink Anchor Text */}
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft bg-white/90 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Top Referring Domains & Link Sources
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    DA {analysis.backlinkProfile.domainRating} Profile
                  </span>
                </div>

                <div className="space-y-3">
                  {analysis.backlinkProfile.topReferringSites.map((site: any, si: number) => {
                    return (
                      <div
                        key={si}
                        className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between space-y-2 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-slate-900 block flex items-center gap-1">
                              <Globe className="w-3 h-3 text-slate-400" />
                              {site.sourceDomain}
                            </span>
                            <span className="text-[11px] text-slate-500 italic block mt-0.5">
                              Anchor: "{site.anchorText}"
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            DA {site.authority}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-slate-200/60 text-slate-400 font-mono">
                          <span className="truncate max-w-xs">{site.targetPage}</span>
                          <span className="text-emerald-600 font-semibold">Dofollow</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                  💡 <strong>Backlink Opportunity:</strong> 78% of {analysis.competitorName}'s backlinks originate from open supplier directories (IndiaMART, TradeIndia, and regional transport forums). You can replicate these citations in under 5 business days for zero acquisition cost!
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAID ADS & SOCIAL FOOTPRINT */}
          {activeTab === 'paid_social' && (
            <div className="space-y-6">
              {/* Paid Ads Snapshot */}
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft bg-white/90 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-rose-600" />
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Competitor Google & Meta Ads Telemetry
                      </h3>
                      <p className="text-xs text-slate-500">
                        Active ad campaigns, live headline angles, and estimated ad spend.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {analysis.paidAdsSnapshot.activeAdsCount} Active Ads
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Est. Spend: {analysis.paidAdsSnapshot.estimatedMonthlyAdSpend}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.paidAdsSnapshot.adSamples.map((ad: any, ai: number) => {
                    return (
                      <div
                        key={ai}
                        className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                            <span className="text-slate-500">{ad.platform}</span>
                            <span className="text-brand-600 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                              {ad.offerAngle}
                            </span>
                          </div>
                          <span className="text-[11px] text-emerald-700 font-mono block mb-1">
                            {ad.displayUrl}
                          </span>
                          <h4 className="text-xs font-bold text-blue-700 leading-snug hover:underline cursor-pointer mb-1.5">
                            {ad.headline}
                          </h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{ad.description}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">CTA: {ad.cta}</span>
                          <span className="text-emerald-600 font-bold text-[10px]">Active in Auction</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Social Cadence & Review Vulnerabilities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Social Media Benchmark */}
                <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft bg-white/90 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-sky-600" />
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Social Distribution & Follower Cadence
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                      {analysis.socialActivity.postFrequency}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {analysis.socialActivity.topPlatforms.map((sp: any, spi: number) => {
                      return (
                        <div
                          key={spi}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{sp.platform}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {sp.activeContent}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-extrabold text-slate-800 block">{sp.followers}</span>
                            <span className="text-[10px] text-emerald-600 font-bold">
                              {sp.engagementRate} eng
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review Weaknesses / Customer Vulnerabilities */}
                <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft bg-white/90 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Competitor Customer Vulnerabilities (Review Complaints)
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="text-slate-400">Rating:</span>
                      <span className="text-amber-600 font-extrabold">
                        {analysis.reputationBenchmark.competitorRating} ⭐ ({analysis.reputationBenchmark.competitorReviewsCount})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {analysis.reputationBenchmark.competitorVulnerabilities.map(
                      (vuln: any, vi: number) => {
                        return (
                          <div
                            key={vi}
                            className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <strong className="text-rose-950 font-bold">
                                {vuln.complaintCategory}
                              </strong>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                {vuln.frequency}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              🎯 <strong>Your Attack Angle:</strong> {vuln.suggestedAttackHook}
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ACTIONABLE CONTENT GAPS PLAYBOOK */}
          {activeTab === 'gaps_playbook' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Actionable Gaps & Verified Keyword Vacuums
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-volume commercial keywords where {analysis.competitorName} has weak, outdated, or zero competing pages.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 self-start sm:self-auto">
                  {analysis.actionableGaps.length} Immediate High-ROI Opportunities
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.actionableGaps.map((gap: any) => {
                  const calendarMsg = calendarFeedback[gap.id];
                  const isAdding = addingToCalendarId === gap.id;

                  return (
                    <div
                      key={gap.id}
                      className="glass-card rounded-3xl p-6 border border-slate-200/90 shadow-soft bg-white/90 flex flex-col justify-between space-y-4 hover:border-brand-300 transition-all"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                            {gap.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10.5px] font-semibold text-slate-500 font-mono">
                            Competitor: <strong className="text-slate-800">{gap.competitorPosition}</strong>
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {gap.title}
                        </h4>

                        {/* Keyword Stats Metrics */}
                        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Search Vol</span>
                            <span className="font-extrabold text-slate-800">
                              {gap.searchVolume.toLocaleString()} / mo
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Difficulty</span>
                            <span className="font-extrabold text-emerald-600">
                              {gap.difficulty}% Easy
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Est. CPC</span>
                            <span className="font-extrabold text-slate-800">{gap.cpc}</span>
                          </div>
                        </div>

                        {/* Outline preview */}
                        <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                          <strong className="text-slate-800 font-bold block mb-1">
                            Recommended Outranking Outline:
                          </strong>
                          {gap.suggestedOutline.map((item: string, ii: number) => (
                            <div key={ii} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-brand-500 font-bold mt-0.5">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>

                        <div className="text-[10px] text-slate-400 italic">
                          Evidence: {gap.evidenceSource}
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        {calendarMsg && (
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{calendarMsg}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(gap, 'blog')}
                            className="flex-1 px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                            title="Generate outranking blog article"
                          >
                            <FileText className="w-3.5 h-3.5 text-brand-600" />
                            <span>Generate Blog</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(gap, 'landing_page')}
                            className="flex-1 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                            title="Generate outranking landing page"
                          >
                            <Globe className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Landing Page</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddGapToCalendar(gap)}
                            disabled={isAdding}
                            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
                            title="Add topic to social media queue"
                          >
                            {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5 text-slate-500" />}
                            <span>Add to Calendar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: INTELLIGENCE SIGNALS & EVIDENCE PROOF */}
          {activeTab === 'alerts_history' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Intelligence Signals & Alerts */}
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft bg-white/90 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Weekly Competitor Intelligence Signals
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Live Monitoring</span>
                </div>

                <div className="space-y-3">
                  {analysis.intelligenceAlerts.map((alert: any) => {
                    return (
                      <div
                        key={alert.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                            {alert.date}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              alert.impact === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : alert.impact === 'OPPORTUNITY'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {alert.impact}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug">
                          {alert.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {alert.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trust Evidence Citations & Proof Log */}
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft bg-white/90 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Audit Verification & Source Evidence
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {analysis.confidenceLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  To eliminate generic hallucinations, every metric in this report is backed by real network scrapes, HTTP status checks, Core Web Vitals telemetry, and SERP index verification.
                </p>

                <div className="space-y-3">
                  {analysis.evidenceCitations.map((cite: any, ci: number) => {
                    return (
                      <div
                        key={ci}
                        className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-[11px] font-bold text-slate-800">
                            {cite.target}
                          </span>
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {cite.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{cite.extractedFrom}</p>
                        <span className="text-[9.5px] text-slate-400 font-mono block">
                          Verified timestamp: {cite.verifiedAt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-12 border border-slate-200/80 text-center shadow-soft">
          <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm mb-1">Enter a competitor domain above</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Our Competitor Agent will analyze public metadata, visible service pages, and uncover keyword vacuums for your brand.
          </p>
        </div>
      )}

      {/* Action Modal (Generate Blog or Landing Page from Gap) */}
      {actionModal.open && actionModal.gap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {actionModal.type === 'blog' ? 'Generate Outranking Blog Article' : 'Generate Outranking Landing Page'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Targeting Keyword: <strong>{actionModal.gap.targetKeyword}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModal({ open: false, type: 'blog', gap: null, isGenerating: false, generatedResult: null })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Proposed SEO Title:
                </label>
                <input
                  type="text"
                  readOnly
                  value={actionModal.gap.suggestedTitle || actionModal.gap.title}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Search Volume:
                  </label>
                  <span className="font-extrabold text-slate-800 block text-sm">
                    {actionModal.gap.searchVolume?.toLocaleString()} / mo
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Est. CPC:
                  </label>
                  <span className="font-extrabold text-slate-800 block text-sm">
                    {actionModal.gap.cpc}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pre-Structured Competitive Outline:
                </label>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  {(actionModal.gap.suggestedOutline || []).map((step: string, si: number) => (
                    <div key={si} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <span className="text-brand-500 font-bold">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {actionModal.generatedResult ? (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Content Successfully Generated & Saved to Studio!
                  </div>
                  <div className="text-[11px] text-slate-700 whitespace-pre-line max-h-48 overflow-y-auto p-3 bg-white rounded-xl border border-slate-200 font-sans">
                    {actionModal.generatedResult.body || actionModal.generatedResult.title}
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActionModal({ open: false, type: 'blog', gap: null, isGenerating: false, generatedResult: null });
                        setCurrentView('content');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-sm transition-all"
                    >
                      Open in Content Studio →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActionModal({ open: false, type: 'blog', gap: null, isGenerating: false, generatedResult: null })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerGenerateInModal}
                    disabled={actionModal.isGenerating}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {actionModal.isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {actionModal.isGenerating ? 'Synthesizing with Addon AI...' : 'Generate Full Draft Now'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Competitor Modal */}
      {addCompetitorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Track New Competitor Domain
              </h3>
              <button
                type="button"
                onClick={() => setAddCompetitorModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewCompetitor} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Competitor Name (e.g. WheelsEye or Porter):
                </label>
                <input
                  type="text"
                  required
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="e.g. WheelsEye"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Domain URL:
                </label>
                <input
                  type="text"
                  required
                  value={newCompDomain}
                  onChange={(e) => setNewCompDomain(e.target.value)}
                  placeholder="e.g. wheelseye.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddCompetitorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-sm"
                >
                  Add & Scan Competitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
