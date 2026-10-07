import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import {
  CheckSquare,
  AlertTriangle,
  ShieldCheck,
  Check,
  X,
  Clock,
  ArrowRight,
  ShieldAlert,
  RotateCw,
  Layers,
  Sparkles,
  Zap,
  Info,
  History,
  TrendingDown,
  DollarSign,
  FileCode,
  MessageSquare,
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getApprovals();
      setApprovals(data || []);
    } catch (e) {
      console.error('Failed loading approvals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleResolve = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      setActionLoadingId(id);
      await ApiClient.resolveApproval(id, action);
      if (action === 'APPROVED') {
        showToast('Safety gate approved. Autonomous agent will execute proposed changes.');
      } else {
        showToast('Proposed modification rejected. Existing configuration preserved.');
      }
      await loadApprovals();
    } catch (e) {
      console.error('Resolve error:', e);
      showToast('Error recording approval decision.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSimulate = async () => {
    try {
      setGenerating(true);
      const data = await ApiClient.generateApprovals();
      setApprovals(data || []);
      showToast('Safety gate audit triggered: new review items loaded.');
    } catch (e) {
      console.error('Generate approvals error:', e);
      showToast('Error running safety audit.');
    } finally {
      setGenerating(false);
    }
  };

  const pendingItems = approvals.filter((a) => a.status === 'PENDING');
  const pastItems = approvals.filter((a) => a.status !== 'PENDING');

  const filteredPending = pendingItems.filter((item) => {
    if (categoryFilter === 'ALL') return true;
    return item.category === categoryFilter;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BUDGET_CHANGE':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      case 'WEBSITE_CODE_CHANGE':
        return <FileCode className="w-4 h-4 text-indigo-600" />;
      case 'SENSITIVE_CONTENT':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-soft">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Needs Your Approval Center
                </h1>
                {pendingItems.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                    {pendingItems.length} Decision{pendingItems.length > 1 ? 's' : ''} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Human-in-the-Loop Safeguards: Budget reallocations &gt;20%, live ad launches, and sensitive customer communications require explicit operator sign-off.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulate}
            disabled={generating}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:border-brand-400 shadow-soft transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Simulating Safety Audit...' : 'Run Safety Audit'}</span>
          </button>
        </div>
      </div>

      {/* KPI Safeguard Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-soft bg-white/70">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Pending Safety Reviews</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{pendingItems.length}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Awaiting human sign-off</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-soft bg-white/70">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Budget Cap Protection</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">Active (100%)</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Zero unvetted spend leakage</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-soft bg-white/70">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Past Decisions Recorded</span>
            <History className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{pastItems.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Audit log preserved</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-soft bg-white/70">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Autonomous Safety Tier</span>
            <Sparkles className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-extrabold text-brand-600">Strict Guardian</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Policy enforcement active</div>
        </div>
      </div>

      {/* Tabs and Categories */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Main Tab */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'PENDING'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-rose-500" />
            <span>Pending Decisions ({pendingItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'HISTORY'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span>Decision History ({pastItems.length})</span>
          </button>
        </div>

        {/* Category Filter for Pending items */}
        {activeTab === 'PENDING' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['ALL', 'BUDGET_CHANGE', 'SENSITIVE_CONTENT', 'WEBSITE_CODE_CHANGE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/80'
                }`}
              >
                {cat === 'ALL'
                  ? 'All Categories'
                  : cat === 'BUDGET_CHANGE'
                  ? 'Budget Shifts'
                  : cat === 'SENSITIVE_CONTENT'
                  ? 'Outreach Templates'
                  : 'Site Code & SEO'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft animate-pulse space-y-4 bg-white/50"
            >
              <div className="h-5 w-48 bg-slate-200 rounded-full" />
              <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-20 bg-slate-100 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : activeTab === 'PENDING' ? (
        <div className="space-y-4">
          {filteredPending.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 sm:p-16 border border-slate-200/80 text-center shadow-soft bg-white/70 space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-soft">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-extrabold text-slate-800">
                  All Guardrails Clear! Zero Pending Safety Approvals
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  All autonomous agents are operating strictly within your defined spend limits and communication rules.
                </p>
              </div>
              <button
                onClick={handleSimulate}
                disabled={generating}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:border-brand-400 shadow-soft transition-all inline-flex items-center gap-2"
              >
                <RotateCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                Simulate Review Scenarios
              </button>
            </div>
          ) : (
            filteredPending.map((item) => {
              const isHigh = item.riskLevel === 'HIGH';
              const isMedium = item.riskLevel === 'MEDIUM';
              const details = item.details || {};

              return (
                <div
                  key={item.id}
                  className={`glass-card rounded-3xl p-6 sm:p-8 border shadow-soft bg-white/80 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md ${
                    isHigh
                      ? 'border-rose-200/90 bg-gradient-to-r from-white via-rose-50/15 to-white'
                      : isMedium
                      ? 'border-amber-200/90 bg-gradient-to-r from-white via-amber-50/15 to-white'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="space-y-3.5 max-w-3xl">
                    {/* Badge Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isMedium
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isHigh ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        ) : isMedium ? (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>{item.riskLevel} Risk Action</span>
                      </span>

                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1 border border-slate-200">
                        {getCategoryIcon(item.category)}
                        <span>{item.category.replace(/_/g, ' ')}</span>
                      </span>

                      <span className="text-[10px] font-semibold text-slate-500">
                        Requested by <strong>{item.requestedByAgent}</strong>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Proposed Changes Summary Box */}
                    <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 text-xs space-y-2 shadow-sm">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <Zap className="w-3.5 h-3.5 text-brand-500" />
                        <span>Proposed Modifications:</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-mono text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        {item.proposedChangesSummary}
                      </p>

                      {/* Detail Payload Specs */}
                      {Object.keys(details).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                          {details.currentSpend && details.proposedSpend && (
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/50">
                              <span className="font-bold text-slate-700">Spend Delta:</span>{' '}
                              <span className="text-slate-600">
                                {details.currentSpend.meta || details.currentSpend.google} →{' '}
                                <strong className="text-brand-600">
                                  {details.proposedSpend.meta || details.proposedSpend.google}
                                </strong>
                              </span>
                            </div>
                          )}
                          {details.projectedImpact && (
                            <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/50 text-emerald-800">
                              <span className="font-bold">Projected Impact:</span> {details.projectedImpact}
                            </div>
                          )}
                          {details.targetUrl && (
                            <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-200/50 text-indigo-800">
                              <span className="font-bold">New URL:</span> {details.targetUrl}
                            </div>
                          )}
                          {details.safetyFilters && (
                            <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200/50 text-amber-800">
                              <span className="font-bold">Guardrail:</span> {details.safetyFilters}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approve / Reject Buttons */}
                  <div className="flex items-center gap-3 shrink-0 self-end lg:self-center pt-2 lg:pt-0">
                    <button
                      onClick={() => handleResolve(item.id, 'REJECTED')}
                      disabled={actionLoadingId === item.id}
                      className="px-5 py-2.5 rounded-2xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleResolve(item.id, 'APPROVED')}
                      disabled={actionLoadingId === item.id}
                      className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-soft transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Execute</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Resolved History Tab */
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft bg-white/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>Safety Decision & Audit Trail</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              {pastItems.length} Logged Decisions
            </span>
          </div>

          {pastItems.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No historical decisions recorded yet. Once you approve or reject items, they will appear here with full timestamps.
            </div>
          ) : (
            <div className="space-y-3">
              {pastItems.map((item) => {
                const isApproved = item.status === 'APPROVED';
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">{item.title}</span>
                      </div>
                      <p className="text-slate-500 text-xs line-clamp-1">{item.proposedChangesSummary}</p>
                      <div className="text-[11px] text-slate-400">
                        Requested by <strong>{item.requestedByAgent}</strong> • Decided on{' '}
                        {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString() : 'Recently'}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={() => handleResolve(item.id, isApproved ? 'REJECTED' : 'APPROVED')}
                        className="text-[11px] font-semibold text-slate-500 hover:text-brand-600 underline"
                      >
                        Change to {isApproved ? 'Reject' : 'Approve'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ApprovalsView;
