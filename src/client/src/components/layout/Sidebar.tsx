import React from 'react';
import { useAuth } from '../../store/AuthContext';
import { BRAND } from '@config/brand';
import {
  LayoutDashboard,
  BrainCircuit,
  Search,
  FileText,
  Share2,
  Megaphone,
  BarChart3,
  Users,
  Compass,
  Cpu,
  Sparkles,
  CheckSquare,
  PieChart,
  Layers,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Palette,
  Globe,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  pendingApprovalsCount?: number;
  pendingRecommendationsCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  pendingApprovalsCount = 1,
  pendingRecommendationsCount = 3,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, category: 'Core' },
    { id: 'strategy', label: 'AI Strategy', icon: BrainCircuit, category: 'Core' },
    { id: 'seo', label: 'SEO Automation', icon: Search, category: 'Channels' },
    { id: 'geo', label: 'GEO & AEO Studio', icon: Globe, category: 'Channels', badge: 'AI', badgeColor: 'bg-indigo-100 text-indigo-700 font-bold' },
    { id: 'content', label: 'Content Studio', icon: FileText, category: 'Channels' },
    { id: 'social', label: 'Social & Calendar', icon: Share2, category: 'Channels' },
    { id: 'ads', label: 'Ads Manager', icon: Megaphone, category: 'Channels' },
    { id: 'posters', label: 'Poster Studio (AI Creatives)', icon: Palette, category: 'Channels' },
    { id: 'analytics', label: 'Marketing Analytics', icon: BarChart3, category: 'Intelligence' },
    { id: 'leads', label: 'Lead CRM', icon: Users, category: 'Intelligence' },
    { id: 'competitors', label: 'Competitor Intel', icon: Compass, category: 'Intelligence' },
    { id: 'automation', label: 'Automation Engine', icon: Cpu, category: 'Operations' },
    {
      id: 'recommendations',
      label: 'AI Recommendations',
      icon: Sparkles,
      category: 'Operations',
      badge: pendingRecommendationsCount > 0 ? String(pendingRecommendationsCount) : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'approvals',
      label: 'Needs Approval',
      icon: CheckSquare,
      category: 'Operations',
      badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 animate-pulse',
    },
    { id: 'reports', label: 'Executive Reports', icon: PieChart, category: 'Operations' },
    { id: 'integrations', label: 'Connected Accounts', icon: Layers, category: 'System' },
    { id: 'settings', label: 'SaaS & Settings', icon: Settings, category: 'System' },
    { id: 'admin', label: 'Admin Panel', icon: ShieldAlert, category: 'System', adminOnly: true },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`w-64 border-r border-slate-200/80 bg-white lg:bg-white/70 backdrop-blur-lg flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo & Wordmark */}
        <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 via-indigo-600 to-blush-500 flex items-center justify-center text-white shadow-soft shadow-brand-500/20 shrink-0">
              <BrainCircuit className="w-6 h-6 animate-pulse-subtle" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tracking-tight text-base leading-tight flex items-center gap-1.5">
                {BRAND.appName}
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200/60">
                  v2.4
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Your Autonomous AI CMO</div>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') return null;

            const isActive = currentView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-transparent text-brand-700 shadow-sm border border-brand-200/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                }`}
              >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile & Exit */}
      <div className="p-3 border-t border-slate-200/60 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-slate-200/70 shadow-soft">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name ? user.name.slice(0, 1) : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'SkyExpress Roadlines'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email || 'skyexpressroad@gmail.com'}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  </>
  );
};
