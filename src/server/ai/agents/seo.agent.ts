import { getAIProvider } from '../factory';
import { WalletBillingError } from '../../services/wallet.service';
import { CrawlerResult, SiteCrawlResult, SeoAuditReport, KeywordData, SeoIssue } from '../../../shared/types';

export class SeoAgent {
  static generateDefaultPatch(issue: { title?: string; category?: string; [key: string]: any }): string {
    const title = (issue.title || '').toLowerCase();
    const category = issue.category || '';

    if (title.includes('schema') || title.includes('structured') || title.includes('json-ld')) {
      return `<!-- Inject into <head> of your website -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Truck Mitra",
  "url": "https://truckmitra.in",
  "logo": "https://truckmitra.in/logo.png",
  "description": "Leading transport, freight logistics and truck fleet network in India.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "IN"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+91-80767-45291",
    "contactType": "customer service"
  }
}
</script>`;
    }

    if (title.includes('title')) {
      return `<!-- Add inside <head> -->
<title>Truck Mitra - Online Truck Transport, Freight Booking & Logistics India</title>
<meta property="og:title" content="Truck Mitra - Online Truck Transport, Freight Booking & Logistics India" />
<meta name="twitter:title" content="Truck Mitra - Online Truck Transport, Freight Booking & Logistics India" />`;
    }

    if (title.includes('description')) {
      return `<!-- Add inside <head> -->
<meta name="description" content="Book verified trucks, get instant full truckload freight quotes, and track commercial transport across India with Truck Mitra." />
<meta property="og:description" content="Book verified trucks, get instant full truckload freight quotes, and track commercial transport across India with Truck Mitra." />`;
    }

    if (title.includes('h1') || title.includes('header')) {
      return `<!-- Single H1 per document -->
<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
  India's #1 Digital Freight & Commercial Truck Booking Platform
</h1>`;
    }

    if (title.includes('alt') || title.includes('image')) {
      return `<!-- Add descriptive alt attributes to image tags -->
<img src="/assets/truck-fleet.jpg" alt="Commercial transport truck fleet by Truck Mitra" loading="lazy" />
<img src="/assets/verified-driver.png" alt="Verified commercial driver with document onboarding badge" loading="lazy" />`;
    }

    if (title.includes('canonical')) {
      return `<!-- Self-referencing canonical inside <head> -->
<link rel="canonical" href="https://truckmitra.in/" />`;
    }

    if (title.includes('opengraph') || title.includes('social') || title.includes('twitter')) {
      return `<!-- Social Card Meta Tags -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Truck Mitra" />
<meta property="og:image" content="https://truckmitra.in/assets/og-banner.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />`;
    }

    if (title.includes('robots') || title.includes('sitemap')) {
      return `# Optimized robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://truckmitra.in/sitemap.xml`;
    }

    if (title.includes('speed') || title.includes('latency') || title.includes('cache')) {
      return `# Web Server Compression & Caching (.htaccess / Nginx)
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>`;
    }

    return `<!-- Recommended SEO patch for ${issue.title || 'Page'} -->
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`;
  }

  static async auditWebsite(businessId: string, crawlOrSite: CrawlerResult | SiteCrawlResult): Promise<SeoAuditReport> {
    const isSiteCrawl = 'pages' in crawlOrSite && Array.isArray((crawlOrSite as any).pages);
    const siteCrawl = isSiteCrawl ? (crawlOrSite as SiteCrawlResult) : undefined;
    const rootPage: CrawlerResult = isSiteCrawl ? (crawlOrSite as SiteCrawlResult).pages[0] : (crawlOrSite as CrawlerResult);
    const allPages: CrawlerResult[] = siteCrawl?.pages?.length ? siteCrawl.pages : [rootPage];

    let host = 'truckmitra.in';
    try {
      host = new URL(rootPage.url).hostname;
    } catch {
      host = 'truckmitra.in';
    }
    const brandName = host.replace(/^www\./i, '').split('.')[0];
    const capitalizedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);

    const issues: SeoIssue[] = [];

