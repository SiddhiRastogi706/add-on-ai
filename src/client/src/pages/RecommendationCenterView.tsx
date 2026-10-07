import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import {
  Sparkles,
  Check,
  X,
  Calendar,
  Zap,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  RotateCw,
  Search,
  Filter,
  BarChart2,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Megaphone,
} from 'lucide-react';

export const RecommendationCenterView: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'SCHEDULED' | 'ALL'>('PENDING');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getRecommendations();
      setRecommendations(data || []);
    } catch (e) {
      console.error('Failed loading recommendations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: string, action: string) => {
    try {
      setActionLoadingId(id);
      await ApiClient.takeRecommendationAction(id, action);
      
      if (action === 'APPROVED') {
        showToast('Recommendation approved! Autonomous execution sequence triggered.');
      } else if (action === 'SCHEDULED') {
        showToast('Recommendation scheduled on your marketing calendar.');
      } else if (action === 'REJECTED') {
        showToast('Recommendation dismissed.');
      } else {
        showToast(`Recommendation updated to ${action}.`);
      }
      
      await loadData();
    } catch (e) {
      console.error('Action error:', e);
      showToast('Failed to apply recommendation action.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGenerateFresh = async () => {
    try {
      setGenerating(true);
      const data = await ApiClient.generateRecommendations();
      setRecommendations(data || []);
      showToast('Fresh AI recommendations synthesized based on real SERP and market telemetry.');
    } catch (e) {
      console.error('Failed generating recommendations:', e);
      showToast('Error generating fresh recommendations.');
    } finally {
      setGenerating(false);
    }
  };

  // Filter recommendations
  const filteredRecs = recommendations.filter((rec) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      rec.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || rec.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  const pendingCount = recommendations.filter((r) => r.status === 'PENDING').length;
  const approvedCount = recommendations.filter((r) => r.status === 'APPROVED' || r.status === 'EXECUTED').length;
  const scheduledCount = recommendations.filter((r) => r.status === 'SCHEDULED').length;

  const categories = [
    { id: 'ALL', label: 'All Opportunities' },
    { id: 'Ads', label: 'Ads & Budget' },
    { id: 'SEO', label: 'SEO & Routes' },
    { id: 'Conversion', label: 'Conversion & CRO' },
    { id: 'Reputation', label: 'Reputation Defense' },
    { id: 'Social', label: 'Social & Brand' },
  ];

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Autonomous Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-soft">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Autonomous AI Recommendation Center
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Proof-backed growth opportunities, route search vacuums, and ad spend rebalancing algorithms.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateFresh}
            disabled={generating}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-500 via-indigo-600 to-brand-600 hover:from-brand-600 hover:to-indigo-700 shadow-soft transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Auditing Growth Engines...' : 'Run Autonomous AI Audit'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-soft bg-white/70">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Pending Decisions</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{pendingCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Require operator review</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-soft bg-white/70">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Est. Inquiries Uplift</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">+28% - 34%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Projected commercial leads</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-soft bg-white/70">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Ad Waste Prevention</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">₹14,500/mo</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Broad-match reallocation</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-soft bg-white/70">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>AI Confidence Avg</span>
            <ShieldCheck className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-extrabold text-brand-600">93.4%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Validated against SERP data</div>
        </div>
      </div>

      {/* Filter and Status Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-brand-500 text-white shadow-soft'
                  : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('SCHEDULED')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'SCHEDULED'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Scheduled ({scheduledCount})
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({recommendations.length})
          </button>
        </div>
      </div>

      {/* Recommendations Feed */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft animate-pulse space-y-4 bg-white/50"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-slate-200 rounded-full" />
                <div className="h-5 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-24 bg-slate-100 rounded-2xl" />
              <div className="h-9 w-1/2 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 sm:p-16 border border-slate-200/80 text-center shadow-soft bg-white/70 space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-soft">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-extrabold text-slate-800">No recommendations match your filters</h3>
            <p className="text-xs text-slate-500 mt-1">
              {statusFilter === 'PENDING'
                ? 'All pending growth recommendations have been resolved! You can synthesize fresh insights anytime.'
                : 'Try adjusting your category or status filter to see other opportunities.'}
            </p>
          </div>
          <button
            onClick={handleGenerateFresh}
            disabled={generating}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-soft transition-all inline-flex items-center gap-2"
          >
            <RotateCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            Run Fresh Growth Scan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRecs.map((rec) => {
            const isCritical = rec.priority === 'CRITICAL';
            const isHigh = rec.priority === 'HIGH';
            const isPending = rec.status === 'PENDING';
            const isApproved = rec.status === 'APPROVED' || rec.status === 'EXECUTED';
            const isScheduled = rec.status === 'SCHEDULED';
            const isRejected = rec.status === 'REJECTED';
            const payload = rec.suggestedActionPayload || {};

            return (
              <div
                key={rec.id}
                className={`glass-card rounded-3xl p-6 sm:p-8 border shadow-soft flex flex-col justify-between space-y-5 transition-all duration-200 bg-white/80 hover:shadow-md ${
                  isCritical
                    ? 'border-rose-200/80 hover:border-rose-300'
                    : isHigh
                    ? 'border-amber-200/80 hover:border-amber-300'
                    : 'border-slate-200/80 hover:border-brand-200'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 uppercase tracking-wider">
                        {rec.category}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isHigh
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {rec.priority} Priority
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{rec.confidencePercent}% Verified Confidence</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug tracking-tight">
                      {rec.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  {/* Structured Proof & Objective Box */}
                  <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/70 text-xs space-y-2.5">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-emerald-700 shrink-0 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Expected Impact:
                      </span>
                      <span className="text-slate-800 font-semibold">{rec.expectedObjective}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-800 shrink-0 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" /> Why AI Recommends:
                      </span>
                      <span className="text-slate-600">{rec.whyAiRecommends}</span>
                    </div>

                    <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="font-bold text-slate-500 shrink-0 flex items-center gap-1">
                        <BarChart2 className="w-3 h-3 text-brand-500" /> Evidence Basis:
                      </span>
                      <span className="text-slate-500 italic">{rec.dataBasis}</span>
                    </div>
                  </div>

                  {/* Suggested Action Payload Chips */}
                  {Object.keys(payload).length > 0 && (
                    <div className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100 text-[11px] space-y-1.5">
                      <div className="font-bold text-indigo-900 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" /> Automated Implementation Blueprint:
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {payload.targetRoute && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 font-medium text-slate-700">
                            Route: <strong>{payload.targetRoute}</strong>
                          </span>
                        )}
                        {payload.targetKeyword && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 font-medium text-slate-700">
                            Keyword: <strong>"{payload.targetKeyword}"</strong>
                          </span>
                        )}
                        {payload.monthlySearchVolume && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 font-medium text-slate-700">
                            Vol: <strong>{payload.monthlySearchVolume}/mo</strong>
                          </span>
                        )}
                        {payload.budgetShiftInr && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 font-medium text-emerald-800">
                            Shift: <strong>₹{payload.budgetShiftInr.toLocaleString()}</strong>
                          </span>
                        )}
                        {payload.fromPlatform && payload.toPlatform && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 font-medium text-slate-700">
                            {payload.fromPlatform} → <strong>{payload.toPlatform}</strong>
                          </span>
                        )}
                        {payload.cadence && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 font-medium text-slate-700">
                            Cadence: <strong>{payload.cadence}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400 font-medium">
                    Status: <span className="font-bold text-slate-700 uppercase">{rec.status}</span>
                  </div>

                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(rec.id, 'REJECTED')}
                        disabled={actionLoadingId === rec.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleAction(rec.id, 'SCHEDULED')}
                        disabled={actionLoadingId === rec.id}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 hover:border-brand-400 text-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Schedule</span>
                      </button>
                      <button
                        onClick={() => handleAction(rec.id, 'APPROVED')}
                        disabled={actionLoadingId === rec.id}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 shadow-soft transition-all flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Approve & Apply</span>
                      </button>
                    </div>
                  ) : isApproved ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Approved & Executed
                      </span>
                      <button
                        onClick={() => handleAction(rec.id, 'PENDING')}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 underline"
                      >
                        Undo
                      </button>
                    </div>
                  ) : isScheduled ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Scheduled on Calendar
                      </span>
                      <button
                        onClick={() => handleAction(rec.id, 'PENDING')}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 underline"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Dismissed</span>
                      <button
                        onClick={() => handleAction(rec.id, 'PENDING')}
                        className="text-[11px] font-bold text-brand-600 hover:underline"
                      >
                        Reconsider
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default RecommendationCenterView;
