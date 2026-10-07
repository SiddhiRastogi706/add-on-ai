import { GoogleAuthService } from '../src/server/services/google-auth.service';
import { GA4Service } from '../src/server/services/ga4.service';
import { DataForSeoService } from '../src/server/services/dataforseo.service';
import {
  detectBrandVisibility,
  extractCleanDomain,
  AiVisibilityService,
} from '../src/server/services/ai-visibility.service';
import { StorageService } from '../src/server/services/storage.service';

async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3 Pure Logic Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // =========================================================================
  // 1. Shared Google Auth Helper & Caching
  // =========================================================================
  console.log('--- 1. Shared Google Auth Helper ---');
  {
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const originalRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REFRESH_TOKEN;

    assert(
      GoogleAuthService.isConfigured() === false,
      'isConfigured must return false when Google OAuth env vars are missing'
    );

    const tokenWhenUnconfigured = await GoogleAuthService.getAccessToken();
    assert(
      tokenWhenUnconfigured === null,
      'getAccessToken must return null when unconfigured'
    );

    process.env.GOOGLE_CLIENT_ID = 'test-client-id-12345';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret-67890';
    process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token-abcdef';

    assert(
      GoogleAuthService.isConfigured() === true,
      'isConfigured must return true when credentials exist'
    );

    const config = GoogleAuthService.getConfig();
    assert(config.clientId === 'test-client-id-12345', 'getConfig resolves clientId');
    assert(config.clientSecret === 'test-client-secret-67890', 'getConfig resolves clientSecret');
    assert(config.refreshToken === 'test-refresh-token-abcdef', 'getConfig resolves refreshToken');

    // Restore original env
    if (originalClientId) process.env.GOOGLE_CLIENT_ID = originalClientId;
    else delete process.env.GOOGLE_CLIENT_ID;
    if (originalClientSecret) process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
    else delete process.env.GOOGLE_CLIENT_SECRET;
    if (originalRefreshToken) process.env.GOOGLE_REFRESH_TOKEN = originalRefreshToken;
    else delete process.env.GOOGLE_REFRESH_TOKEN;
  }

  // =========================================================================
  // 2. GA4 Service Guardrails
  // =========================================================================
  console.log('\n--- 2. GA4 Service Guardrails ---');
  {
    delete process.env.GA4_PROPERTY_ID;
    const ga4Res = await GA4Service.getReport();
    assert(
      ga4Res.configured === false,
      'GA4Service.getReport returns configured: false when GA4_PROPERTY_ID is unset'
    );
    assert(
      ga4Res.message?.includes('GA4 not configured') === true,
      'GA4 unconfigured message provides guidance on property ID and scopes'
    );

    process.env.GA4_PROPERTY_ID = '987654321';
    const cfg = GA4Service.getConfig();
    assert(cfg.propertyId === '987654321', 'GA4Service.getConfig correctly reads propertyId');
    delete process.env.GA4_PROPERTY_ID;
  }

  // =========================================================================
  // 3. DataForSEO Service Logic & Formatting
  // =========================================================================
  console.log('\n--- 3. DataForSEO Service Logic & Formatting ---');
  {
    // Search Volume Number Formatting
    assert(DataForSeoService.formatVolume(1200) === '1.2K/mo', '1200 formatted as 1.2K/mo');
    assert(DataForSeoService.formatVolume(15500) === '15.5K/mo', '15500 formatted as 15.5K/mo');
    assert(DataForSeoService.formatVolume(1000000) === '1M/mo', '1000000 formatted as 1M/mo');
    assert(DataForSeoService.formatVolume(2500000) === '2.5M/mo', '2500000 formatted as 2.5M/mo');
    assert(DataForSeoService.formatVolume(450) === '450/mo', '450 formatted as 450/mo');
    assert(DataForSeoService.formatVolume(0) === '0/mo', '0 formatted as 0/mo');

    delete process.env.DATAFORSEO_LOGIN;
    delete process.env.DATAFORSEO_PASSWORD;

    assert(
      DataForSeoService.isConfigured() === false,
      'DataForSeoService.isConfigured returns false when login/password are unset'
    );

    const emptyRes = await DataForSeoService.getSearchVolume(['marketing automation']);
    assert(emptyRes.size === 0, 'Unconfigured DataForSeoService returns empty map without throwing');
  }

  // =========================================================================
  // 4. Domain Cleaner & AI Visibility Pure Detection Logic
  // =========================================================================
  console.log('\n--- 4. AI Visibility Pure Detection Logic ---');
  {
    // Domain extractor tests
    assert(
      extractCleanDomain('https://www.marketmind.ai/about') === 'marketmind.ai',
      'extractCleanDomain strips https and www'
    );
    assert(
      extractCleanDomain('http://sub.domain.co.in/path?query=1#hash') === 'sub.domain.co.in',
      'extractCleanDomain strips query and path'
    );

    const mockCompetitors = [
      { name: 'HubSpot', domain: 'hubspot.com' },
      { name: 'Marketo', domain: 'marketo.com' },
      { name: 'Semrush', domain: 'semrush.com' },
    ];

    // Case 1: Brand mentioned in text by name
    const sampleText1 =
      'When scaling growth, MarketMind AI is an exceptional platform for automated workflows. Other options include HubSpot and Marketo.';
    const res1 = detectBrandVisibility({
      text: sampleText1,
      citations: ['https://techcrunch.com/article'],
      businessName: 'MarketMind AI',
      websiteUrl: 'https://marketmind.ai',
      competitors: mockCompetitors,
    });
    assert(res1.brandMentioned === true, 'Detects brand mention in text');
    assert(res1.mentionPosition === 21, 'Accurately locates first mention index in text');
    assert(res1.domainInCitations === false, 'Domain not in citations');
    assert(
      res1.competitorsMentioned.includes('HubSpot') && res1.competitorsMentioned.includes('Marketo'),
      'Identifies competitors mentioned in response'
    );
    assert(!res1.competitorsMentioned.includes('Semrush'), 'Does not falsely flag unmentioned competitor');

    // Case 2: Brand mentioned by domain in citations
    const sampleText2 = 'Top marketing software tools include HubSpot and traditional agencies.';
    const citations2 = ['https://marketmind.ai/case-study', 'https://hubspot.com/blog'];
    const res2 = detectBrandVisibility({
      text: sampleText2,
      citations: citations2,
      businessName: 'MarketMind AI',
      websiteUrl: 'https://marketmind.ai',
      competitors: mockCompetitors,
    });
    assert(res2.brandMentioned === false, 'Brand not mentioned in text body');
    assert(res2.mentionPosition === null, 'mentionPosition is null when brand absent from text');
    assert(res2.domainInCitations === true, 'Detects business domain in citations array');
    assert(res2.competitorsMentioned.includes('HubSpot'), 'Detects competitor from text');

    // Case 3: Case-insensitive matching
    const sampleText3 = 'marketmind ai delivers high roas.';
    const res3 = detectBrandVisibility({
      text: sampleText3,
      citations: [],
      businessName: 'MarketMind AI',
      websiteUrl: 'https://marketmind.ai',
    });
    assert(res3.brandMentioned === true, 'Case-insensitive brand match succeeds');
    assert(res3.mentionPosition === 0, 'Mention at position 0 detected');

    // Case 4: Complete absence
    const sampleText4 = 'Here are general SEO tips for beginners.';
    const res4 = detectBrandVisibility({
      text: sampleText4,
      citations: ['https://wikipedia.org'],
      businessName: 'MarketMind AI',
      websiteUrl: 'https://marketmind.ai',
      competitors: mockCompetitors,
    });
    assert(res4.brandMentioned === false, 'Unmentioned brand returns false');
    assert(res4.mentionPosition === null, 'Unmentioned brand has null position');
    assert(res4.domainInCitations === false, 'Absent domain in citations returns false');
    assert(res4.competitorsMentioned.length === 0, 'No competitors falsely detected');
  }

  // =========================================================================
  // 5. Storage Service (S3 / Cloudflare R2)
  // =========================================================================
  console.log('\n--- 5. Storage Service Namespacing & Guardrails ---');
  {
    // Namespacing check
    const key1 = StorageService.getNamespacedKey('org_tenant99', 'posters', 'poster_2026.png');
    assert(key1 === 'org_org_tenant99/posters/poster_2026.png', 'Namespaces key with organization ID');

    const key2 = StorageService.getNamespacedKey(undefined, '/posters/', '/poster_sub.png');
    assert(key2 === 'org_global/posters/poster_sub.png', 'Handles global fallback and leading/trailing slashes');

    // Unconfigured fallback check
    delete process.env.S3_KEY;
    delete process.env.S3_SECRET;
    delete process.env.S3_BUCKET;
    delete process.env.S3_PUBLIC_URL;

    assert(StorageService.isConfigured() === false, 'StorageService.isConfigured returns false when unset');

    const bufferRes = await StorageService.uploadBuffer('key.png', Buffer.from('test'));
    assert(bufferRes.success === false, 'uploadBuffer returns success: false when unconfigured');

    const sampleUrl = 'https://image.pollinations.ai/prompt/sample';
    const fromUrlRes = await StorageService.uploadFromUrl(sampleUrl, 'posters/test.png');
    assert(fromUrlRes.success === false, 'uploadFromUrl returns success: false when unconfigured');
    assert(fromUrlRes.url === sampleUrl, 'uploadFromUrl falls back to source URL when storage unconfigured');
  }

  console.log('\n=================================================');
  console.log(`Phase 3 Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
