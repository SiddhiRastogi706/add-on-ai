import React, { useState, useEffect } from 'react';
import { useAuth } from './store/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { Dashboard } from './pages/Dashboard';
import { StrategyView } from './pages/StrategyView';
import { SeoView } from './pages/SeoView';
import { ContentWriterView } from './pages/ContentWriterView';
import { SocialMediaView } from './pages/SocialMediaView';
import { AdsManagerView } from './pages/AdsManagerView';
import { AnalyticsView } from './pages/AnalyticsView';
import { LeadManagementView } from './pages/LeadManagementView';
import { CompetitorView } from './pages/CompetitorView';
import { AutomationCenterView } from './pages/AutomationCenterView';
import { RecommendationCenterView } from './pages/RecommendationCenterView';
import { ApprovalsView } from './pages/ApprovalsView';
import { ReportsView } from './pages/ReportsView';
import { SettingsView } from './pages/SettingsView';
import { AdminPanelView } from './pages/AdminPanelView';
import { PosterStudioView } from './pages/PosterStudioView';
import { GeoAeoView } from './pages/GeoAeoView';
import { PublicPages, PublicPageSlug } from './pages/PublicPages';
import { CopilotWidget } from './components/copilot/CopilotWidget';
import { PushPermissionPrompt } from './components/push/PushPermissionPrompt';
import { ApiClient } from './services/api';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const hasCompletedBusinessSetup = (userId?: string) => {
  if (!userId) return false;
  try {
    return localStorage.getItem(`business_setup_complete_${userId}`) === 'true';
  } catch {
    return false;
  }
};

const getInitialPublicSlug = (): PublicPageSlug | null => {
  if (typeof window === 'undefined') return null;
  const p = window.location.pathname.replace(/^\/p\//, '').replace(/\/$/, '');
  const valid = ['features', 'how-it-works', 'services', 'reviews', 'about', 'careers', 'contact'];
  return valid.includes(p) ? (p as PublicPageSlug) : null;
};

export const App: React.FC = () => {
  const { user, currentView, setCurrentView, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin'>('signup');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(1);
  const [pendingRecsCount, setPendingRecsCount] = useState(3);
  const [publicSlug, setPublicSlug] = useState<PublicPageSlug | null>(getInitialPublicSlug());
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => {
      const slug = getInitialPublicSlug();
      setPublicSlug(slug);
      if (!slug) {
        if (window.location.pathname === '/login' || window.location.pathname === '/register') {
          setCurrentView('auth');
        } else {
          setCurrentView('landing');
        }
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!publicSlug) {
      document.title = 'Addon AI - Your Autonomous AI CMO & Growth Team';
    }
  }, [publicSlug, currentView]);

  const handleNavigate = (path: string) => {
    if (path === '/') {
      window.history.pushState({}, '', '/');
      setPublicSlug(null);
      setCurrentView('landing');
    } else if (path.startsWith('/p/')) {
      const slug = path.replace('/p/', '') as PublicPageSlug;
      window.history.pushState({}, '', path);
      setPublicSlug(slug);
    } else {
      setCurrentView(path);
    }
  };

  // Poll counts for badges
  useEffect(() => {
    if (user) {
      ApiClient.getApprovals()
        .then((apps) => {
          const pending = apps.filter((a: any) => a.status === 'PENDING').length;
          setPendingApprovalsCount(pending);
        })
        .catch(() => {});

      ApiClient.getRecommendations()
        .then((recs) => {
          const pending = recs.filter((r: any) => r.status === 'PENDING').length;
          setPendingRecsCount(pending);
        })
        .catch(() => {});
    }
  }, [user, currentView]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <div className="flex items-center gap-3 text-neutral-900 font-bold text-sm">
          <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
          Initializing Addon AI Engine...
        </div>
      </div>
    );
  }

  // View: Public SEO Pages (/p/features, /p/services, /p/about, etc.)
  if (publicSlug) {
    return (
      <PublicPages
        slug={publicSlug}
        onNavigate={handleNavigate}
        onLogin={() => {
          setAuthMode('login');
          setPublicSlug(null);
          setCurrentView('auth');
        }}
        onBookTruck={() => {
          setAuthMode('signup');
          setPublicSlug(null);
          setCurrentView('auth');
        }}
      />
    );
  }

  // View: Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onStartFree={() => {
            window.history.pushState({ view: 'auth' }, '', '/login');
            setAuthMode('signup');
            setCurrentView('auth');
          }}
          onLogin={() => {
            window.history.pushState({ view: 'auth' }, '', '/login');
            setAuthMode('login');
            setCurrentView('auth');
          }}
          onAdminLogin={() => {
            window.history.pushState({ view: 'auth' }, '', '/login');
            setAuthMode('admin');
            setCurrentView('auth');
          }}
        />
        <CopilotWidget />
        <PushPermissionPrompt />
      </>
    );
  }

  // View: Auth Page
  if (currentView === 'auth') {
    return (
      <AuthPage
        initialMode={authMode}
        onBack={() => {
          window.history.pushState({}, '', '/');
          setCurrentView('landing');
        }}
        onSuccess={(authenticatedUser) => {
          const signedInUser = authenticatedUser || user;
          if (signedInUser?.role === 'SUPER_ADMIN') {
            setCurrentView('admin');
          } else if (!hasCompletedBusinessSetup(signedInUser?.id)) {
            setCurrentView('onboarding');
          } else {
            setCurrentView('dashboard');
          }
        }}
      />
    );
  }

  // View: Onboarding Wizard
  if (currentView === 'onboarding') {
    return (
      <>
        <OnboardingWizard
          onComplete={() => {
            try {
              if (user?.id) localStorage.setItem(`business_setup_complete_${user.id}`, 'true');
            } catch (error) {
              console.warn('Could not remember business setup completion:', error);
            }
            setCurrentView('dashboard');
          }}
        />
        <PushPermissionPrompt />
      </>
    );
  }

  // Render Authenticated Shell (Sidebar + Header + Page View)
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={(v) => setCurrentView(v)} />;
      case 'strategy':
        return <StrategyView />;
      case 'seo':
        return <SeoView />;
      case 'geo':
        return <GeoAeoView />;
      case 'content':
        return <ContentWriterView />;
      case 'social':
        return <SocialMediaView />;
      case 'ads':
        return <AdsManagerView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'leads':
        return <LeadManagementView />;
      case 'competitors':
        return <CompetitorView />;
      case 'automation':
        return <AutomationCenterView />;
      case 'recommendations':
        return <RecommendationCenterView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      case 'admin':
        return <AdminPanelView />;
      case 'posters':
        return <PosterStudioView />;
      default:
        return <Dashboard onNavigate={(v) => setCurrentView(v)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar with Mobile Drawer */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        pendingApprovalsCount={pendingApprovalsCount}
        pendingRecommendationsCount={pendingRecsCount}
        mobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <Header
          pendingApprovalsCount={pendingApprovalsCount}
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        />
        <main className="flex-1 pb-16 min-w-0">
          <ErrorBoundary onReset={() => setCurrentView('dashboard')}>
            {renderCurrentView()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Floating AI Copilot Widget */}
      <CopilotWidget />
      <PushPermissionPrompt />
    </div>
  );
};
