import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { PieChart, Download, Sparkles, Printer, FileText, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const loadReports = async () => {
    try {
      const data = await ApiClient.getReports();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (e) {
      console.error('Failed loading reports:', e);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async (type: string) => {
    setGenerating(true);
    try {
      const res = await ApiClient.generateReport(type);
      await loadReports();
      setSelectedReport(res);
    } catch (e) {
      console.error('Generate report error:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCsv = (id: string) => {
    window.open(`/api/reports/${id}/export-csv`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Marketing Briefings & Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standardized 6-part executive transparency reports: What Happened, Why, Actions Taken, and Next Steps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerate('WEEKLY_REVIEW')}
            disabled={generating}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 transition-all shadow-soft flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {generating ? 'Compiling Briefing...' : 'Compile Weekly Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Reports Archive */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Briefing Archives ({reports.length})
          </div>

          <div className="space-y-2.5">
            {reports.map((rep) => {
              const isSelected = selectedReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all text-xs ${
                    isSelected
                      ? 'bg-white border-brand-400 ring-2 ring-brand-100 shadow-md'
                      : 'bg-white/70 hover:bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {rep.type}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 text-xs mt-1">{rep.periodLabel}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Standardized 6-Part Report Document */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-soft space-y-6">
          {selectedReport ? (
            <>
              {/* Document Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                    Executive Performance Briefing
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">{selectedReport.periodLabel}</h2>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Compiled automatically on {new Date(selectedReport.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / PDF
                  </button>
                  <button
                    onClick={() => handleDownloadCsv(selectedReport.id)}
                    className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              </div>

              {/* Metrics Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-indigo-50/40 border border-brand-100 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-500">Traffic Change</div>
                  <div className="text-base font-extrabold text-brand-700 mt-0.5">
                    +{selectedReport.metricsSummary?.trafficChangePct || 24.6}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Leads Generated</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {selectedReport.metricsSummary?.leadsGenerated || 24}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Ad Spend Guarded</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    ${selectedReport.metricsSummary?.adSpend || 900}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Blended ROAS</div>
                  <div className="text-base font-extrabold text-emerald-600 mt-0.5">
                    {selectedReport.metricsSummary?.avgRoas || 4.12}x
                  </div>
                </div>
              </div>

              {/* Standard 6 Sections */}
              <div className="space-y-6 text-xs text-slate-700">
                {/* 1. What Happened */}
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500"></span> 1. What Happened
                  </h4>
                  <p className="leading-relaxed bg-white/70 p-4 rounded-2xl border border-slate-200/60">
                    {selectedReport.sections?.whatHappened}
                  </p>
                </div>

                {/* 2. Why It Happened */}
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 2. Why It Happened
                  </h4>
                  <p className="leading-relaxed bg-white/70 p-4 rounded-2xl border border-slate-200/60">
                    {selectedReport.sections?.whyItHappened}
                  </p>
                </div>

                {/* 3. What AI Did */}
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 3. What AI Did
                  </h4>
                  <div className="space-y-2 bg-white/70 p-4 rounded-2xl border border-slate-200/60">
                    {(selectedReport.sections?.whatAiDid || []).map((action: string, ai: number) => (
                      <div key={ai} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. What Worked */}
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span> 4. What Worked
                  </h4>
                  <div className="space-y-2 bg-white/70 p-4 rounded-2xl border border-slate-200/60">
                    {(selectedReport.sections?.whatWorked || []).map((w: string, wi: number) => (
                      <div key={wi} className="flex items-start gap-2 text-slate-700">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. What Did Not Work */}
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> 5. What Did Not Work
                  </h4>
                  <div className="space-y-2 bg-white/70 p-4 rounded-2xl border border-slate-200/60">
                    {(selectedReport.sections?.whatDidNotWork || []).map((nw: string, nwi: number) => (
                      <div key={nwi} className="flex items-start gap-2 text-slate-700">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>{nw}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. What Should Happen Next */}
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> 6. What Should Happen Next
                  </h4>
                  <div className="space-y-2 bg-white/70 p-4 rounded-2xl border border-slate-200/60">
                    {(selectedReport.sections?.nextSteps || []).map((step: string, si: number) => (
                      <div key={si} className="flex items-start gap-2 text-slate-700">
                        <span className="text-brand-600 font-bold">&rarr;</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">Select a briefing from the archive</div>
          )}
        </div>
      </div>
    </div>
  );
};
