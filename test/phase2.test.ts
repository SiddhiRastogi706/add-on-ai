import crypto from 'crypto';
import { XService } from '../src/server/services/x.service';
import { WhatsAppService } from '../src/server/services/whatsapp.service';
import { MetaSocialService } from '../src/server/services/metasocial.service';
import { LinkedInService } from '../src/server/services/linkedin.service';
import { SocialPublishService } from '../src/server/services/social-publish.service';

async function runPhase2Tests() {
  console.log('🧪 Starting Phase 2 Pure Logic Test Suite...\n');

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
  // 1. X (Twitter) 280-Character Validation
  // =========================================================================
  console.log('--- 1. X (Twitter) 280-Character Validation ---');
  {
    const shortTweet = 'Automating marketing pipelines with MarketMind AI! 🚀';
    const shortRes = XService.validateTweetLength(shortTweet);
    assert(shortRes.valid === true, 'Short tweet (<= 280 chars) must pass validation');

    const exact280 = 'a'.repeat(280);
    const exactRes = XService.validateTweetLength(exact280);
    assert(exactRes.valid === true, 'Exact 280-character tweet must pass validation');
    assert(exactRes.length === 280, 'Exact 280 length must be measured accurately');

    const longTweet = 'a'.repeat(281);
    const longRes = XService.validateTweetLength(longTweet);
    assert(longRes.valid === false, 'Tweet of 281 chars must fail validation');
    assert(
      longRes.error !== undefined && longRes.error.includes('281/280'),
      'Failure error must specify length and refuse silent truncation'
    );

    // Test XService.publishTweet without token returns honest refusal
    delete process.env.X_ACCESS_TOKEN;
    const publishRes = await XService.publishTweet(shortTweet);
    assert(publishRes.success === false, 'publishTweet without token must return success: false');
    assert(publishRes.message.includes('missing X_ACCESS_TOKEN'), 'Error message must specify missing credentials');

    // Test publishTweet with oversized text rejects before sending API request
    const oversizePublish = await XService.publishTweet(longTweet);
    assert(oversizePublish.success === false, 'oversized publishTweet must reject before network request');
    assert(oversizePublish.message.includes('281/280'), 'oversize error message must match length validation');
  }

  // =========================================================================
  // 2. WhatsApp Indian Phone Number Normalization
  // =========================================================================
  console.log('\n--- 2. WhatsApp Phone Number Normalization ---');
  {
    // Standard 10-digit Indian mobile
    const res1 = WhatsAppService.cleanPhoneNumber('9876543210');
    assert(res1 === '919876543210', '10-digit Indian number must prepend 91');

    // 11-digit leading 0 (trunk code)
    const res2 = WhatsAppService.cleanPhoneNumber('09876543210');
    assert(res2 === '919876543210', '11-digit leading 0 must replace 0 with 91');

    // Formatted with spaces, hyphens, and +91
    const res3 = WhatsAppService.cleanPhoneNumber('+91 98765-43210');
    assert(res3 === '919876543210', 'Formatted +91 98765-43210 must normalize to 919876543210');

    // Already 12-digit 91XXXXXXXXXX
    const res4 = WhatsAppService.cleanPhoneNumber('919876543210');
    assert(res4 === '919876543210', 'Pre-normalized 12-digit number must remain unchanged');

    // International number (US)
    const res5 = WhatsAppService.cleanPhoneNumber('+1 (415) 555-2671');
    assert(res5 === '14155552671', 'US formatted phone must strip formatting characters');

    // Empty string
    const resEmpty = WhatsAppService.cleanPhoneNumber('');
    assert(resEmpty === '', 'Empty string must return empty string');
  }

  // =========================================================================
  // 3. WhatsApp Webhook HMAC Signature Verification
  // =========================================================================
  console.log('\n--- 3. WhatsApp Webhook HMAC-SHA256 Verification ---');
  {
    const mockSecret = 'meta_test_secret_key_883311';
    const mockPayload = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{ id: '123', changes: [] }],
    });

    const validHash = crypto.createHmac('sha256', mockSecret).update(mockPayload).digest('hex');
    const validHeader = `sha256=${validHash}`;

    // Valid signature
    const isValid = WhatsAppService.verifyWebhookSignature(mockPayload, validHeader, mockSecret);
    assert(isValid === true, 'Valid HMAC signature must verify to true');

    // Tampered payload
    const isTampered = WhatsAppService.verifyWebhookSignature(mockPayload + 'extra', validHeader, mockSecret);
    assert(isTampered === false, 'Tampered payload must fail signature verification');

    // Wrong secret
    const isWrongSecret = WhatsAppService.verifyWebhookSignature(mockPayload, validHeader, 'wrong_secret');
    assert(isWrongSecret === false, 'Signature with wrong secret must fail');

    // Header missing sha256= prefix
    const isBadHeader = WhatsAppService.verifyWebhookSignature(mockPayload, validHash, mockSecret);
    assert(isBadHeader === false, 'Header missing sha256= prefix must fail');

    // Undefined header
    const isUndefined = WhatsAppService.verifyWebhookSignature(mockPayload, undefined, mockSecret);
    assert(isUndefined === false, 'Undefined signature header must return false');
  }

  // =========================================================================
  // 4. Meta Instagram Guardrail (Image Requirement)
  // =========================================================================
  console.log('\n--- 4. Meta Instagram Guardrail ---');
  {
    const noImageRes = await MetaSocialService.publishToInstagram('Great caption without an image!');
    assert(noImageRes.success === false, 'Instagram publish without image must fail');
    assert(noImageRes.message === 'Instagram requires an image', 'Must return exact guardrail message');
  }

  // =========================================================================
  // 5. LinkedIn Missing Credentials Guardrail
  // =========================================================================
  console.log('\n--- 5. LinkedIn Guardrail ---');
  {
    delete process.env.LINKEDIN_ACCESS_TOKEN;
    delete process.env.LINKEDIN_AUTHOR_URN;
    const linkedInRes = await LinkedInService.publishPost('Announcing our new feature!');
    assert(linkedInRes.success === false, 'LinkedIn publish without credentials must fail');
    assert(linkedInRes.message.includes('missing LINKEDIN_ACCESS_TOKEN'), 'Must return missing credentials error');
  }

  // =========================================================================
  // 6. SocialPublishService Multi-Platform Routing & Draft Fallback
  // =========================================================================
  console.log('\n--- 6. SocialPublishService Routing & Honest Queue ---');
  {
    // Clean environment for pure draft check
    delete process.env.SOCIAL_WEBHOOK_URL;
    delete process.env.META_PAGE_ID;
    delete process.env.META_PAGE_ACCESS_TOKEN;
    delete process.env.META_IG_USER_ID;
    delete process.env.LINKEDIN_ACCESS_TOKEN;
    delete process.env.LINKEDIN_AUTHOR_URN;
    delete process.env.X_ACCESS_TOKEN;

    // Facebook without credentials & without webhook
    const fbRes = await SocialPublishService.publishOrQueue({
      platform: 'FACEBOOK',
      content: 'Hello Facebook!',
      hashtags: ['growth', 'marketing'],
    });
    assert(fbRes.success === false, 'Unconfigured platform must return success: false');
    assert(fbRes.status === 'SCHEDULED_DRAFT', 'Status must be SCHEDULED_DRAFT');
    assert(fbRes.message.includes('FACEBOOK'), 'Draft message must reference FACEBOOK');

    // Instagram without credentials & without webhook
    const igRes = await SocialPublishService.publishOrQueue({
      platform: 'INSTAGRAM',
      content: 'Hello Instagram!',
      hashtags: ['photo'],
    });
    assert(igRes.success === false, 'Unconfigured Instagram must return success: false');
    assert(igRes.status === 'SCHEDULED_DRAFT', 'Status must be SCHEDULED_DRAFT');

    // X / Twitter without credentials & without webhook
    const xRes = await SocialPublishService.publishOrQueue({
      platform: 'X',
      content: 'Hello X!',
      hashtags: ['buildinpublic'],
    });
    assert(xRes.success === false, 'Unconfigured X must return success: false');
    assert(xRes.status === 'SCHEDULED_DRAFT', 'Status must be SCHEDULED_DRAFT');

    // LinkedIn without credentials & without webhook
    const liRes = await SocialPublishService.publishOrQueue({
      platform: 'LINKEDIN',
      content: 'Hello LinkedIn network!',
      hashtags: ['leadership'],
    });
    assert(liRes.success === false, 'Unconfigured LinkedIn must return success: false');
    assert(liRes.status === 'SCHEDULED_DRAFT', 'Status must be SCHEDULED_DRAFT');
  }

  // =========================================================================
  // 7. Credential Helper Function Isolation
  // =========================================================================
  console.log('\n--- 7. Credential Helper Single-Function Isolation ---');
  {
    process.env.META_PAGE_ID = 'test_page_101';
    process.env.META_PAGE_ACCESS_TOKEN = 'test_token_fb';
    process.env.META_IG_USER_ID = 'test_ig_202';
    process.env.META_APP_SECRET = 'test_secret_303';
    process.env.WHATSAPP_TOKEN = 'test_wa_token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_wa_phone';
    process.env.LINKEDIN_ACCESS_TOKEN = 'test_li_token';
    process.env.LINKEDIN_AUTHOR_URN = 'urn:li:organization:12345';
    process.env.X_ACCESS_TOKEN = 'test_x_token';

    const metaCfg = MetaSocialService.getConfig();
    assert(metaCfg.pageId === 'test_page_101', 'MetaSocialService.getConfig resolves pageId');
    assert(metaCfg.igUserId === 'test_ig_202', 'MetaSocialService.getConfig resolves igUserId');

    const waCfg = WhatsAppService.getConfig();
    assert(waCfg.phoneNumberId === 'test_wa_phone', 'WhatsAppService.getConfig resolves phoneNumberId');

    const liCfg = LinkedInService.getConfig();
    assert(liCfg.authorUrn === 'urn:li:organization:12345', 'LinkedInService.getConfig resolves authorUrn');

    const xCfg = XService.getConfig();
    assert(xCfg.accessToken === 'test_x_token', 'XService.getConfig resolves accessToken');

    // Clean up test env
    delete process.env.META_PAGE_ID;
    delete process.env.META_PAGE_ACCESS_TOKEN;
    delete process.env.META_IG_USER_ID;
    delete process.env.META_APP_SECRET;
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.LINKEDIN_ACCESS_TOKEN;
    delete process.env.LINKEDIN_AUTHOR_URN;
    delete process.env.X_ACCESS_TOKEN;
  }

  console.log('\n=================================================');
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