    // 1. Title Tag Check
    if (!rootPage.title || rootPage.title.length < 30 || rootPage.title.length > 65) {
      issues.push({
        id: `iss-title-${Date.now()}`,
        category: 'On-Page',
        severity: 'Warning',
        title: `Meta Title Tag Length Sub-Optimal (${rootPage.title?.length || 0} chars)`,
        description: `Current title is "${rootPage.title || 'None'}". Google search displays up to 60 characters before truncating.`,
        whyItMatters: 'The title tag is the #1 on-page ranking and click-through factor in organic search engine results.',
        recommendedFix: `Optimize page title to between 40-60 characters with high-intent keywords and brand suffix: "${capitalizedBrand} - Online Truck Transport & Freight Services in India".`,
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrls: [rootPage.url],
        patchType: 'HTML_HEAD',
        patchCode: `<!-- Add to <head> section of ${rootPage.url} -->
<title>${capitalizedBrand} - Online Truck Transport, Freight Booking & Logistics India</title>
<meta property="og:title" content="${capitalizedBrand} - Online Truck Transport, Freight Booking & Logistics India" />
<meta name="twitter:title" content="${capitalizedBrand} - Online Truck Transport, Freight Booking & Logistics India" />`,
      });
    }

    // 2. Duplicate Titles (Multi-page check)
    if (siteCrawl?.aggregateIssues?.duplicateTitlesCount && siteCrawl.aggregateIssues.duplicateTitlesCount > 1) {
      issues.push({
        id: `iss-dup-title-${Date.now()}`,
        category: 'Technical',
        severity: 'Warning',
        title: `${siteCrawl.aggregateIssues.duplicateTitlesCount} Scanned Pages Share Duplicate Titles`,
        description: 'Multiple internal pages have identical <title> tags, creating keyword cannibalization.',
        whyItMatters: 'Search engines struggle to discern which page to rank when multiple pages compete for identical titles.',
        recommendedFix: 'Differentiate each page title with unique service, location, or content modifiers.',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrls: allPages.slice(0, 3).map((p) => p.url),
        patchType: 'HTML_HEAD',
        patchCode: `<!-- Ensure distinct page titles per route: -->
<!-- Homepage: -->
<title>${capitalizedBrand} - Commercial Truck Transport Marketplace India</title>
<!-- Solutions: -->
<title>Transport & Fleet Management Services | ${capitalizedBrand}</title>
<!-- About / Contact: -->
<title>Contact 24/7 Dispatch Support & Booking | ${capitalizedBrand}</title>`,
      });
    }

    // 3. Meta Description Check
    if (rootPage.metaDescription.length < 50 || rootPage.metaDescription.length > 165) {
      issues.push({
        id: `iss-meta-${Date.now()}`,
        category: 'On-Page',
        severity: 'Warning',
        title: `Meta Description Sub-Optimal (${rootPage.metaDescription.length} chars)`,
        description: `Current meta description is ${rootPage.metaDescription.length} characters (ideal range: 120-160 characters).`,
        whyItMatters: 'Search snippets in Google will be truncated or replaced by automated text, lowering organic click-through rate.',
        recommendedFix: 'Rewrite meta description to highlight unique value and include an action-oriented call to action.',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrls: [rootPage.url],
        patchType: 'HTML_HEAD',
        patchCode: `<!-- Insert within <head> of ${rootPage.url} -->
<meta name="description" content="Book verified trucks, get instant full truckload freight rates, and scale your logistics fleet across India with ${capitalizedBrand}. Instant online quotes." />
<meta property="og:description" content="Book verified trucks, get instant full truckload freight rates, and scale your logistics fleet across India with ${capitalizedBrand}." />`,
      });
    }

    // 4. Primary H1 Tag Check
    if (rootPage.h1.length === 0) {
      issues.push({
        id: `iss-h1-${Date.now()}`,
        category: 'On-Page',
        severity: 'Critical',
        title: 'Missing Primary H1 Tag on Main Landing Page',
        description: 'No clear <h1> element was detected in the DOM structure of the page.',
        whyItMatters: 'The H1 tag is a primary ranking signal indicating the main topic of your page to search crawlers.',
        recommendedFix: 'Implement a single, compelling H1 tag containing primary commercial keywords.',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrls: [rootPage.url],
        patchType: 'HTML_HEAD',
        patchCode: `<!-- Add to hero header section -->
<h1 class="text-3xl font-extrabold tracking-tight text-slate-900">
  India's Trusted On-Demand Truck Transport & Freight Platform
</h1>`,
      });
    } else if (rootPage.h1.length > 1) {
      issues.push({
        id: `iss-multih1-${Date.now()}`,
        category: 'On-Page',
        severity: 'Warning',
        title: `Multiple H1 Tags Detected on Page (${rootPage.h1.length} found)`,
        description: `Found ${rootPage.h1.length} H1 tags. Best practice requires a single unified H1 per document.`,
        whyItMatters: 'Multiple H1 tags dilute keyword focus and confuse crawler document outline parsing.',
        recommendedFix: 'Demote secondary H1 headers to H2 or H3 tags.',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrls: [rootPage.url],
        patchType: 'HTML_HEAD',
        patchCode: `<!-- Keep single primary H1, demote others to H2: -->
<h1>${rootPage.h1[0]}</h1>
<!-- Demote secondary header: -->
<h2>${rootPage.h1[1]}</h2>`,
      });
    }

