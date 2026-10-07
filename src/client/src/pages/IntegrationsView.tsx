import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  BarChart2,
  Megaphone,
  Share2,
  Linkedin,
  ShoppingBag,
  Globe,
  Activity,
  Database,
  Mail,
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const list = await ApiClient.getIntegrations();
      setIntegrations(list);
    } catch (e) {
      console.error('Failed loading integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConnect = async (id: string) => {
    try {
      await ApiClient.connectIntegration(id);
      loadData();
    } catch (e) {
      console.error('Connect error:', e);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await ApiClient.disconnectIntegration(id);
      loadData();
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  };

  const getIcon = (provider: string) => {
    switch (provider) {
      case 'google_pagespeed':
        return <Activity className="w-5 h-5 text-indigo-600" />;
      case 'google_search_console':
        return <Search className="w-5 h-5 text-emerald-600" />;
      case 'google_analytics':
        return <BarChart2 className="w-5 h-5 text-sky-600" />;
      case 'google_ads':
        return <Megaphone className="w-5 h-5 text-amber-600" />;
      case 'meta_ads':
        return <Share2 className="w-5 h-5 text-pink-600" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5 text-blue-600" />;
      case 'shopify':
        return <ShoppingBag className="w-5 h-5 text-teal-600" />;
      case 'upstash_redis':
        return <Database className="w-5 h-5 text-emerald-600" />;
      case 'resend':
        return <Mail className="w-5 h-5 text-violet-600" />;
      default:
        return <Globe className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Connected Marketing Accounts & APIs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorized external data sources. Unconnected platforms run seamlessly in isolated Sandbox Demo mode.
        </p>
      </div>

      {/* Integration Principles Alert */}
      <div className="p-4 rounded-3xl bg-indigo-50/70 border border-brand-200 text-xs text-brand-900 flex items-start gap-3 shadow-soft">
        <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">Automated Execution Principle:</strong>
          MarketMind AI respects all legitimate third-party API quotas, authorization terms, and advertiser permissions. Real metrics are strictly segregated from Sandbox mock estimates.
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((acc) => (
          <div
            key={acc.id}
            className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    {getIcon(acc.provider)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{acc.name}</h3>
                    <div className="text-[10px] text-slate-400">{acc.category}</div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    acc.isConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {acc.isConnected ? (acc.isSandboxDemo ? 'Sandbox Connected' : 'Live Connected') : 'Disconnected'}
                </span>
              </div>

              {acc.isConnected && acc.connectedAccountName && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-3 truncate">
                  Account: <strong className="text-slate-800">{acc.connectedAccountName}</strong>
                </div>
              )}

              {/* Permissions list */}
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Required Permissions</div>
                <div className="space-y-1">
                  {(acc.requiredPermissions || []).map((perm: string, pi: number) => (
                    <div key={pi} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0"></span>
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {acc.isConnected ? (
                <>
                  <span className="text-[10px] text-slate-400">Last synced: Just now</span>
                  <button
                    onClick={() => handleDisconnect(acc.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConnect(acc.id)}
                  className="w-full py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-sm transition-all"
                >
                  Authorize & Connect Account
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
