export interface BrandConfig {
  appName: string;
  tagline: string;
  shortDescription: string;
  version: string;
  contactEmail: string;
  supportUrl: string;
  companyName: string;
  year: number;
  theme: {
    primaryGradient: string;
    softLavender: string;
    softBlue: string;
    mint: string;
    peach: string;
    blush: string;
    cardRadius: string;
  };
  navigation: {
    dashboard: string;
    strategy: string;
    seo: string;
    content: string;
    social: string;
    ads: string;
    analytics: string;
    leads: string;
    competitors: string;
    automation: string;
    recommendations: string;
    reports: string;
    integrations: string;
    settings: string;
    admin: string;
  };
}

export const BRAND: BrandConfig = {
  appName: "Addon AI",
  tagline: "Your Autonomous AI CMO, Working 24/7.",
  shortDescription: "Autonomous AI-powered marketing engine connecting SEO, social media, ads, content creation, and analytics into one intelligent 24/7 system.",
  version: "2.4.0",
  contactEmail: "support@addon.ai",
  supportUrl: "https://addon.ai/support",
  companyName: "Addon Technologies Inc.",
  year: 2026,
  theme: {
    primaryGradient: "from-neutral-900 via-neutral-800 to-black",
    softLavender: "#F9F9F7",
    softBlue: "#F0F4F8",
    mint: "#E8F5E9",
    peach: "#FFF3E0",
    blush: "#FCE4EC",
    cardRadius: "rounded-2xl",
  },
  navigation: {
    dashboard: "Command Center",
    strategy: "AI Strategy",
    seo: "SEO Automation",
    content: "Content Studio",
    social: "Social Media & Calendar",
    ads: "Ads Manager",
    analytics: "Marketing Analytics",
    leads: "Lead Management",
    competitors: "Competitor Intel",
    automation: "Automation Engine",
    recommendations: "AI Recommendations",
    reports: "Executive Reports",
    integrations: "Connected Accounts",
    settings: "Business Settings",
    admin: "Admin Control",
  },
};