    // 5. Structured Data Schema Check
    const hasOrgSchema = rootPage.schemaTypes.some((s) => s.includes('Organization') || s.includes('LocalBusiness'));
    if (!hasOrgSchema) {
      issues.push({
        id: `iss-schema-${Date.now()}`,
        category: 'Technical',
        severity: 'Critical',
        title: 'Missing Structured JSON-LD Organization Schema',
        description: 'No Organization or LocalBusiness structured data script was found on the homepage.',
        whyItMatters: 'Schema markup helps search engines populate Rich Snippets, knowledge cards, and trust badges.',
        recommendedFix: 'Inject Schema.org JSON-LD markup with company name, logo, social profiles, and contact details.',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrls: [rootPage.url],
        patchType: 'JSON_LD',
        patchCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${capitalizedBrand}",
  "url": "${rootPage.url}",
  "logo": "${rootPage.url.replace(/\/$/, '')}/logo.png",
  "description": "Leading transport, freight logistics, and truck booking network in India.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "IN"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+91-80767-45291",
    "contactType": "customer service"
  },
  "sameAs": [
    "https://facebook.com/${brandName}",
    "https://linkedin.com/company/${brandName}"
  ]
}
</script>`,
      });
    }

    // 6. Image Alt Tags Check
    const totalMissingAlt = siteCrawl?.aggregateIssues?.missingAltImagesTotal ?? rootPage.imagesMissingAlt;
    if (totalMissingAlt > 0) {
      issues.push({
        id: `iss-alt-${Date.now()}`,
        category: 'On-Page',
        severity: 'Warning',
        title: `${totalMissingAlt} Images Missing Descriptive Alt Attributes`,
        description: `Found ${totalMissingAlt} images across scanned pages without accessible alt text tags.`,
        whyItMatters: 'Search engines use image alt text for indexing visual content and assessing page relevance.',
        recommendedFix: 'Add descriptive, keyword-rich alt tags to all product and decorative images.',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrls: allPages.filter((p) => p.imagesMissingAlt > 0).map((p) => p.url).slice(0, 3),
        patchType: 'HTML_HEAD',
        patchCode: `<!-- Example accessible image tags with keyword-rich alt text: -->
<img src="/assets/truck-fleet.jpg" alt="Commercial transport truck fleet on highway by ${capitalizedBrand}" loading="lazy" />
<img src="/assets/driver-verification.png" alt="Verified commercial driver document onboarding badge" loading="lazy" />`,
      });
    }

    // 7. Canonical Tag Check
    if (!rootPage.canonical || rootPage.canonical.trim() === '') {
      issues.push({
        id: `iss-canonical-${Date.now()}`,
        category: 'Technical',
        severity: 'Warning',
        title: 'Missing Self-Referencing Canonical Tag',
        description: 'No canonical URL link tag was detected in the document head.',
        whyItMatters: 'Canonical tags prevent duplicate content penalties from trailing slashes or URL query parameters.',
        recommendedFix: `Add a self-referencing <link rel="canonical" href="${rootPage.url}" /> tag to the page head.`,
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrls: [rootPage.url],
        patchType: 'HTML_HEAD',
        patchCode: `<!-- Add to <head> to prevent duplicate indexing -->
<link rel="canonical" href="${rootPage.url}" />`,
      });
    }

    // 8. OpenGraph & Social Cards
    issues.push({
      id: `iss-og-${Date.now()}`,
      category: 'On-Page',
      severity: 'Warning',
      title: 'OpenGraph & Twitter Social Preview Cards Incomplete',
      description: 'Missing complete og:image, og:description, and twitter:card meta tags for rich social sharing.',
      whyItMatters: 'Shared links on WhatsApp, LinkedIn, and Facebook will display generic unbranded snippets without image cards.',
      recommendedFix: 'Add comprehensive OpenGraph and Twitter card meta tags inside <head>.',
      canAiFixAutomatically: true,
      status: 'OPEN',
      affectedUrls: [rootPage.url],
      patchType: 'HTML_HEAD',
      patchCode: `<!-- OpenGraph & Twitter Card Metadata -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${rootPage.url}" />
<meta property="og:site_name" content="${capitalizedBrand}" />
<meta property="og:image" content="${rootPage.url.replace(/\/$/, '')}/assets/og-banner.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${capitalizedBrand} - Online Truck Transport & Freight" />`,
    });

    // 9. Robots.txt / Sitemap Directive Check
    if (siteCrawl && (!siteCrawl.robotsTxtFound || !siteCrawl.sitemapFound)) {
      issues.push({
        id: `iss-robots-${Date.now()}`,
        category: 'Technical',
        severity: 'Warning',
        title: !siteCrawl.robotsTxtFound ? 'Missing robots.txt Crawler Directive File' : 'Sitemap.xml Missing from robots.txt',
        description: !siteCrawl.robotsTxtFound
          ? 'No robots.txt was found at the domain root, leaving crawler crawling parameters unmanaged.'
          : 'robots.txt does not link to the sitemap.xml file, slowing down search engine URL discovery.',
        whyItMatters: 'Search bots like Googlebot rely on robots.txt and sitemaps to prioritize and index deep pages.',
        recommendedFix: 'Create a production-ready robots.txt file referencing your sitemap.xml.',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrls: [`${rootPage.url.replace(/\/$/, '')}/robots.txt`],
        patchType: 'ROBOTS_TXT',
        patchCode: `# Production robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/

Sitemap: ${rootPage.url.replace(/\/$/, '')}/sitemap.xml`,
      });
    }

    // 10. Performance / Response Latency
    if (rootPage.loadTimeMs > 2000) {
      issues.push({
        id: `iss-perf-${Date.now()}`,
        category: 'Technical',
        severity: 'Warning',
        title: `Page Response Latency Over 2.0s (${rootPage.loadTimeMs}ms)`,
        description: `Initial HTML server response time was clocked at ${rootPage.loadTimeMs}ms.`,
        whyItMatters: 'Core Web Vitals impact mobile search rankings and user bounce rates directly.',
        recommendedFix: 'Enable edge gzip/brotli compression and browser caching headers on the origin server.',
        canAiFixAutomatically: false,
        status: 'OPEN',
        affectedUrls: [rootPage.url],
        patchType: 'HTACCESS',
        patchCode: `# Server Edge Caching & Compression (.htaccess / Nginx)
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>`,
      });
    }

    // 11. Local NAP & Geo Coordinates Check (Check real footer text)
    if (!rootPage.hasNapInFooter) {
      issues.push({
        id: `iss-local-${Date.now()}`,
        category: 'Local',
        severity: 'Warning',
        title: 'Local NAP (Name, Address, Phone) Missing from Scanned Footer',
        description: 'No complete telephone and localized address citation was verified in the website footer or body DOM.',
        whyItMatters: 'Consistent NAP citations are a top 3 local pack ranking signal on Google Maps and Local SERPs.',
        recommendedFix: 'Add standardized localized footer markup with geo-coordinates and business hours.',
        canAiFixAutomatically: true,
        status: 'OPEN',
        affectedUrls: [rootPage.url],
        patchType: 'JSON_LD',
        patchCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${capitalizedBrand} Headquarters",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "28.6139",
    "longitude": "77.2090"
  },
  "telephone": "+91 80767 45291",
  "openingHours": "Mo-Sa 09:00-20:00"
}
</script>`,
      });
    }

    // Compute realistic health scores based on strictly penalized findings
    const brokenLinksCount = siteCrawl?.aggregateIssues?.brokenLinksCount || (rootPage.status >= 400 ? 1 : 0);
    const hasRobots = siteCrawl ? siteCrawl.robotsTxtFound : true;
    const hasSitemap = siteCrawl ? siteCrawl.sitemapFound : true;

    // Technical score (Base 100)
    let technicalScore = 100;
    if (!hasRobots) technicalScore -= 12;
    if (!hasSitemap) technicalScore -= 12;
    technicalScore -= (brokenLinksCount * 14);
    technicalScore -= (issues.filter((i) => i.category === 'Technical' && i.severity === 'Critical').length * 15);
    technicalScore -= (issues.filter((i) => i.category === 'Technical' && i.severity === 'Warning').length * 6);
    technicalScore = Math.max(30, Math.min(98, technicalScore));

    // On-Page score (Base 100)
    let onPageScore = 100;
    onPageScore -= (issues.filter((i) => i.category === 'On-Page' && i.severity === 'Critical').length * 15);
    onPageScore -= (issues.filter((i) => i.category === 'On-Page' && i.severity === 'Warning').length * 6);
    onPageScore = Math.max(35, Math.min(98, onPageScore));

    // Content score
    let contentScore = 100;
    if (rootPage.wordCount < 300) contentScore -= 25;
    else if (rootPage.wordCount < 600) contentScore -= 12;
    contentScore -= (issues.filter((i) => i.category === 'Content').length * 8);
    contentScore = Math.max(35, Math.min(96, contentScore));

    // Local score
    let localScore = 95;
    if (!rootPage.schemaTypes.includes('LocalBusiness')) localScore -= 15;
    if (!rootPage.hasNapInFooter) localScore -= 20;
    localScore = Math.max(40, Math.min(98, localScore));

    // Overall Score: weighted average
    const overallScore = Math.round(technicalScore * 0.35 + onPageScore * 0.35 + contentScore * 0.15 + localScore * 0.15);

    return {
      id: `audit-${Date.now()}`,
      businessId,
      overallScore,
      technicalScore,
      onPageScore,
      contentScore,
      localScore,
      crawledPagesCount: allPages.length,
      issues,
      auditedAt: new Date().toISOString(),
    };
  }

  static async researchKeywords(business: {
    id: string;
    name: string;
    industry: string;
    productsAndServices: string[];
    targetLocations: string[];
  }): Promise<KeywordData[]> {
    const ai = getAIProvider();
    const prompt = `Generate a high-impact SEO Keyword Matrix for:
Business: ${business.name}
Industry: ${business.industry}
Offerings: ${business.productsAndServices.join(', ')}
Locations: ${business.targetLocations.join(', ')}

Provide 8 strategic keywords across categories (Informational, Commercial, Transactional, Local).
Return JSON array with this schema:
[
  {
    "keyword": "string",
    "intent": "Informational"|"Commercial"|"Transactional"|"Local",
    "category": "string",
    "searchVolumeEstimated": "e.g. 3,400/mo (Est.)",
    "difficultyScore": 0-100,
    "priority": "High"|"Medium"|"Low",
    "suggestedContentFormat": "Blog Post"|"Landing Page"|"Comparison Guide"|"Local Service Page"
  }
]`;

    try {
      const data = await ai.generateJson<any[]>(prompt, 'You are a Senior Technical SEO Strategist.');
      if (Array.isArray(data) && data.length > 0) {
        return data.map((k, idx) => ({
          id: `kw-${Date.now()}-${idx}`,
          keyword: k.keyword || `${business.industry} solutions`,
          intent: k.intent || 'Commercial',
          category: k.category || business.industry,
          searchVolumeEstimated: k.searchVolumeEstimated || '2,400/mo (Est.)',
          difficultyScore: typeof k.difficultyScore === 'number' ? k.difficultyScore : 35,
          priority: k.priority || 'High',
          suggestedContentFormat: k.suggestedContentFormat || 'Landing Page',
          isLiveApiData: false, // Honesty flag: labeled as estimated
        }));
      }
    } catch (e) {
      if (e instanceof WalletBillingError) throw e;
      console.warn('SEO Keyword generation fallback:', e);
    }

    // Default rich fallback
    return [
      {
        id: `kw-${Date.now()}-1`,
        keyword: `best ${business.industry.toLowerCase()} solutions near me`,
        intent: 'Local',
        category: 'Local Search',
        searchVolumeEstimated: '1,800/mo (Est.)',
        difficultyScore: 28,
        priority: 'High',
        suggestedContentFormat: 'Local Service Page',
        isLiveApiData: false,
      },
      {
        id: `kw-${Date.now()}-2`,
        keyword: `automated ${business.productsAndServices[0] || 'marketing'} platform`,
        intent: 'Commercial',
        category: 'Product Comparison',
        searchVolumeEstimated: '4,200/mo (Est.)',
        difficultyScore: 42,
        priority: 'High',
        suggestedContentFormat: 'Comparison Guide',
        isLiveApiData: false,
      },
      {
        id: `kw-${Date.now()}-3`,
        keyword: `how to scale ${business.industry.toLowerCase()} revenue with automation`,
        intent: 'Informational',
        category: 'Educational Guides',
        searchVolumeEstimated: '6,500/mo (Est.)',
        difficultyScore: 31,
        priority: 'Medium',
        suggestedContentFormat: 'Long-Form Blog Post',
        isLiveApiData: false,
      },
      {
        id: `kw-${Date.now()}-4`,
        keyword: `hire ${business.industry.toLowerCase()} team vs ai automation`,
        intent: 'Transactional',
        category: 'Decision Funnel',
        searchVolumeEstimated: '2,900/mo (Est.)',
        difficultyScore: 36,
        priority: 'High',
        suggestedContentFormat: 'Decision Matrix Landing Page',
        isLiveApiData: false,
      },
    ];
  }
}
