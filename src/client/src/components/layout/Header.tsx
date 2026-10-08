import React from 'react';
import { useAuth } from '../../store/AuthContext';
import {
  Bell,
  Search,
  Zap,
  AlertTriangle,
  Play,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
  Download,
  Menu,
} from 'lucide-react';
import { ApiClient } from '../../services/api';

interface HeaderProps {
  onOpenNotifications?: () => void;
  pendingApprovalsCount?: number;
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  pendingApprovalsCount = 0,
  onToggleMobileNav,
}) => {
  const { user, business, refreshBusiness, setCurrentView } = useAuth();

  const [showEmergencyModal, setShowEmergencyModal] = React.useState(false);
  const [emergencyReason, setEmergencyReason] = React.useState('Manual safety override by administrator');
  const [stopping, setStopping] = React.useState(false);

  const handleConfirmEmergencyStop = async () => {
    if (!business) return;
    setStopping(true);
    try {
      if (business.emergencyStop) {
        await ApiClient.resumeAutomation(business.id);
      } else {
        await ApiClient.emergencyStop(business.id, emergencyReason);
      }
      await refreshBusiness();
      setShowEmergencyModal(false);
    } catch (e) {
      console.error('Emergency stop error:', e);
    } finally {
      setStopping(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile Toggle & Business Context */}
        <div className="flex items-center gap-2 sm:gap-4">
          {onToggleMobileNav && (
            <button
              type="button"
              onClick={onToggleMobileNav}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-soft font-bold text-sm shrink-0">
              {business?.name ? business.name.slice(0, 2).toUpperCase() : 'AB'}
            </div>
            <div className="min-w-0 max-w-[min(60vw,36rem)]">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="font-semibold text-slate-800 text-sm leading-snug break-words whitespace-normal max-w-full">
                  {business?.name || 'Your Business'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  Slot #1 Lifetime (₹499)
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1 min-w-0 mt-0.5">
                <span className="break-all leading-tight max-w-full">{business?.websiteUrl || 'https://yourwebsite.com'}</span>
                <a
                  href={business?.websiteUrl || 'https://yourwebsite.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-600 shrink-0"
                >
                  <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Quick Search / Action */}
        <div className="hidden md:flex items-center w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Ask AI or search commands (e.g. 'audit SEO')..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-100/80 border border-transparent focus:border-brand-300 focus:bg-white text-xs text-slate-700 placeholder:text-slate-400 transition-all outline-none"
          />
        </div>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center gap-3">
          {/* Emergency Stop Toggle Button */}
          <button
            onClick={() => {
              if (business?.emergencyStop) {
                handleConfirmEmergencyStop();
              } else {
                setShowEmergencyModal(true);
              }
            }}
            title={business?.emergencyStop ? 'Resume Automation' : 'Emergency Stop All Campaigns'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              business?.emergencyStop
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            {business?.emergencyStop ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume Automation
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Emergency Stop</span>
              </>
            )}
          </button>

          {/* Approvals quick bell */}
          <button
            onClick={() => setCurrentView('approvals')}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Needs Your Approval"
          >
            <Bell className="w-4 h-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>

          {/* User Avatar */}
          <div
            onClick={() => setCurrentView('settings')}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {user?.name ? user.name.slice(0, 1) : 'S'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'Business Owner'}</div>
              <div className="text-[10px] text-slate-400 font-medium">
                {user?.role === 'SUPER_ADMIN' ? 'Platform Administrator' : 'Managing Director & Founder'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Stop Confirmation Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Confirm Emergency Stop</h3>
                <p className="text-xs text-slate-500">Autonomous Execution Safety Circuit Breaker</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-bold">What this emergency action immediately halts:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-800">
                <li><strong>All Automated Publishing:</strong> Scheduled social posts and content briefs are paused immediately.</li>
                <li><strong>Paid Ad Bid Shifting:</strong> Any automatic Google Ads / Meta Ads budget reallocation is frozen.</li>
                <li><strong>Agent Mode:</strong> All 10 Autonomous AI Agents shift into Read-Only observation mode.</li>
                <li><strong>Read-Only Monitoring:</strong> Website SEO crawl reports and analytics remain visible.</li>
              </ul>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Reason for stop (Logged in audit log):</label>
              <input
                type="text"
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEmergencyStop}
                disabled={stopping}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {stopping ? 'Engaging Circuit Breaker...' : 'Yes, Activate Emergency Stop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
