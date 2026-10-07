import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { useAuth } from '../store/AuthContext';
import {
  Cpu,
  Play,
  Pause,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BrainCircuit,
  Search,
  Share2,
  Megaphone,
  BarChart3,
  FileText,
  PieChart,
} from 'lucide-react';

export const AutomationCenterView: React.FC = () => {
  const { business, refreshBusiness } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        ApiClient.getAutomationStatus(),
        ApiClient.getActivityLogs(),
      ]);
      setModules(statusRes?.modules || []);
      setLogs(logsRes || []);
    } catch (e) {
      console.error('Failed loading automation status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Live poll activity every 10s
    return () => clearInterval(interval);
  }, []);

  const handlePauseAll = async () => {
    try {
      await ApiClient.pauseAllAutomation();
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResumeAll = async () => {
    try {
      await ApiClient.resumeAllAutomation();
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleModule = async (moduleId: string, currentStatus: string) => {
    const isEnabled = currentStatus !== 'ACTIVE';
    try {
      await ApiClient.toggleModule(moduleId, isEnabled);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Automation Engine Control Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time queue execution, recurring background schedulers, and end-to-end task audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePauseAll}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center gap-1.5"
          >
            <Pause className="w-3.5 h-3.5" /> Pause All
          </button>
          <button
            onClick={handleResumeAll}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-soft flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Resume All
          </button>
        </div>
      </div>

      {/* Module Automation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((m) => (
          <div key={m.id} className="glass-card p-5 rounded-3xl border border-slate-200/80 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">{m.name}</span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  m.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                ● {m.status}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <div>Frequency: <strong className="text-slate-700">{m.frequency}</strong></div>
              <div>Last Run: <span className="text-slate-600">{m.lastRun}</span></div>
              <div>Next Run: <span className="text-slate-600">{m.nextRun}</span></div>
            </div>

            <button
              onClick={() => handleToggleModule(m.id, m.status)}
              className={`w-full py-1.5 rounded-xl text-xs font-bold transition-colors ${
                m.status === 'ACTIVE'
                  ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
              }`}
            >
              {m.status === 'ACTIVE' ? 'Pause Module' : 'Activate Module'}
            </button>
          </div>
        ))}
      </div>

      {/* AI Activity Log Stream */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" />
            <h3 className="font-bold text-sm text-slate-800">Traceable AI Activity Audit Log</h3>
          </div>
          <span className="text-xs text-slate-400">Live stream (30s background cycle)</span>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-brand-700 border border-brand-200">
                    {log.agentType}
                  </span>
                  <span className="font-bold text-slate-800">{log.actionSummary}</span>
                </div>
                <p className="text-[11px] text-slate-500">{log.details}</p>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-slate-400 shrink-0">
                <span className="font-mono">{log.traceId}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
