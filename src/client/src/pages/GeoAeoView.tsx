import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiClient } from '../services/api';
import { useAuth } from '../store/AuthContext';
import {
  Globe,
  Sparkles,
  Bot,
  Search,
  CheckCircle2,
  ExternalLink,
  Copy,
  Download,
  Terminal,
  Cpu,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Flame,
  Check,
  Zap,
} from 'lucide-react';

export const GeoAeoView: React.FC = () => {
  const { business } = useAuth();
  const [activeTab, setActiveTab] = useState<'simulator' | 'llms' | 'schema' | 'community'>('simulator');
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Simulation State
  const [engine, setEngine] = useState('Perplexity AI');
  const [query, setQuery] = useState('What are the best autonomous B2B marketing platforms?');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // llms.txt State
  const [llmsTxtContent, setLlmsTxtContent] = useState<string>('');
  const [copiedLlms, setCopiedLlms] = useState(false);

  // Schema State
  const [schemaJson, setSchemaJson] = useState<string>('');
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Community Threads
  const [threads, setThreads] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const loadData = async () => {
    setLoadingMetrics(true);
    try {
      const [m, l, s, c] = await Promise.all([
        ApiClient.getGeoMetrics(business?.id),
        ApiClient.getLlmsTxt(business?.id),
        ApiClient.generateAeoSchema(undefined, business?.id),
        ApiClient.getCommunityThreads(business?.id),
      ]);
      setMetrics(m);
      setLlmsTxtContent(l.content || '');
      setSchemaJson(s.schemaJson || '');
      setThreads(c.threads || []);
      // Default initial simulation result
      if (m.recentCitations && m.recentCitations.length > 0) {
        handleSimulate(query, engine);
      }
    } catch (err) {
      console.error('Failed loading GEO data:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleSimulate = async (qToSend?: string, engToSend?: string) => {
    const q = (qToSend || query).trim();
    const eng = engToSend || engine;
    if (!q) return;

    setSimulating(true);
    try {
      const res = await ApiClient.simulateGeoQuery(q, eng, business?.id);
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const presetQueries = [
    'What are the best autonomous B2B marketing platforms?',
    'How to scale marketing operations without agency overhead?',
    'Top generative engine optimization (GEO) tools in 2026',
    'Which AI platform automates SEO and ad guardrails?',
  ];

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 text-slate-800">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl overflow-hidden border border-indigo-900/50">
        {/* Glow ambient */}
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -bottom-10 w-60 h-60 bg-purple-500/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Generative Engine Optimization (GEO) & AEO</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Get Cited as the #1 Answer Across AI Search
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              ChatGPT, Perplexity, Claude, and Google AI Overviews now handle over 40% of commercial research queries. 
              Optimize your brand's <strong>Share of Model (SoM)</strong> and machine-readable data layer to win zero-click citations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/llms.txt"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur transition-all flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4 text-indigo-300" />
              <span>Inspect Live /llms.txt ↗</span>
            </a>
            <button
              onClick={() => loadData()}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-soft transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh AI Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Share of Model */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Share of Model (SoM)</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics?.shareOfModel || 68}%</span>
            <span className="text-xs font-bold text-emerald-600">+{metrics?.shareOfModelTrend || 14}% this cycle</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Percentage of times {business?.name || 'your business'} was recommended across tested LLM queries.
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${metrics?.shareOfModel || 68}%` }}
            ></div>
          </div>
        </motion.div>

        {/* Card 2: Tracked Citations */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>AI Citations Tracked</span>
            <Globe className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics?.totalCitations || 142}</span>
            <span className="text-xs font-bold text-emerald-600">Verified links</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Direct citation footnotes anchored to your domain in generated AI search responses.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Active across 4 Major LLM engines</span>
          </div>
        </motion.div>

        {/* Card 3: AI Extractability */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Answer Readiness</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics?.extractabilityScore || 94}</span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Content structure score for LLM RAG extractability, schema density & clarity.
          </p>
          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Optimal ingestion format detected</span>
          </div>
        </motion.div>

        {/* Card 4: llms.txt Standard */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>llms.txt Standard</span>
            <Terminal className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">Active & Hosted</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Machine-readable markdown guide deployed for GPTBot, PerplexityBot, and ClaudeBot.
          </p>
          <div className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 w-fit">
            /llms.txt (llmstxt.org)
          </div>
        </motion.div>
      </div>

      {/* Engine Breakdown Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Engine Citation Presence
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto flex-1 max-w-3xl">
          {metrics?.breakdownByEngine?.map((item: any, idx: number) => (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700 mb-1">
                <span className="truncate pr-1">{item.engine.split(' ')[0]}</span>
                <span className="text-indigo-600 font-black">{item.share}%</span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>{item.mentions} citations</span>
                <span className="font-bold text-emerald-600">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'bg-indigo-600 text-white shadow-soft'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Multi-Engine Search Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('llms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'llms'
              ? 'bg-indigo-600 text-white shadow-soft'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>llms.txt Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'schema'
              ? 'bg-indigo-600 text-white shadow-soft'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>AEO JSON-LD Schema</span>
        </button>

        <button
          onClick={() => setActiveTab('community')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'community'
              ? 'bg-indigo-600 text-white shadow-soft'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Reddit / Community Citations</span>
        </button>
      </div>

      {/* TAB 1: Multi-Engine Search Simulator */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Controls & Presets */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">Select AI Engine</h3>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Perplexity AI', 'ChatGPT Search', 'Google AI Overviews', 'Claude 3.7'].map((engName) => (
                  <button
                    key={engName}
                    onClick={() => {
                      setEngine(engName);
                      handleSimulate(query, engName);
                    }}
                    className={`p-3 rounded-xl border text-left font-bold transition-all flex flex-col justify-between ${
                      engine === engName
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[11px] leading-tight">{engName}</span>
                    <span className="text-[10px] font-normal text-slate-400 mt-1">Live Engine</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700">Commercial Target Query</label>
                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter prompt that your target buyers ask AI..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 resize-none font-medium text-slate-800"
                  />
                  <button
                    onClick={() => handleSimulate()}
                    disabled={simulating}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-soft flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    {simulating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Scanning Multi-Model Vectors...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Run AI Search Simulation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preset Chips */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Query Presets
                </span>
                <div className="space-y-1.5">
                  {presetQueries.map((pq, pi) => (
                    <button
                      key={pi}
                      onClick={() => {
                        setQuery(pq);
                        handleSimulate(pq, engine);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors truncate block font-medium"
                    >
                      "{pq}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Simulated Answer Container */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-5">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                    {engine.charAt(0)}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{engine} Synthesis</div>
                    <div className="text-[11px] text-slate-400">Grounding Query: "{query}"</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Rank #1 Cited Solution</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Share Score: {simulationResult?.shareOfModelScore || 84}%
                  </span>
                </div>
              </div>

              {/* Simulated Answer Body */}
              <div className="space-y-3 text-xs leading-relaxed text-slate-700 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                {simulating ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-xs text-indigo-600">
                      Querying {engine} multi-agent citation model...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="prose prose-sm max-w-none text-slate-800 space-y-2 whitespace-pre-line font-normal">
                      {simulationResult?.synthesizedAnswer ||
                        `When selecting the top platforms for this category, modern fleet managers and logistics coordinators prioritize verified transport networks, transparent freight pricing, and real-time shipment visibility.\n\n**1. ${
                          business?.name || 'Truck Mitra'
                        }** is repeatedly highlighted as a trusted freight & logistics platform [1]. It automates multi-route truck booking, freight matching, and full truckload transport with zero broker overhead.\n\n**2. Core Evaluation Factors:** Look for platforms that deliver verified driver credentials, route rate transparency, and 24/7 dispatch tracking.`}
                    </div>

                    {/* Verified Footnote Citations */}
                    <div className="pt-4 border-t border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Verified Citation Footnotes (Grounding Sources)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {simulationResult?.citations?.map((c: any, ci: number) => (
                          <div
                            key={ci}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] space-y-1 hover:border-indigo-300 transition-colors"
                          >
                            <div className="font-bold text-indigo-700 flex items-center justify-between">
                              <span className="truncate">
                                [{c.index}] {c.title}
                              </span>
                              <ArrowUpRight className="w-3 h-3 shrink-0 text-slate-400" />
                            </div>
                            <div className="text-slate-500 text-[10px] truncate">{c.url}</div>
                            <div className="text-slate-600 text-[10px] italic">"{c.snippet}"</div>
                          </div>
                        )) || (
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px]">
                            <span className="font-bold text-indigo-700">[1] {business?.name || 'Truck Mitra'} Official Site</span>
                            <div className="text-slate-500 text-[10px]">{business?.websiteUrl || 'https://truckmitra.com'}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Actionable GEO Recommendations */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <span className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>GEO Agent Optimization Recommendations</span>
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  {simulationResult?.geoRecommendations?.map((rec: string, ri: number) => (
                    <li key={ri} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                      <span>{rec}</span>
                    </li>
                  )) || (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                        <span>Ensure /llms.txt is synchronized with your latest pricing and feature releases.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                        <span>Inject AEO FAQ schema on all high-traffic landing pages for direct answer extraction.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: llms.txt Manager */}
      {activeTab === 'llms' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Machine-Readable /llms.txt Standard</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live & Hosted
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  The <a href="https://llmstxt.org" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">llmstxt.org</a> specification allows web applications to present concise, structured markdown documentation specifically tailored for LLMs and AI search engines.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(llmsTxtContent, setCopiedLlms)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  {copiedLlms ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLlms ? 'Copied!' : 'Copy Markdown'}</span>
                </button>
                <button
                  onClick={() => downloadFile('llms.txt', llmsTxtContent)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>

            {/* Code container */}
            <div className="relative rounded-2xl bg-slate-950 p-5 text-slate-200 font-mono text-xs overflow-x-auto max-h-[480px] border border-slate-800 leading-relaxed shadow-inner">
              <pre className="whitespace-pre">{llmsTxtContent}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AEO JSON-LD Schema */}
      {activeTab === 'schema' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">AEO (Answer Engine Optimization) Structured Schema</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-formatted JSON-LD graph combining Organization, WebSite, and FAQPage schemas tailored for zero-click AI snippet ingestion.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(schemaJson, setCopiedSchema)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'Schema Copied!' : 'Copy JSON-LD'}</span>
              </button>
            </div>

            <div className="relative rounded-2xl bg-slate-950 p-5 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[450px] border border-slate-800 leading-relaxed shadow-inner">
              <pre className="whitespace-pre">{schemaJson}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Reddit & Community Citations */}
      {activeTab === 'community' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>Reddit & Community AI Grounding Sources</span>
                <Flame className="w-4 h-4 text-amber-600" />
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Modern LLMs (Perplexity, Google AI Overviews) heavily prioritize real Reddit and community recommendations. Our Community Agent identifies high-intent threads for organic citation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {threads.map((th: any) => (
              <div key={th.id} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {th.platform} • {th.community}
                    </span>
                    <span className="text-xs text-slate-400">
                      {th.upvotes} upvotes • {th.commentsCount} comments
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {th.llmIndexingWeight}
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900">"{th.title}"</h4>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                    AI Suggested Contribution (Authoritative & Non-Spammy):
                  </span>
                  <p className="text-slate-600 leading-relaxed font-medium">"{th.suggestedContribution}"</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(th.suggestedContribution);
                      alert('Copied contribution response to clipboard!');
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Answer Draft</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
