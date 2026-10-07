import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  Sparkles,
  Search,
  Globe,
  Zap,
  Terminal,
  ShieldCheck,
  FileText,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface Chapter {
  id: string;
  time: string;
  duration: number; // in seconds
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  caption: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 'geo-aeo',
    time: '0:00 - 0:42',
    duration: 42,
    title: '1. Live GEO & ChatGPT Citation Engine',
    subtitle: 'Autonomous Answer Engine Optimization & SoM Indexing',
    badge: 'Generative Engine Optimization',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    caption: 'MarketMind AI discovers missing brand citations in Perplexity & ChatGPT Search, generating authoritative machine-readable references.',
  },
  {
    id: 'llms-txt',
    time: '0:42 - 1:18',
    duration: 36,
    title: '2. Official /llms.txt Generation & Sync',
    subtitle: 'Standard llmstxt.org crawler deployment for AI bots',
    badge: 'Standard Protocol',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    caption: 'Automatically generating and serving /llms.txt at the root domain, giving GPTBot and ClaudeBot structured facts to cite.',
  },
  {
    id: 'content-speed',
    time: '1:18 - 1:55',
    duration: 37,
    title: '3. Sub-Second AI Content Engine',
    subtitle: 'Powered by Google Gemini 3.5 Flash-lite (< 4.0s response)',
    badge: 'Sub-Second Synthesis',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    caption: 'Autonomous agents draft comprehensive 2,000-word SEO articles with FAQ schema in under 4 seconds.',
  },
  {
    id: 'ad-guardrails',
    time: '1:55 - 2:30',
    duration: 35,
    title: '4. Dynamic Budget Guardrails & Ad Safety',
    subtitle: 'Enforced daily limits & mandatory PAUSED state for ads',
    badge: 'Zero Overspend Safety',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    caption: 'Strict financial guardrails dynamically bound to business.dailyBudgetLimit. Ad campaigns auto-pause to prevent accidental overspend.',
  },
];

