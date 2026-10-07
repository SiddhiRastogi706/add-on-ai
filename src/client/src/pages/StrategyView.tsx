import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { BrainCircuit, Sparkles, Target, Shield, CheckCircle2, RefreshCw, Zap, Users, Volume2 } from 'lucide-react';

export const StrategyView: React.FC = () => {
  const { business } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await ApiClient.getActiveBusiness();
      if (res?.business?.profileAI) {
        const raw = res.business.profileAI;
        setProfile({
          ...raw,
          usps: JSON.parse(raw.uspsJson || '[]'),
          customerPains: JSON.parse(raw.customerPainsJson || '[]'),
          coreOfferings: JSON.parse(raw.offeringsJson || '[]'),
          detectedBrandVoice: JSON.parse(raw.detectedVoiceJson || '{}'),
          idealCustomerProfiles: JSON.parse(raw.idealPersonasJson || '[]'),
          growthTactics: JSON.parse(raw.growthTacticsJson || '[]'),
        });
      }
    } catch (e) {
      console.error('Failed loading profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await ApiClient.triggerBrainSync();
      setTimeout(async () => {
        await loadProfile();
        setSyncing(false);
      }, 2000);
    } catch {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Strategy & Brand Intelligence</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-brand-700 border border-brand-200">
              Living Model
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Synthesized by the Business Intelligence Agent from website crawling and verified customer responses.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 transition-all shadow-soft flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Recalibrating Strategy...' : 'Re-Calibrate Intelligence'}
        </button>
      </div>

      {/* Positioning Statement Hero */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-blush-500/10 border border-brand-200 shadow-soft">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600 mb-2">
          Strategic Market Positioning
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
          "{profile?.positioningStatement || 'Empowering enterprises with autonomous 24/7 digital growth and workflow scale.'}"
        </h2>
        <p className="text-xs text-slate-600 mt-3 max-w-3xl leading-relaxed">
          {profile?.summary || 'Market intelligence model calibrated to capture high-intent commercial demand.'}
        </p>
      </div>

      {/* Grid: USPs & Customer Pains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core USPs */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Unique Selling Propositions (USPs)</h3>
          </div>
          <div className="space-y-2.5">
            {(profile?.usps || [
              '24/7 autonomous marketing execution without agency overhead',
              'Data-driven keyword clustering and predictive ad optimization',
              'Built-in compliance and budget emergency safety guardrails',
              'Sub-second workflow synchronization and reporting',
            ]).map((usp: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-white/70 p-3 rounded-2xl border border-slate-200/70">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{usp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Pains */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Target Customer Pain Points</h3>
          </div>
          <div className="space-y-2.5">
            {(profile?.customerPains || [
              'High customer acquisition costs across standard paid channels',
              'Inconsistent content publishing due to manual time bottlenecks',
              'Lack of technical SEO visibility and slow organic lead pipeline',
              'Engineering teams bogged down maintaining custom glue code',
            ]).map((pain: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-white/70 p-3 rounded-2xl border border-slate-200/70">
                <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
                <span>{pain}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ideal Customer Personas & Detected Voice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Detected Voice */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-brand-600 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Detected Brand Voice</h3>
          </div>
          <div className="text-xs font-bold text-slate-800 mb-1">
            {profile?.detectedBrandVoice?.tone || 'Authoritative & Modern'}
          </div>
          <p className="text-[11px] text-slate-500 mb-4">
            {profile?.detectedBrandVoice?.sentiment || 'Confident, data-driven and empowering.'}
          </p>
          <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-2">High-Resonance Keywords</div>
          <div className="flex flex-wrap gap-1.5">
            {(profile?.detectedBrandVoice?.keywords || ['Scale', 'Precision', 'Velocity', 'Automation', 'Enterprise']).map(
              (kw: string, ki: number) => (
                <span key={ki} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-brand-700 border border-brand-200">
                  #{kw}
                </span>
              )
            )}
          </div>
        </div>

        {/* Growth Tactics (2 cols) */}
        <div className="md:col-span-2 glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Priority AI Growth Playbook</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(profile?.growthTactics || [
              'Target high-intent transactional search queries with localized SEO landing pages',
              'Deploy weekly educational carousel breakdowns on LinkedIn & Instagram',
              'Run precision Google Search Ads with automated negative keyword filtering',
            ]).map((tactic: string, ti: number) => (
              <div key={ti} className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/70 text-xs">
                <div className="font-bold text-brand-600 text-sm mb-1">0{ti + 1}</div>
                <p className="text-slate-700 leading-relaxed">{tactic}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
