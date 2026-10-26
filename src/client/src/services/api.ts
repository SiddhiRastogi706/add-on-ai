const API_BASE = '/api';

export interface OpenStreetMapCompetitor {
  osmId: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  website: string | null;
  mapUrl: string;
}

export interface LocalCompetitorSearchResult {
  businessType: string;
  location: string;
  searchedAt: string;
  source: string;
  attribution: string;
  results: OpenStreetMapCompetitor[];
}

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('marketmind_token');
  }

  static hasToken(): boolean {
    return Boolean(this.getToken());
  }

  static setToken(token: string) {
    localStorage.setItem('marketmind_token', token);
  }

  static clearToken() {
    localStorage.removeItem('marketmind_token');
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage: string | undefined;

      if (responseText) {
        try {
          const errBody = JSON.parse(responseText);
          errorMessage =
            typeof errBody === 'string'
              ? errBody
              : typeof errBody.error === 'string'
                ? errBody.error
                : typeof errBody.message === 'string'
                  ? errBody.message
                  : undefined;
        } catch {
          if (!response.headers.get('content-type')?.includes('text/html')) {
            errorMessage = responseText.trim().slice(0, 300) || undefined;
          }
        }
      }

      throw new Error(errorMessage || `API error ${response.status}${response.statusText ? ` (${response.statusText})` : ''}`);
    }

    return response.json();
  }

  // Auth
  static login = (data: { identifier: string; password: string }) =>
    this.request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  static adminLogin = (data: any) => this.request<any>('/auth/admin-login', { method: 'POST', body: JSON.stringify(data) });
  static demoLogin = () => this.request<any>('/auth/demo-login', { method: 'POST' });
  static getGoogleAuthConfig = () => this.request<{ clientId: string | null }>('/auth/google-config');
  static googleLogin = (credential: string) =>
    this.request<any>('/auth/google-login', { method: 'POST', body: JSON.stringify({ credential }) });
  static signup = (data: {
    identifier: string;
    password: string;
    name: string;
    organizationName?: string;
  }) => this.request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(data) });
  static updateAdminSlots = (data: { claimedSlots?: number; totalSlots?: number }) =>
    this.request<any>('/admin/slots/update', { method: 'POST', body: JSON.stringify(data) });
  static getMe = () => this.request<any>('/auth/me');
  static sendOtp = (identifier: string, channel: 'email' | 'phone' = 'email') =>
    this.request<any>('/auth/otp/send', { method: 'POST', body: JSON.stringify({ identifier, channel }) });
  static verifyOtpAndReset = (identifier: string, otp: string, newPassword?: string) =>
    this.request<any>('/auth/otp/verify-reset', { method: 'POST', body: JSON.stringify({ identifier, otp, newPassword }) });
  static sendPhoneOtp = (data: { phone: string; name?: string; organizationName?: string; email?: string }) =>
    this.request<any>('/auth/phone/send-otp', { method: 'POST', body: JSON.stringify(data) });
  static verifyPhoneOtp = (data: { phone: string; otp: string; name?: string; organizationName?: string; email?: string }) =>
    this.request<any>('/auth/phone/verify-otp', { method: 'POST', body: JSON.stringify(data) });

  // Business & Onboarding
  static getActiveBusiness = () => this.request<any>('/business/active');
  static createBusiness = (data: any) => this.request<any>('/business/create', { method: 'POST', body: JSON.stringify(data) });
  static emergencyStop = (businessId: string, reason?: string) =>
    this.request<any>(`/business/${businessId}/emergency-stop`, { method: 'POST', body: JSON.stringify({ reason }) });
  static resumeAutomation = (businessId: string) =>
    this.request<any>(`/business/${businessId}/resume`, { method: 'POST' });

  // Crawler
  static crawlWebsite = (url: string) => this.request<any>('/crawler/scan', { method: 'POST', body: JSON.stringify({ url }) });

  // Central Brain
  static getBrainState = (businessId?: string) => this.request<any>(`/brain/state${businessId ? `?businessId=${businessId}` : ''}`);
  static triggerBrainSync = (businessId?: string) => this.request<any>('/brain/sync', { method: 'POST', body: JSON.stringify({ businessId }) });

  // SEO
  static getSeoAudit = (businessId?: string) => this.request<any>(`/seo/audit${businessId ? `?businessId=${businessId}` : ''}`);
  static runSeoAudit = (businessId?: string, maxPages: number = 10, websiteUrl?: string) =>
    this.request<any>('/seo/audit/run', { method: 'POST', body: JSON.stringify({ businessId, maxPages, websiteUrl }) });
  static getKeywords = (businessId?: string) => this.request<any>(`/seo/keywords${businessId ? `?businessId=${businessId}` : ''}`);
  static enrichKeywords = (businessId?: string) =>
    this.request<any>('/seo/keywords/enrich', { method: 'POST', body: JSON.stringify({ businessId }) });
  static fixSeoIssue = (issueId: string) => this.request<any>(`/seo/issues/${issueId}/fix`, { method: 'POST' });
  static getPageSpeed = (businessId?: string, strategy: 'mobile' | 'desktop' = 'mobile') =>
    this.request<any>(`/seo/pagespeed?strategy=${strategy}${businessId ? `&businessId=${businessId}` : ''}`);
  static getPageSpeedStatus = () => this.request<any>('/seo/pagespeed/status');
  static getSearchConsole = (businessId?: string) =>
    this.request<any>(`/seo/search-console${businessId ? `?businessId=${businessId}` : ''}`);
  static getBacklinks = (businessId?: string, url?: string) =>
    this.request<any>(`/seo/backlinks?${businessId ? `businessId=${businessId}&` : ''}${url ? `url=${encodeURIComponent(url)}` : ''}`);
  static getRankedKeywords = (businessId?: string, url?: string) =>
    this.request<any>(`/seo/ranked-keywords?${businessId ? `businessId=${businessId}&` : ''}${url ? `url=${encodeURIComponent(url)}` : ''}`);
  static analyzePublicDomain = (websiteUrl: string) =>
    this.request<any>('/seo/analyze-public', { method: 'POST', body: JSON.stringify({ websiteUrl }) });
  static getLiveCompetitors = (businessId?: string, url?: string) =>
    this.request<any>(`/seo/competitors-live?${businessId ? `businessId=${businessId}&` : ''}${url ? `url=${encodeURIComponent(url)}` : ''}`);

  // Content
  static getContentList = (businessId?: string) => this.request<any[]>(`/content${businessId ? `?businessId=${businessId}` : ''}`);
  static generateContent = (data: any) => this.request<any>('/content/generate', { method: 'POST', body: JSON.stringify(data) });
  static updateContentStatus = (id: string, status: string) => this.request<any>(`/content/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

  // Social
  static getSocialPosts = (businessId?: string) => this.request<any[]>(`/social/posts${businessId ? `?businessId=${businessId}` : ''}`);
  static generateSocialCalendar = (businessId?: string) => this.request<any>('/social/generate-calendar', { method: 'POST', body: JSON.stringify({ businessId }) });
  static generateSocialPost = (data: {
    businessId?: string;
    channel?: string;
    topic?: string;
    caption?: string;
    imageUrl?: string;
  }) => this.request<any>('/social/generate-calendar', {
    method: 'POST',
    body: JSON.stringify({
      businessId: data.businessId,
      channel: data.channel,
      topic: data.topic,
      caption: data.caption,
      imageUrl: data.imageUrl,
    }),
  });
  static publishSocialPost = (id: string) => this.request<any>(`/social/posts/${id}/publish`, { method: 'POST' });
  static publishDirectSocial = (data: {
    businessId?: string;
    channels: string[];
    caption: string;
    imageUrl?: string;
    mediaType?: 'image' | 'video';
    headline?: string;
    cta?: string;
  }) => this.request<any>('/social/publish-direct', { method: 'POST', body: JSON.stringify(data) });
  static uploadSocialMedia = async (file: File): Promise<{ url: string; mediaType: 'image' | 'video' }> => {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/social/media`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || errBody.message || `Media upload failed (${response.status})`);
    }

    return response.json();
  };
  static verifyFacebookConnection = (data?: { pageId?: string; accessToken?: string; adAccountId?: string }) =>
    this.request<any>('/social/verify-facebook', { method: 'POST', body: JSON.stringify(data || {}) });
  static classifyComment = (
    message: string,
    businessId?: string,
    businessContext?: {
      name?: string;
      industry?: string;
      websiteUrl?: string;
      productsAndServices?: string[] | string;
      brandTone?: string;
      description?: string;
    }
  ) =>
    this.request<any>('/social/classify-comment', {
      method: 'POST',
      body: JSON.stringify({ message, businessId, businessContext }),
    });
  static getSocialConnectionStatus = (businessId?: string) =>
    this.request<{
      hasAnyConnectedAccount: boolean;
      facebook: boolean;
      instagram: boolean;
      linkedin: boolean;
      x: boolean;
      youtube: boolean;
      accounts: Array<{ id: string; platform: string; handle: string; name: string }>;
    }>(`/social/connection-status${businessId ? `?businessId=${businessId}` : ''}`);

  static getSocialAccounts = (businessId?: string) =>
    this.request<any[]>(`/social/accounts${businessId ? `?businessId=${businessId}` : ''}`);

  static connectSocialAccount = (data: {
    businessId?: string;
    platform: string;
    accountHandle: string;
    displayName?: string;
    credentials?: any;
    triggerCycle?: boolean;
  }) => this.request<any>('/social/accounts/connect', { method: 'POST', body: JSON.stringify(data) });

  static disconnectSocialAccount = (data: { businessId?: string; platform: string }) =>
    this.request<any>('/social/accounts/disconnect', { method: 'POST', body: JSON.stringify(data) });

  static markPostPublished = (id: string, permalink?: string) =>
    this.request<any>(`/social/posts/${id}/mark-published`, { method: 'POST', body: JSON.stringify({ permalink }) });

  // Ads
  static getAdCampaigns = (businessId?: string) => this.request<any[]>(`/ads/campaigns${businessId ? `?businessId=${businessId}` : ''}`);
  static generateAdCampaign = (data: any) => this.request<any>('/ads/campaigns/generate', { method: 'POST', body: JSON.stringify(data) });
  static deployLiveAds = (data: any) => this.request<any>('/ads/campaigns/deploy-live', { method: 'POST', body: JSON.stringify(data) });
  static updateCampaignStatus = (id: string, status: string) => this.request<any>(`/ads/campaigns/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

  // Analytics
  static getAnalyticsSnapshot = (range: string = '30d') => this.request<any>(`/analytics/snapshot?range=${range}`);
  static getDailySummary = () => this.request<any>('/analytics/daily-summary');

  // Leads CRM
  static getLeads = (businessId?: string) => this.request<any[]>(`/leads${businessId ? `?businessId=${businessId}` : ''}`);
  static createLead = (data: any) => this.request<any>('/leads', { method: 'POST', body: JSON.stringify(data) });
  static updateLeadStatus = (id: string, status: string) => this.request<any>(`/leads/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

  // Competitors
  static getLocalCompetitorConfig = () =>
    this.request<{ configured: boolean; provider: string }>('/competitors/local-config');
  static searchLocalCompetitors = (data: { businessType: string; location: string }) =>
    this.request<LocalCompetitorSearchResult>('/competitors/local-search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  static analyzeCompetitor = (competitorUrl: string, businessId?: string) =>
    this.request<any>('/competitors/analyze', { method: 'POST', body: JSON.stringify({ competitorUrl, businessId }) });
  static getCompetitorsList = (businessId?: string) =>
    this.request<any[]>(`/competitors${businessId ? `?businessId=${businessId}` : ''}`);
  static addCompetitor = (data: { businessId?: string; name: string; domain: string }) =>
    this.request<any>('/competitors', { method: 'POST', body: JSON.stringify(data) });
  static deleteCompetitor = (id: string) =>
    this.request<any>(`/competitors/${id}`, { method: 'DELETE' });
  static addGapToSocialCalendar = (data: {
    businessId?: string;
    topic: string;
    caption: string;
    hashtags?: string[];
    targetPlatform?: string;
  }) => this.request<any>('/competitors/action/add-to-calendar', { method: 'POST', body: JSON.stringify(data) });

  // Automation
  static getAutomationStatus = () => this.request<any>('/automation/status');
  static pauseAllAutomation = () => this.request<any>('/automation/pause-all', { method: 'POST' });
  static resumeAllAutomation = () => this.request<any>('/automation/resume-all', { method: 'POST' });
  static toggleModule = (moduleId: string, isEnabled: boolean) => this.request<any>('/automation/toggle-module', { method: 'POST', body: JSON.stringify({ moduleId, isEnabled }) });
  static getActivityLogs = (businessId?: string) => this.request<any[]>(`/automation/logs${businessId ? `?businessId=${businessId}` : ''}`);

  // Approvals & Recommendations
  static getApprovals = (businessId?: string) => this.request<any[]>(`/approvals${businessId ? `?businessId=${businessId}` : ''}`);
  static resolveApproval = (id: string, action: 'APPROVED' | 'REJECTED') => this.request<any>(`/approvals/${id}/resolve`, { method: 'POST', body: JSON.stringify({ action }) });
  static generateApprovals = (businessId?: string) => this.request<any[]>('/approvals/generate', { method: 'POST', body: JSON.stringify({ businessId }) });
  static getRecommendations = (businessId?: string) => this.request<any[]>(`/approvals/recommendations${businessId ? `?businessId=${businessId}` : ''}`);
  static takeRecommendationAction = (id: string, action: string) => this.request<any>(`/approvals/recommendations/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) });
  static generateRecommendations = (businessId?: string) => this.request<any[]>('/approvals/recommendations/generate', { method: 'POST', body: JSON.stringify({ businessId }) });

  // Budget
  static getBudgetStatus = (businessId?: string) => this.request<any>(`/budget/status${businessId ? `?businessId=${businessId}` : ''}`);
  static updateBudgetLimits = (data: any) => this.request<any>('/budget/limits', { method: 'PUT', body: JSON.stringify(data) });

  // Reports
  static getReports = (businessId?: string) => this.request<any[]>(`/reports${businessId ? `?businessId=${businessId}` : ''}`);
  static generateReport = (type: string, businessId?: string) => this.request<any>('/reports/generate', { method: 'POST', body: JSON.stringify({ type, businessId }) });

  // Integrations
  static getIntegrations = () => this.request<any[]>('/integrations');
  static connectIntegration = (id: string) => this.request<any>(`/integrations/${id}/connect`, { method: 'POST' });
  static disconnectIntegration = (id: string) => this.request<any>(`/integrations/${id}/disconnect`, { method: 'POST' });

  // Subscriptions & Payments
  static getPlans = () => this.request<any>('/subscriptions/plans');
  static getCurrentSubscription = () => this.request<any>('/subscriptions/current');
  static upgradePlan = (planId: string) => this.request<any>('/subscriptions/upgrade', { method: 'POST', body: JSON.stringify({ planId }) });
  static getPaymentConfig = () =>
    this.request<{
      configured: boolean;
      preferredProvider?: 'cashfree' | 'razorpay' | 'sandbox';
      cashfree?: { configured: boolean; appId: string | null; env: string };
      razorpay?: { configured: boolean; keyId: string | null };
      keyId?: string | null;
      usdInrRate: number;
    }>('/payments/config');
  static createOrder = (data: {
    planId: string;
    billingCycle?: 'monthly' | 'yearly';
    walletAmount?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }) =>
    this.request<{
      provider?: 'cashfree' | 'razorpay';
      orderId: string;
      cfOrderId?: string;
      paymentSessionId?: string;
      amount: number;
      currency: string;
      keyId?: string;
      env?: string;
      plan: { id: string; name: string; priceInr?: number; priceUsd?: number; billingCycle: string };
    }>('/payments/create-order', { method: 'POST', body: JSON.stringify(data) });
  static verifyPayment = (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => this.request<any>('/payments/verify', { method: 'POST', body: JSON.stringify(data) });
  static verifyCashfreePayment = (orderId: string) =>
    this.request<any>('/payments/cashfree/verify', { method: 'POST', body: JSON.stringify({ order_id: orderId }) });
  static getWallet = () => this.request<any>('/wallet');

  // Email Report
  static emailReport = (id: string, to?: string) =>
    this.request<any>(`/reports/${id}/email`, { method: 'POST', body: JSON.stringify({ to }) });

  // Admin
  static getAdminMetrics = () => this.request<any>('/admin/metrics');
  static savePushToken = (token: string, adminAlerts?: boolean) =>
    this.request<any>('/push/token', { method: 'POST', body: JSON.stringify({ token, adminAlerts }) });
  static deletePushToken = (token: string) =>
    this.request<any>('/push/token', { method: 'DELETE', body: JSON.stringify({ token }) });
  static getPushOverview = () => this.request<any>('/push/admin/overview');
  static sendPushBroadcast = (data: { title: string; body: string; link?: string; mode: 'tokens' | 'topic' }) =>
    this.request<any>('/push/admin/broadcast', { method: 'POST', body: JSON.stringify(data) });
  static syncPushTopic = () => this.request<any>('/push/admin/sync-topic', { method: 'POST' });

  // Chat Copilot
  static sendChatMessage = (message: string, history?: any[], businessId?: string) =>
    this.request<any>('/chat/message', { method: 'POST', body: JSON.stringify({ message, history, businessId }) });

  // GEO & AEO (Generative Engine Optimization & Answer Engine Optimization)
  static getGeoMetrics = (businessId?: string) =>
    this.request<any>(`/geo/metrics${businessId ? `?businessId=${businessId}` : ''}`);

  static getLlmsTxt = (businessId?: string) =>
    this.request<any>(`/geo/llms-txt${businessId ? `?businessId=${businessId}` : ''}`);

  static simulateGeoQuery = (query: string, engine: string = 'Perplexity AI', businessId?: string) =>
    this.request<any>('/geo/simulate', { method: 'POST', body: JSON.stringify({ query, engine, businessId }) });

  static generateAeoSchema = (topic?: string, businessId?: string) =>
    this.request<any>('/geo/schema', { method: 'POST', body: JSON.stringify({ topic, businessId }) });

  static getCommunityThreads = (businessId?: string) =>
    this.request<any>(`/geo/community-threads${businessId ? `?businessId=${businessId}` : ''}`);

  // Poster AI Studio & Kling AI Engine
  static generatePoster = (data: {
    prompt: string;
    businessId?: string;
    aspectRatio?: '1:1' | '9:16' | '16:9';
    themeId?: string;
    imageMode?: 'gradient' | 'ai_photo';
    realismStyle?: 'google_flow_real' | 'commercial_photo' | 'luxury_editorial' | 'golden_hour' | 'cinematic' | 'lifestyle';
    lighting?: 'natural_daylight' | 'golden_hour' | 'studio_softbox' | 'ambient';
    engine?: 'kling' | 'google_flow' | 'auto';
    klingApiKey?: string;
  }) => this.request<any>('/posters/generate', { method: 'POST', body: JSON.stringify(data) });

  static testKlingApiKey = (apiKey?: string) =>
    this.request<any>('/posters/test-kling', { method: 'POST', body: JSON.stringify({ apiKey }) });

  // 100-User First Come First Serve Lifetime Access Slots
  static getSlotStatus = () => this.request<{
    totalSlots: number;
    claimedSlots: number;
    remainingSlots: number;
    isSoldOut: boolean;
    price: number;
    originalPrice: number;
    currency: string;
    discountPercent: number;
    slotNumber: number;
    recentClaims: Array<{ name: string; city: string; claimedAt: string }>;
  }>('/slots/status');

  static claimSlot = (data?: { name?: string; city?: string }) =>
    this.request<any>('/slots/claim', { method: 'POST', body: JSON.stringify(data || {}) });

  static bookSlot = (data: {
    name: string;
    phone: string;
    email: string;
    company?: string;
    slotDate?: string;
    slotTime?: string;
    notes?: string;
  }) => this.request<{
    success: boolean;
    message: string;
    slotNumber: number;
    totalSlots: number;
    remainingSlots: number;
    emailSent: boolean;
    booking: {
      name: string;
      phone: string;
      email: string;
      company?: string;
      slotDate: string;
      slotTime: string;
      slotNumber: number;
    };
  }>('/slots/book', { method: 'POST', body: JSON.stringify(data) });
}