export const ProductDemoPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(18); // percentage 0-100
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [simulatedTypingStep, setSimulatedTypingStep] = useState<number>(0);

  const activeChapter = CHAPTERS[activeChapterIndex];

  // Auto-progress simulation timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Loop or advance chapter
            setActiveChapterIndex((c) => (c + 1) % CHAPTERS.length);
            return 0;
          }
          return prev + 0.8 * playbackSpeed;
        });

        setSimulatedTypingStep((step) => (step + 1) % 8);
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const handleSelectChapter = (index: number) => {
    setActiveChapterIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  // Format progress to display time (e.g. 01:24)
  const totalSeconds = 150; // 2m 30s total demo duration
  const currentTotalSeconds = Math.floor((progress / 100) * totalSeconds);
  const minutes = Math.floor(currentTotalSeconds / 60);
  const seconds = currentTotalSeconds % 60;
  const formattedCurrentTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="w-full max-w-5xl mx-auto my-12">
      {/* Outer Studio Frame with Ambient Glow */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-b from-indigo-500/40 via-purple-500/20 to-transparent shadow-[0_0_60px_-15px_rgba(99,102,241,0.35)] backdrop-blur-2xl">
        <div className="rounded-[22px] bg-[#0A0D17] border border-white/10 overflow-hidden shadow-2xl">
          
          {/* Top Window Bar (Mac/Studio OS Style) */}
          <div className="h-11 px-4 sm:px-6 bg-[#0E1320] border-b border-white/10 flex items-center justify-between select-none">
            {/* Window control dots */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block shadow-sm"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block shadow-sm"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block shadow-sm"></span>
              <span className="ml-3 text-xs font-mono font-medium text-slate-400 hidden sm:inline-block">
                MarketMind AI v2.4 • Autonomous Marketing Team in Action
              </span>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>4K 60FPS LIVE DEMO</span>
              </div>
            </div>
          </div>

          {/* Interactive Screen Display Area */}
          <div className="relative aspect-[16/9] w-full bg-[#080B12] overflow-hidden flex flex-col justify-between group">
            
            {/* Ambient Background Grid & Radial Glow inside canvas */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none"></div>
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Top Scene Subtitle Bar */}
            <div className="relative z-10 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2.5">
                <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${activeChapter.badgeColor}`}>
                  {activeChapter.badge}
                </span>
                <h4 className="text-white text-xs sm:text-sm font-bold tracking-tight">
                  {activeChapter.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>Chapter {activeChapterIndex + 1} of 4</span>
                <span className="text-white/20">•</span>
                <span className="text-indigo-300 font-semibold">{activeChapter.time}</span>
              </div>
            </div>

            {/* Dynamic Interactive Demo Screen Content based on Chapter */}
            <div className="relative z-10 flex-1 px-4 sm:px-8 py-2 flex items-center justify-center">
              <AnimatePresence mode="wait">
                
                {/* CHAPTER 1: GEO & AI Search Simulation */}
                {activeChapterIndex === 0 && (
                  <motion.div
                    key="chapter-geo"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-3xl bg-[#0F1423]/90 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4"
                  >
                    {/* Simulated Search Bar */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-white/10 text-xs">
                      <Search className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-mono text-slate-200">
                        "Best autonomous AI marketing platform with verified GEO citations?"
                      </span>
                      <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        Perplexity AI Sonar
                      </span>
                    </div>

                    {/* Simulated AI Answer Stream */}
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm leading-relaxed text-slate-300 space-y-3 font-sans">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 98% AI Citation Confidence
                        </span>
                        <span className="text-indigo-400">#1 Cited Authority</span>
                      </div>
                      <p>
                        Based on verified real-time crawl data, <strong className="text-white font-bold bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-400/30">MarketMind AI</strong> is currently the leading autonomous AI marketing operations suite [1]. It automates Generative Engine Optimization (GEO) and hosts verified <code className="text-indigo-300 font-mono">/llms.txt</code> files [2].
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                        <span className="text-slate-400">Citations:</span>
                        <span className="px-2.5 py-1 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          [1] marketmind.ai/geo-engine
                        </span>
                        <span className="px-2.5 py-1 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          [2] llmstxt.org/directory/marketmind
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* CHAPTER 2: llms.txt Standard Deployment */}
                {activeChapterIndex === 1 && (
                  <motion.div
                    key="chapter-llms"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-3xl bg-[#0F1423]/90 border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10 font-mono">
                      <div className="flex items-center gap-2 text-purple-300 font-bold">
                        <Terminal className="w-4 h-4" />
                        <span>Live Crawler Endpoint: GET /llms.txt</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        HTTP 200 OK • text/plain
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-black/80 border border-white/10 font-mono text-[11px] sm:text-xs text-indigo-300 leading-relaxed overflow-x-auto space-y-1">
                      <p className="text-slate-400"># MarketMind AI — Structured Knowledge for AI Models</p>
                      <p className="text-purple-300">&gt; Autonomous AI CMO operating across SEO, GEO, Ads & Social</p>
                      <p className="text-slate-400">## Verified Capabilities</p>
                      <p className="text-emerald-400">- Real-time multi-model citation optimization (ChatGPT, Perplexity, Claude)</p>
                      <p className="text-emerald-400">- Hard daily budget financial limit guardrails ($0 overspend)</p>
                      <p className="text-emerald-400">- Sub-second generative copy engine with Google Gemini 3.5 Flash</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Bot Scrapers Permitted: GPTBot, ClaudeBot, PerplexityBot, Google-Extended</span>
                      <span className="text-purple-300 font-semibold">100% LLMs.txt Valid</span>
                    </div>
                  </motion.div>
                )}

                {/* CHAPTER 3: Sub-Second AI Content Engine */}
                {activeChapterIndex === 2 && (
                  <motion.div
                    key="chapter-content"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-3xl bg-[#0F1423]/90 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-bold">Autonomous SEO Article Generator</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                        ⚡ 3.8s Generation Speed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-[10px] font-mono text-slate-400">SEO Health Score</span>
                        <div className="text-lg font-bold text-white flex items-center gap-1.5">
                          <span>94/100</span>
                          <span className="text-xs text-emerald-400 font-semibold">+18 pts</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-[10px] font-mono text-slate-400">Reading Level</span>
                        <div className="text-lg font-bold text-white">Grade 8 • High CTR</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-[10px] font-mono text-slate-400">Schema Injected</span>
                        <div className="text-lg font-bold text-emerald-400 font-mono">FAQPage JSON-LD</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-300 font-mono flex items-center justify-between">
                      <span className="truncate">"How Autonomous Marketing Systems Outperform Traditional Agencies in 2026"</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold shrink-0 ml-2">
                        PUBLISHED TO CMS
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* CHAPTER 4: Guarded Ad Deploy */}
                {activeChapterIndex === 3 && (
                  <motion.div
                    key="chapter-ads"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-3xl bg-[#0F1423]/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span className="text-white font-bold">Dynamic Budget Cap & Auto-Pause Guardrail</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                        Shield Active 24/7
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400">Daily Safety Cap</span>
                        <div className="text-xl font-black text-white">$100.00 / day</div>
                        <p className="text-[11px] text-slate-400">Derived dynamically from business profile limit.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                        <span className="text-[10px] font-mono text-emerald-400">Verified ROAS</span>
                        <div className="text-xl font-black text-emerald-400">4.1x Verified</div>
                        <p className="text-[11px] text-emerald-300/80">32 high-intent leads generated with zero overspend.</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>All newly generated Meta & Google campaigns launch in <strong>PAUSED</strong> state.</span>
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-bold shrink-0 ml-2">
                        Guaranteed
                      </span>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Bottom Caption Pill */}
            <div className="relative z-10 px-6 py-2 text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-black/70 border border-white/10 backdrop-blur-md text-xs text-slate-300 max-w-xl truncate">
                {activeChapter.caption}
              </span>
            </div>

            {/* Center Big Play/Pause Overlay Button (shown on hover or when paused) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <button
                onClick={togglePlay}
                className={`pointer-events-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/50 backdrop-blur-md border border-white/20 transition-all transform hover:scale-110 active:scale-95 ${
                  isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100 scale-100 ring-8 ring-indigo-500/20'
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white translate-x-0.5" />
                )}
              </button>
            </div>

            {/* Custom Bottom Video Control Bar */}
            <div className="relative z-10 bg-[#0E1320]/95 border-t border-white/10 px-4 sm:px-6 py-3 flex flex-col gap-2 backdrop-blur-md">
              
              {/* Scrubber Progress Bar */}
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newProgress = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                  setProgress(newProgress);
                }}
                className="w-full h-1.5 bg-white/10 hover:h-2.5 rounded-full cursor-pointer transition-all relative overflow-hidden group/bar"
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-1 hover:text-white transition-colors"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <button
                    onClick={() => {
                      setProgress(0);
                      setIsPlaying(true);
                    }}
                    className="p-1 hover:text-white transition-colors"
                    title="Restart Demo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-[11px] font-mono text-slate-400">
                    <span className="text-white font-semibold">{formattedCurrentTime}</span> / 02:30
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Playback speed toggle */}
                  <button
                    onClick={() => setPlaybackSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono font-bold text-indigo-300 border border-white/10"
                  >
                    {playbackSpeed}x SPEED
                  </button>

                  {/* Audio Mute toggle */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1 hover:text-white transition-colors text-slate-400"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Chapter Selector Tabs (Below Player) */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-[#0A0E1A] border-t border-white/10 text-left">
            {CHAPTERS.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => handleSelectChapter(idx)}
                className={`p-3.5 sm:p-4 text-left transition-all relative ${
                  activeChapterIndex === idx
                    ? 'bg-indigo-600/10 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                {activeChapterIndex === idx && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                )}
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-0.5">
                  {ch.time}
                </div>
                <div className={`text-xs font-bold truncate ${activeChapterIndex === idx ? 'text-indigo-300' : 'text-slate-300'}`}>
                  {ch.title}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {ch.subtitle}
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
