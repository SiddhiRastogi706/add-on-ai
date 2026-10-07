import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Search,
  Share2,
  Calendar,
  Download,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const [range, setRange] = useState<'today' | '7d' | '30d' | '90d'>('30d');
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (selectedRange: string) => {
    try {
      const data = await ApiClient.getAnalyticsSnapshot(selectedRange);
      setSnapshot(data);
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(range);
  }, [range]);

  const PASTEL_COLORS = ['#537CF3', '#1CB77B', '#FA8243', '#DC5495', '#0EA5E9'];

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Marketing Analytics & Multi-Channel ROI</h1>
          <p className="text-xs text-slate-500 mt-1">
            Integrated attribution across organic search, social syndication, and paid performance funnels.
          </p>
        </div>

        {/* Time range pills */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto border border-slate-200/60">
          {(['today', '7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                range === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Website Visitors',
            val: snapshot?.websiteVisitors?.toLocaleString() || '14,820',
            change: '+24.6% vs prev period',
            color: 'text-brand-600',
            icon: Users,
            bg: 'bg-indigo-50',
          },
          {
            title: 'Organic Search Impressions',
            val: snapshot?.organicImpressions?.toLocaleString() || '184,000',
            change: '+18.2% search visibility',
            color: 'text-emerald-600',
            icon: Search,
            bg: 'bg-emerald-50',
          },
          {
            title: 'Blended Paid ROAS',
            val: `${snapshot?.roasAverage || 4.12}x`,
            change: '$1,680 total ad spend',
            color: 'text-amber-600',
            icon: DollarSign,
            bg: 'bg-amber-50',
          },
          {
            title: 'Qualified Leads',
            val: snapshot?.totalLeads?.toLocaleString() || '186',
            change: '4.2% conversion rate',
            color: 'text-sky-600',
            icon: TrendingUp,
            bg: 'bg-sky-50',
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="glass-card p-5 rounded-3xl border border-slate-200/80 shadow-soft">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>{item.title}</span>
                <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{item.val}</div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1">{item.change}</div>
            </div>
          );
        })}
      </div>

      {/* Chart Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Channel Traffic Trend (2 Cols) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Multi-Channel Acquisition Velocity</h3>
              <p className="text-[11px] text-slate-400">Visitors distributed across organic, paid search, and social</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-brand-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#537CF3]"></span> Organic
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#1CB77B]"></span> Ads
              </span>
              <span className="flex items-center gap-1 text-pink-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#DC5495]"></span> Social
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#537CF3" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#537CF3" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1CB77B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1CB77B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.08)',
                  }}
                />
                <Area type="monotone" dataKey="organic" stroke="#537CF3" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOrganic)" name="Organic SEO" />
                <Area type="monotone" dataKey="ads" stroke="#1CB77B" strokeWidth={2} fillOpacity={1} fill="url(#colorAds)" name="Paid Ads" />
                <Area type="monotone" dataKey="social" stroke="#DC5495" strokeWidth={1.5} fill="transparent" name="Social (SMO)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources Pie Chart */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 mb-1">Traffic Source Share</h3>
            <p className="text-[11px] text-slate-400 mb-4">Channel contribution percentages</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={snapshot?.trafficSources || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="visitors"
                  >
                    {(snapshot?.trafficSources || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {(snapshot?.trafficSources || []).map((source: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-600 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PASTEL_COLORS[idx % PASTEL_COLORS.length] }}
                  ></span>
                  {source.source}
                </span>
                <span className="font-bold text-slate-800">{source.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
