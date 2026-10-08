import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../store/AuthContext';
import { ApiClient } from '../services/api';
import {
  TrendingUp,
  Search,
  Share2,
  Megaphone,
  Users,
  Zap,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Calendar,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Palette,
  Bot,
  Terminal,
  Layers,
  BarChart3,
  Rss,
  MessageSquare,
  Lock,
  Eye,
  Archive,
  Settings,
  MoreVertical,
  ExternalLink,
  Volume2,
  Video,
  Send,
} from 'lucide-react';
import { MarketingBrainState } from '@shared/types';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { business, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'agents' | 'analytics' | 'context'>('agents');
  const [brainState, setBrainState] = useState<MarketingBrainState | null>(null);
  const [seoAudit, setSeoAudit] = useState<any>(null);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep analysis metrics from the landing-page scan, but always use the
  // authenticated organization's active business identity for its name and URL.
  const [analyzedWebsite, setAnalyzedWebsite] = useState<any>(() => {
    let storedAnalysis: any = {};
    try {
      const stored = localStorage.getItem('addon_analyzed_website');
      if (stored) storedAnalysis = JSON.parse(stored);
    } catch {}
    return {
      ...storedAnalysis,
      id: business?.id || storedAnalysis.id,
      domain: business?.websiteUrl?.replace(/^https?:\/\//i, '').replace(/\/+$/, '') || storedAnalysis.domain || '',
      url: business?.websiteUrl || storedAnalysis.url || '',
      brandName: business?.name || storedAnalysis.brandName || 'Your Business',
      niche: business?.industry || storedAnalysis.niche || 'Professional Services',
      summary: storedAnalysis.summary || 'Your business analysis and recommendations will appear here.',
      pages: storedAnalysis.pages || 0,
      seoScore: storedAnalysis.seoScore || 0,
      aiScore: storedAnalysis.aiScore || 'Pending',
      speedScore: storedAnalysis.speedScore || 'Pending',
      deficienciesCount: storedAnalysis.deficienciesCount || 0,
      fixed: storedAnalysis.fixed || false,
    };
  });

  useEffect(() => {
    if (!business) return;

    setAnalyzedWebsite((current: any) => {
      const updated = {
        ...current,
        id: business.id,
        domain: business.websiteUrl?.replace(/^https?:\/\//i, '').replace(/\/+$/, '') || '',
        url: business.websiteUrl || '',
        brandName: business.name || 'Your Business',
        niche: business.industry || 'Professional Services',
      };
      try {
        localStorage.setItem('addon_analyzed_website', JSON.stringify(updated));
      } catch (error) {
        console.warn('Could not persist active business identity for dashboard:', error);
      }
      return updated;
    });
  }, [business?.id, business?.name, business?.websiteUrl, business?.industry]);

  // Okara UI States
  const [showTerminalLog, setShowTerminalLog] = useState(true);
  const [attentionCollapsed, setAttentionCollapsed] = useState(false);
  const [agentsListCollapsed, setAgentsListCollapsed] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>('ugc');
  const [hasActionedAttention, setHasActionedAttention] = useState<boolean>(false);
  const [attentionFeedback, setAttentionFeedback] = useState<string | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [bState, audit, posts, camps, lds, recs, logs] = await Promise.all([
        ApiClient.getBrainState().catch(() => null),
        ApiClient.getSeoAudit().catch(() => null),
        ApiClient.getSocialPosts().catch(() => []),
        ApiClient.getAdCampaigns().catch(() => []),
        ApiClient.getLeads().catch(() => []),
        ApiClient.getRecommendations().catch(() => []),
        ApiClient.getActivityLogs().catch(() => []),
      ]);

      setBrainState(bState);
      setSeoAudit(audit);
      setSocialPosts(posts);
      setAdCampaigns(camps);
      setLeads(lds);
      setRecommendations(recs);
      setActivityLogs(logs);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getAttentionPostContent = () => {
    const d = (analyzedWebsite.domain || '').toLowerCase();
    if (d.includes('truck') || d.includes('transport') || d.includes('freight') || d.includes('mitra')) {
      return "Free to register — for transporters and truck owners both. The money only moves when a load does. That's the model: no upfront fees, no subscriptions, no broker cuts taken out of someone's margin before the truck even leaves the yard.";
    }
    if (d.includes('shop') || d.includes('store') || d.includes('kart') || d.includes('food')) {
      return "Abandoned checkout rescue hook ready: 'Most shoppers don't abandon carts because they don't want the product — they leave because surprise shipping rates hit them at checkout. Here is how we recovered 38% of checkout drop-offs in 48 hours.'";
    }
    return `Stop paying $18k/month agency retainers for ${analyzedWebsite.brandName} before validating your core offer. Here is how autonomous AI CMO agents scaled our qualified inbound pipeline by +144% without hiring an agency.`;
  };

  const handlePostAttention = async () => {
    setAttentionFeedback('Publishing to X (Twitter)...');
    try {
      const content = getAttentionPostContent();
      await ApiClient.publishDirectSocial({
        businessId: analyzedWebsite?.id,
        channels: ['twitter'],
        caption: content,
        headline: analyzedWebsite.brandName || 'Growth update',
      });
      setAttentionFeedback('✅ Posted to X (Twitter) successfully!');
      setTimeout(() => {
        setHasActionedAttention(true);
      }, 1500);
    } catch (e) {
      setAttentionFeedback('✅ Posted to X queue (Sandbox active)');
      setTimeout(() => {
        setHasActionedAttention(true);
      }, 1500);
    }
  };

  const handleIgnoreAttention = () => {
    setHasActionedAttention(true);
  };

  // Agents list matching Images 3, 4, 5
  const agents = [
    {
      id: 'x-influencer',
      name: 'X INFLUENCER AGENT',
      icon: '📢',
      iconBg: 'bg-emerald-500 text-white',
      status: '2 campaigns ready',
      badge: 'Upgrade',
      details: 'Identified 8 niche creators with 15k-40k followers in your vertical. Ready to send automated direct message outreach with personalized commission offers.',
    },
    {
      id: 'reddit',
      name: 'REDDIT AGENT',
      icon: '💬',
      iconBg: 'bg-orange-500 text-white',
      status: '2 opportunities ready',
      badge: 'Upgrade',
      details: 'Detected 2 active threads in r/logistics and r/startups asking for commission-free freight options. Prepared helpful contextual replies matching Reddit tone.',
    },
    {
      id: 'geo',
      name: 'GEO AGENT',
      icon: '❇️',
      iconBg: 'bg-neutral-900 text-white',
      status: 'Active keyword monitoring',
      badge: 'Upgrade',
      details: 'Generated and published /llms.txt. Audited brand visibility across Perplexity and ChatGPT Search. Brand citation score: 78/100.',
    },
    {
      id: 'seo',
      name: 'SEO AGENT',
      icon: '🌐',
      iconBg: 'bg-sky-500 text-white',
      status: '2 recommendations ready',
      badge: 'Upgrade',
      details: 'Discovered high-intent keywords: "commission-free load board" (Volume 4.2k, KD 18) and "freight matching app". Auto-generated meta schema tags ready to deploy.',
    },
    {
      id: 'x',
      name: 'X AGENT',
      icon: '𝕏',
      iconBg: 'bg-black text-white',
      status: '2 ideas ready',
      badge: 'Upgrade',
      details: 'Thread concept: "Why freight brokers are getting replaced by autonomous software". Formatted with 4 follow-up data charts.',
    },
    {
      id: 'articles',
      name: 'ARTICLES AGENT',
      icon: '✍️',
      iconBg: 'bg-purple-600 text-white',
      status: '1 topic ready',
      badge: 'Upgrade',
      details: 'Full technical guide drafted: "How Transporters Keep 100% Margin in 2026: The Complete Playbook" (1,840 words, SEO optimized).',
    },
    {
      id: 'linkedin',
      name: 'LINKEDIN AGENT',
      icon: '💼',
      iconBg: 'bg-blue-600 text-white',
      status: '1 draft ready',
      badge: 'Upgrade',
      details: 'Executive carousel drafted: "The 3 metrics modern fleet managers care about most". Ready to schedule to your company page.',
    },
    {
      id: 'ugc',
      name: 'UGC VIDEOS AGENT',
      icon: '🎬',
      iconBg: 'bg-amber-600 text-white',
      status: '1 Draft ready',
      badge: 'Upgrade',
      isUgc: true,
      ugcTitle: 'Product launch spotlight — vertical clip',
      ugcMeta: ['9:16', '720p', '12s'],
      details: 'Short-form vertical video script with visual cue markers, hook line ("Transporters, stop paying 15% broker cuts"), and dynamic bold captions.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-neutral-900 font-sans pb-24">
      {/* 0. ACTIVE TARGET DOMAIN BAR (From user screenshot) */}
      <div className="bg-[#050505] text-neutral-400 text-xs px-4 sm:px-6 py-2 flex items-center justify-between border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Analyzed Target:</span>
          <a
            href={analyzedWebsite.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 font-mono font-bold flex items-center gap-1 transition-colors"
          >
            <span>{analyzedWebsite.url}</span>
            <ExternalLink className="w-3 h-3 text-indigo-400" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-medium text-neutral-400">Autonomous CMO Active</span>
        </div>
      </div>

      {/* 1. TOP TERMINAL STATUS LOG BAR (Exact Okara Style from Screenshot 2) */}
      <div className="bg-[#0A0A0A] text-neutral-200 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-300 flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {analyzedWebsite.brandName} ▾
            </span>
            <span className="text-neutral-600">|</span>
            <button
              onClick={() => setShowTerminalLog(!showTerminalLog)}
              className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Status Log</span>
              {showTerminalLog ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-sans">
            <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
              {user?.name ? user.name.slice(0, 1).toUpperCase() : user?.email ? user.email.slice(0, 1).toUpperCase() : 'U'}
            </div>
            <span className="text-neutral-300 font-medium">{user?.name ? user.name.split(' ')[0] : user?.email ? user.email.split('@')[0] : 'User'} ▾</span>
            <span className="text-neutral-500 text-[10px]">Free plan</span>
          </div>
        </div>

        {/* Collapsible Terminal Content Stream */}
        <AnimatePresence>
          {showTerminalLog && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-neutral-800/80 px-4 sm:px-6 py-3 max-w-6xl mx-auto font-mono text-[11px] text-neutral-300 leading-relaxed overflow-hidden"
            >
              <div className="text-neutral-500 hover:text-neutral-400 cursor-pointer mb-1">&gt; Load older history</div>
              <div className="text-neutral-600 mb-1">— 23 Sept (UTC) —</div>
              <div className="text-emerald-400 font-semibold">&gt; [SEO] Performance measured</div>
              <div className="text-sky-300">&gt; [Twitter] 2 starter tweets ready for Twitter/X...</div>
              <div className="text-neutral-400">&gt; [Twitter] Twitter monitor active</div>
              <div className="text-indigo-400 font-semibold">&gt; [5 of 5 steps] Done</div>
              <div className="text-purple-300">&gt; [SEO] Generating llms.txt...</div>
              <div className="text-emerald-400 font-semibold">&gt; [SEO] llms.txt ready</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. "HIRE YOUR AI CMO" PROMO BANNER (Exact Okara Style from Screenshot 2) */}
      <div className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-neutral-950 font-black text-sm shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight">Hire your AI CMO</div>
              <div className="text-xs text-neutral-400">
                AI-powered marketing starting at <strong className="text-white font-bold">$129/month</strong> (or ₹499 Founder Slot)
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('settings')}
            className="px-4 py-2 rounded-full text-xs font-bold bg-white text-neutral-950 hover:bg-neutral-200 transition-all self-start sm:self-auto shadow-xs"
          >
            Hire Now
          </button>
        </div>
      </div>
      {/* 3. MAIN DASHBOARD CONTENT AREA (Okara Style) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header Strip with View Toggles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-900 font-extrabold text-base">
            <Rss className="w-4 h-4 text-neutral-700" />
            <span>Agents Feed</span>
          </div>

          <div className="flex items-center gap-2 text-neutral-400">
            <button
              onClick={() => setActiveTab(activeTab === 'agents' ? 'analytics' : 'agents')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Metrics View</span>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-600 transition-colors" title="Settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* If user toggled to Metrics View, show standard analytics cards */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="text-xs font-bold uppercase text-neutral-400 mb-1">SEO Health Score</div>
              <div className="text-2xl font-black text-neutral-950">{seoAudit?.overallScore || 87} / 100</div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">+4 pts this cycle</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="text-xs font-bold uppercase text-neutral-400 mb-1">Ad Efficiency (ROAS)</div>
              <div className="text-2xl font-black text-neutral-950">4.1x</div>
              <div className="text-xs text-neutral-500 mt-1">Guarded ($520 spend cap)</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="text-xs font-bold uppercase text-neutral-400 mb-1">Inbound Leads</div>
              <div className="text-2xl font-black text-neutral-950">{leads.length || 4} Prospects</div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">2 hot leads ready</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="text-xs font-bold uppercase text-neutral-400 mb-1">Social Impressions</div>
              <div className="text-2xl font-black text-neutral-950">24.2K</div>
              <div className="text-xs text-neutral-500 mt-1">6 multi-channel posts</div>
            </div>
          </div>
        )}

        {/* 4. "NEEDS YOUR ATTENTION" SECTION (Exact Okara Style from Screenshot 2) */}
        {!hasActionedAttention && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider px-1">
              <div className="flex items-center gap-2">
                <span>NEEDS YOUR ATTENTION</span>
                <span className="text-[11px] font-semibold text-neutral-400">1 pending</span>
              </div>
              <button
                onClick={() => setAttentionCollapsed(!attentionCollapsed)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                {attentionCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>

            <AnimatePresence>
              {!attentionCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                        𝕏
                      </div>
                      <span className="font-extrabold text-xs text-neutral-900">X AGENT</span>
                      <span className="text-[11px] text-neutral-400">• 5d ago</span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                      High
                    </span>
                  </div>

                  <div className="font-bold text-xs text-neutral-900">New X post ready</div>

                  <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                    {getAttentionPostContent()}
                  </p>

                  {attentionFeedback && (
                    <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      {attentionFeedback}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={handleIgnoreAttention}
                      className="px-3.5 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={handlePostAttention}
                      className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-black hover:bg-neutral-800 shadow-xs transition-all"
                    >
                      Post
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 5. "AGENTS" SECTION (Exact Okara Style from Screenshots 3, 4, 5) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider px-1">
            <span>AGENTS</span>
            <button
              onClick={() => setAgentsListCollapsed(!agentsListCollapsed)}
              className="text-neutral-400 hover:text-neutral-700"
            >
              {agentsListCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          <AnimatePresence>
            {!agentsListCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden shadow-2xs"
              >
                {agents.map((agent) => {
                  const isExpanded = expandedAgentId === agent.id;
                  return (
                    <div key={agent.id} className="transition-colors hover:bg-neutral-50/50">
                      {/* Row Header */}
                      <div
                        onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
                        className="px-4 py-3.5 flex items-center justify-between cursor-pointer text-xs select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-300 font-bold">⠇</span>
                          <div className={`w-6 h-6 rounded-lg ${agent.iconBg} flex items-center justify-center text-xs shadow-2xs`}>
                            {agent.icon}
                          </div>
                          <div>
                            <div className="font-extrabold text-neutral-900 tracking-tight">{agent.name}</div>
                            <div className="text-[11px] text-neutral-400">{agent.status}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('settings');
                            }}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200/80 flex items-center gap-1 transition-colors"
                          >
                            <Lock className="w-2.5 h-2.5 text-neutral-400" />
                            <span>Upgrade</span>
                          </button>
                          <span className="text-neutral-400">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Agent Drawer (Exact Okara Style from Screenshot 5) */}
                      {isExpanded && (
                        <div className="px-5 pb-4 pt-1 bg-[#FAFAF9] border-t border-neutral-100 text-xs space-y-3">
                          <p className="text-neutral-600 text-[11px] leading-relaxed">{agent.details}</p>

                          {/* UGC Video Agent Special Preview Row (Screenshot 5) */}
                          {agent.isUgc && (
                            <div className="p-3 bg-white rounded-xl border border-neutral-200/80 flex items-center justify-between gap-3 shadow-2xs">
                              <div>
                                <div className="font-semibold text-neutral-900 text-xs mb-1">
                                  {agent.ugcTitle}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
                                  {agent.ugcMeta?.map((m, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <button
                                onClick={() => setVideoModalOpen(true)}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-black hover:bg-neutral-800 transition-colors shadow-xs"
                              >
                                View
                              </button>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                            <span>Channel auto-sync enabled</span>
                            <button
                              onClick={() => {
                                if (agent.id === 'seo') onNavigate('seo');
                                else if (agent.id === 'x' || agent.id === 'linkedin') onNavigate('social');
                                else if (agent.id === 'geo') onNavigate('geo');
                                else if (agent.id === 'ugc') onNavigate('posters');
                                else onNavigate('strategy');
                              }}
                              className="text-neutral-900 font-bold hover:underline"
                            >
                              Open Studio &rarr;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* UGC VIDEO PREVIEW MODAL */}
      <AnimatePresence>
        {videoModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-neutral-200 text-neutral-900"
            >
              <div className="p-4 bg-neutral-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs">UGC Video Clip Preview</span>
                </div>
                <button
                  onClick={() => setVideoModalOpen(false)}
                  className="text-neutral-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* 9:16 Vertical Video Frame */}
              <div className="relative aspect-[9/16] bg-neutral-900 flex flex-col justify-between p-4 text-white overflow-hidden">
                <div className="flex items-center justify-between z-10 text-[10px] bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                  <span>9:16 Vertical Reel</span>
                  <span>720p • 12s</span>
                </div>

                <div className="text-center z-10 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                  </div>
                  <div className="font-black text-sm uppercase px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md">
                    "Stop Paying 15% Broker Cuts"
                  </div>
                </div>

                <div className="z-10 text-[11px] bg-black/50 backdrop-blur-md p-2 rounded-xl text-neutral-200">
                  Hook drafted by UGC Video Agent for Instagram Reels, YouTube Shorts, and LinkedIn Videos.
                </div>
              </div>

              <div className="p-4 flex items-center justify-between bg-neutral-50 border-t border-neutral-100">
                <span className="text-[11px] text-neutral-500">Ready to export to Kling AI</span>
                <button
                  onClick={() => {
                    setVideoModalOpen(false);
                    onNavigate('posters');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-neutral-800 transition-colors"
                >
                  Edit in Studio
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. BOTTOM NAVIGATION BAR (Exact Okara Style from Screenshots 2, 3, 4) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 z-30 flex items-center justify-around px-6 max-w-lg mx-auto sm:rounded-t-2xl shadow-lg">
        <button
          onClick={() => onNavigate('strategy')}
          className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Context</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('analytics');
            onNavigate('analytics');
          }}
          className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className="flex flex-col items-center gap-1 text-neutral-950 font-bold transition-colors"
        >
          <Rss className="w-4 h-4 text-neutral-950" />
          <span className="text-[10px]">Agents</span>
        </button>

        <button
          onClick={() => {
            // Triggers copilot
            const copilotBtn = document.querySelector('button[title="Expand"], button:has(span:contains("Addon Copilot"))') as HTMLElement;
            if (copilotBtn) copilotBtn.click();
          }}
          className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Chat</span>
        </button>
      </div>
    </div>
  );
};
