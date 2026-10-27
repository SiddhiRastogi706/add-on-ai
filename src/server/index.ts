import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as Sentry from '@sentry/node';

dotenv.config();

// Initialize Sentry error tracking if SENTRY_DSN is configured
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  });
  console.log('🛡️ Sentry error monitoring initialized.');
}

import authRoutes from './routes/auth.routes';
import businessRoutes from './routes/business.routes';
import crawlerRoutes from './routes/crawler.routes';
import brainRoutes from './routes/brain.routes';
import seoRoutes from './routes/seo.routes';
import contentRoutes from './routes/content.routes';
import socialRoutes from './routes/social.routes';
import adsRoutes from './routes/ads.routes';
import analyticsRoutes from './routes/analytics.routes';
import leadsRoutes from './routes/leads.routes';
import competitorsRoutes from './routes/competitors.routes';
import automationRoutes from './routes/automation.routes';
import approvalsRoutes from './routes/approvals.routes';
import budgetRoutes from './routes/budget.routes';
import reportsRoutes from './routes/reports.routes';
import integrationsRoutes from './routes/integrations.routes';
import subscriptionsRoutes from './routes/subscriptions.routes';
import adminRoutes from './routes/admin.routes';
import chatRoutes from './routes/chat.routes';
import geoRoutes from './routes/geo.routes';
import posterRoutes from './routes/poster.routes';
import { photoPosterRouter, templatesRouter, mediaRouter } from './routes/photo-poster.routes';
import helmet from 'helmet';
import slotsRoutes from './routes/slots.routes';
import paymentsRoutes from './routes/payments.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import emailRoutes from './routes/email.routes';
import walletRoutes from './routes/wallet.routes';
import pushRoutes from './routes/push.routes';
import { RedisService } from './services/redis.service';
import { GeoAgent } from './ai/agents/geo.agent';
import { prisma } from './db';
import { AutomationEngine } from './automation/engine';
import { BRAND } from '../config/brand';
import { globalLimiter } from './middleware/rate-limit';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

