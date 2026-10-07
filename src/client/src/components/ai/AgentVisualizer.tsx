import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Search,
  FileText,
  Share2,
  Megaphone,
  BarChart3,
  Users,
  Compass,
  Zap,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AgentType, AgentStatus, MarketingBrainState } from '@shared/types';

interface AgentVisualizerProps {
  brainState: MarketingBrainState | null;
  onRefresh?: () => void;
}

const AGENT_CONFIGS: Record<
  AgentType,
  { label: string; shortRole: string; icon: any; color: string; bg: string; border: string }
> = {
  BI_AGENT: {
    label: 'BI Agent',
    shortRole: 'Strategy & Brand Persona',
    icon: BrainCircuit,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  SEO_AGENT: {
    label: 'SEO Agent',
    shortRole: 'Crawler & Keywords',
    icon: Search,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  CONTENT_AGENT: {
    label: 'Content Agent',
    shortRole: 'SEO Blogs & FAQs',
    icon: FileText,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  SOCIAL_AGENT: {
    label: 'Social Agent',
    shortRole: 'Calendar & Syndication',
    icon: Share2,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
  ADS_AGENT: {
    label: 'Ads Agent',
    shortRole: 'Google & Meta Ads',
    icon: Megaphone,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  ANALYTICS_AGENT: {
    label: 'Analytics Agent',
    shortRole: 'Cross-Channel ROAS',
    icon: BarChart3,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  COMPETITOR_AGENT: {
    label: 'Competitor Agent',
    shortRole: 'Market & Gap Intel',
    icon: Compass,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  OPTIMIZATION_AGENT: {
    label: 'Optimization Agent',
    shortRole: 'Bid Rules & Scaler',
    icon: Zap,
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    border: 'border-fuchsia-200',
  },
  REPORTING_AGENT: {
    label: 'Reporting Agent',
    shortRole: '6-Part Executive PDF',
    icon: PieChart,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  LEAD_AGENT: {
    label: 'Lead Agent',
    shortRole: 'CRM Scoring & Followup',
    icon: Users,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
};

export const AgentVisualizer: React.FC<AgentVisualizerProps> = ({ brainState, onRefresh }) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>('SEO_AGENT');

  const agentsList: AgentType[] = [
    'BI_AGENT',
    'SEO_AGENT',
    'CONTENT_AGENT',
    'SOCIAL_AGENT',
    'ADS_AGENT',
    'ANALYTICS_AGENT',
    'COMPETITOR_AGENT',
    'OPTIMIZATION_AGENT',
    'REPORTING_AGENT',
    'LEAD_AGENT',
  ];

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'WORKING':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Working
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Standby
          </span>
        );
      case 'NEEDS_APPROVAL':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-2.5 h-2.5" />
            Approval
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-2.5 h-2.5" />
            Idle
          </span>
        );
    }
  };

  const activeAgentData = selectedAgent && brainState?.agents?.[selectedAgent];
  const activeAgentConfig = selectedAgent && AGENT_CONFIGS[selectedAgent];

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden border border-indigo-100 shadow-soft">
      {/* Background soft ambient glowing circles */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-soft">
            <BrainCircuit className="w-6 h-6 animate-pulse-subtle" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              Autonomous Marketing Brain
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                10 Agents Synchronized
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Coordinated 24/7 autonomous agents executing multi-channel digital growth
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-brand-300 text-slate-600 hover:text-brand-600 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Agents
          </button>
        )}
      </div>

      {/* Agents Circular / Grid Visualizer */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10 mb-6">
        {agentsList.map((agentKey) => {
          const cfg = AGENT_CONFIGS[agentKey];
          const live = brainState?.agents?.[agentKey];
          const isSelected = selectedAgent === agentKey;
          const Icon = cfg.icon;

          return (
            <motion.div
              key={agentKey}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAgent(agentKey)}
              className={`p-3 rounded-2xl cursor-pointer border transition-all duration-200 ${
                isSelected
                  ? 'bg-white shadow-md border-brand-400 ring-2 ring-brand-100'
                  : 'bg-white/60 hover:bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                {getStatusBadge(live?.status || 'WORKING')}
              </div>
              <div className="font-semibold text-xs text-slate-800 truncate">{cfg.label}</div>
              <div className="text-[10px] text-slate-400 truncate">{cfg.shortRole}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Agent Live Inspection Drawer */}
      <AnimatePresence mode="wait">
        {activeAgentData && activeAgentConfig && (
          <motion.div
            key={selectedAgent}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10"
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl ${activeAgentConfig.bg} ${activeAgentConfig.color} flex items-center justify-center shrink-0 shadow-sm`}
              >
                {React.createElement(activeAgentConfig.icon, { className: 'w-6 h-6' })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">{activeAgentData.name}</span>
                  {getStatusBadge(activeAgentData.status)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{activeAgentData.role}</div>
                <div className="text-xs text-slate-700 font-medium mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                  Active Task: <span className="italic">{activeAgentData.currentTaskDescription}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Completed Tasks</div>
                <div className="font-extrabold text-slate-800 text-sm">{activeAgentData.tasksCompleted} Actions</div>
              </div>
              <div className="text-right pl-4 border-l border-slate-200">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Last Heartbeat</div>
                <div className="font-medium text-slate-600 text-xs">Just now</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