// Requirement 7: Canonical HTTPS & Non-WWW Redirection Middleware
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const isWww = host.startsWith('www.');

  if (process.env.NODE_ENV === 'production') {
    if (isWww || proto === 'http') {
      const cleanHost = host.replace(/^www\./, '');
      return res.redirect(301, `https://${cleanHost}${req.originalUrl}`);
    }
  }

  // Security headers for HTTPS & SEO
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(globalLimiter);
app.use(cors());
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Brand info endpoint
app.get('/api/brand', (req, res) => {
  res.json(BRAND);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    product: BRAND.appName,
    tagline: BRAND.tagline,
    version: BRAND.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Redis status & latency telemetry endpoint
app.get('/api/redis/status', async (req, res) => {
  const status = await RedisService.getStatus();
  res.json(status);
});

// Download full project zip file
app.get('/api/download-project', (req, res) => {
  const possiblePaths = [
    path.resolve(__dirname, '../../marketmind-ai.zip'),
    path.resolve(__dirname, '../../../marketmind-ai.zip'),
    'C:/Users/user/Downloads/marketmind-ai.zip',
    'C:/Users/user/Desktop/marketmind-ai.zip'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="marketmind-ai.zip"');
      return res.download(p, 'marketmind-ai.zip');
    }
  }

  res.status(404).json({ error: 'Zip file not found' });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/crawler', crawlerRoutes);
app.use('/api/brain', brainRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/competitors', competitorsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/posters', photoPosterRouter);
app.use('/api/posters', posterRoutes);
app.use('/api/templates', templatesRouter);
app.use('/api/media', mediaRouter);
app.use('/api/slots', slotsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/email', emailRoutes);

// Public standard machine-readable llms.txt endpoint (for GPTBot, PerplexityBot, ClaudeBot, etc.)
app.get('/llms.txt', async (req, res) => {
  try {
    const biz = await prisma.business.findFirst({ orderBy: { createdAt: 'desc' } });
    const content = GeoAgent.generateLlmsTxt(biz);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  } catch (err: any) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(`# MarketMind AI — LLMs.txt\n> Autonomous Marketing Intelligence Platform\n`);
  }
});

// =========================================================================
// REQUIREMENT 1: Public robots.txt endpoint (Must return 200 OK)
// =========================================================================
app.get('/robots.txt', (req, res) => {
  const robots = `# Robots.txt for Truck Mitra (https://truckmitra.in)
# India's #1 Digital Freight & Commercial Truck Booking Platform
User-agent: *
Allow: /
Allow: /p/*
Allow: /assets/*

# Disallow private user/admin and sensitive API endpoints
Disallow: /login
Disallow: /register
Disallow: /auth
Disallow: /admin
Disallow: /admin/
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /api/

# Canonical XML Sitemap
Sitemap: https://truckmitra.in/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(robots);
});

// =========================================================================
// REQUIREMENT 2: Public sitemap.xml endpoint (Must return 200 OK with dynamic <lastmod>)
// =========================================================================
app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const publicPages = [
    { loc: 'https://truckmitra.in/', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://truckmitra.in/p/features', priority: '0.8', changefreq: 'weekly' },
    { loc: 'https://truckmitra.in/p/how-it-works', priority: '0.8', changefreq: 'weekly' },
    { loc: 'https://truckmitra.in/p/services', priority: '0.8', changefreq: 'weekly' },
    { loc: 'https://truckmitra.in/p/reviews', priority: '0.8', changefreq: 'weekly' },
    { loc: 'https://truckmitra.in/p/about', priority: '0.8', changefreq: 'monthly' },
    { loc: 'https://truckmitra.in/p/careers', priority: '0.7', changefreq: 'monthly' },
    { loc: 'https://truckmitra.in/p/contact', priority: '0.8', changefreq: 'monthly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

  for (const page of publicPages) {
    xml += `  <url>\n    <loc>${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  }
  xml += `</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(xml);
});

// Serve static client assets (logo.svg, logo.png, assets/og-banner.png, etc.)
const publicDir = path.resolve(__dirname, '../../src/client/public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { maxAge: '7d' }));
}

// =========================================================================
// REQUIREMENT 4: Pre-rendered SEO Meta Injection for /p/:slug routes
// =========================================================================
const SEO_PAGE_META: Record<string, { title: string; description: string; canonical: string }> = {
  features: {
    title: 'Features & Fleet Solutions - Truck Mitra Freight Network',
    description: 'Explore Truck Mitra platform features: automated load matching, digital FASTag payments, electronic Proof of Delivery (e-PoD), and live GPS fleet tracking.',
    canonical: 'https://truckmitra.in/p/features',
  },
  'how-it-works': {
    title: 'How It Works - Simple 3-Step Truck Booking with Truck Mitra',
    description: 'Learn how Truck Mitra simplifies freight logistics. Post loads, get instant competitive bids from verified fleet owners, and track cargo from dispatch to delivery.',
    canonical: 'https://truckmitra.in/p/how-it-works',
  },
  services: {
    title: 'Transport Services - FTL, PTL & Commercial Freight | Truck Mitra',
    description: 'Discover Truck Mitra commercial freight services: Full Truckload (FTL), Part Truckload (PTL), container transport, express cargo, and cold-chain logistics.',
    canonical: 'https://truckmitra.in/p/services',
  },
  reviews: {
    title: 'Customer Reviews & Success Stories - Truck Mitra Logistics',
    description: 'Read real reviews from 10,000+ shippers and fleet owners who rely on Truck Mitra for fast truck dispatch, reliable drivers, and guaranteed zero-hidden-fee pricing.',
    canonical: 'https://truckmitra.in/p/reviews',
  },
  about: {
    title: "About Truck Mitra - India's Premier Digital Freight Marketplace",
    description: 'Truck Mitra is revolutionizing Indian commercial logistics by empowering transporters, drivers, and manufacturers with transparent pricing and digital tools.',
    canonical: 'https://truckmitra.in/p/about',
  },
  careers: {
    title: 'Careers at Truck Mitra - Join the Logistics Revolution',
    description: 'Build the future of Indian freight transport with Truck Mitra. Explore open career opportunities in engineering, operations, product design, and freight sales.',
    canonical: 'https://truckmitra.in/p/careers',
  },
  contact: {
    title: 'Contact Truck Mitra - 24/7 Transport & Customer Support',
    description: 'Get in touch with Truck Mitra support team. Call +91-80767-45291 or email support@truckmitra.in for instant truck booking assistance and enterprise transport queries.',
    canonical: 'https://truckmitra.in/p/contact',
  },
};

app.get(['/', '/p/:slug', '/p'], (req, res) => {
  const slug = req.params.slug;
  const isHome = !slug;
  const meta = isHome
    ? {
        title: 'Truck Mitra - Online Truck Transport, Freight Booking & Logistics India',
        description: 'Truck Mitra connects shippers with 50,000+ verified trucks across India. Get instant freight quotes, live GPS tracking, and transparent transport rates 24/7.',
        canonical: 'https://truckmitra.in/',
      }
    : (SEO_PAGE_META[slug] || SEO_PAGE_META.features);

  const htmlPath = path.resolve(__dirname, '../../dist/client/index.html');
  const fallbackHtml = path.resolve(__dirname, '../../src/client/index.html');
  const targetPath = fs.existsSync(htmlPath) ? htmlPath : fallbackHtml;

  if (fs.existsSync(targetPath)) {
    let html = fs.readFileSync(targetPath, 'utf8');
    html = html.replace(/<title>.*?<\/title>/i, `<title>${meta.title}</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${meta.description}" />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${meta.canonical}" />`);
    html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${meta.title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${meta.description}" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${meta.canonical}" />`);
    html = html.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${meta.title}" />`);
    html = html.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${meta.description}" />`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  res.status(404).send('Not Found');
});

// Serve client static build files (CSS, JS, media chunks)
const clientDist = path.join(__dirname, '../../dist/client');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Attach Sentry Express error handler if configured
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred in the Marketing Brain engine.',
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ${BRAND.appName} Server running on port ${PORT}`);
  console.log(`   Tagline: "${BRAND.tagline}"`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);

  // Start background automation workers
  AutomationEngine.start();
});

export default app;
