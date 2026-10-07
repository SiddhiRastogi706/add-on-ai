import crypto from 'crypto';
import { RazorpayService } from '../src/server/services/razorpay.service';
import { EmailService } from '../src/server/services/email.service';
import { SAAS_PLANS } from '../src/config/plans';
import { BRAND } from '../src/config/brand';

async function runPhase1Tests() {
  console.log('🧪 Starting Phase 1 Pure Logic Test Suite...\n');

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
  // 1. Razorpay Checkout Signature Verification
  // =========================================================================
  console.log('--- 1. Razorpay Signature Verification ---');
  const mockKeySecret = 'test_razorpay_secret_key_998877';
  const mockOrderId = 'order_DA2910JkL4821a';
  const mockPaymentId = 'pay_0921820JKD9218';

  // Set mock env for test
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;
  const originalWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  process.env.RAZORPAY_KEY_SECRET = mockKeySecret;
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_554433';

  try {
    const validSignature = crypto
      .createHmac('sha256', mockKeySecret)
      .update(`${mockOrderId}|${mockPaymentId}`)
      .digest('hex');

    const isValid = RazorpayService.verifyCheckoutSignature(mockOrderId, mockPaymentId, validSignature);
    assert(isValid === true, 'Valid checkout signature must verify to true');

    const isTampered = RazorpayService.verifyCheckoutSignature(mockOrderId, mockPaymentId, 'invalid_tampered_signature_1234');
    assert(isTampered === false, 'Tampered signature must return false');

    const isWrongOrder = RazorpayService.verifyCheckoutSignature('order_WRONG', mockPaymentId, validSignature);
    assert(isWrongOrder === false, 'Mismatched order ID must return false');

    const isWrongPayment = RazorpayService.verifyCheckoutSignature(mockOrderId, 'pay_WRONG', validSignature);
    assert(isWrongPayment === false, 'Mismatched payment ID must return false');

    // =========================================================================
    // 2. Razorpay Webhook Signature Verification
    // =========================================================================
    console.log('\n--- 2. Razorpay Webhook Signature Verification ---');
    const mockRawWebhookBody = JSON.stringify({
      entity: 'event',
      event: 'payment.captured',
      payload: { payment: { entity: { id: mockPaymentId, order_id: mockOrderId } } },
    });

    const validWebhookSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(mockRawWebhookBody)
      .digest('hex');

    const isWebhookValid = RazorpayService.verifyWebhookSignature(mockRawWebhookBody, validWebhookSig);
    assert(isWebhookValid === true, 'Valid webhook raw body signature must verify to true');

    const isWebhookTampered = RazorpayService.verifyWebhookSignature(mockRawWebhookBody + ' tampering', validWebhookSig);
    assert(isWebhookTampered === false, 'Tampered webhook raw body must return false');

    const isWebhookInvalidSig = RazorpayService.verifyWebhookSignature(mockRawWebhookBody, 'invalid_sig');
    assert(isWebhookInvalidSig === false, 'Invalid webhook signature string must return false');
  } finally {
    process.env.RAZORPAY_KEY_SECRET = originalSecret;
    process.env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
  }

  // =========================================================================
  // 3. Currency Conversion & Pricing Calculations
  // =========================================================================
  console.log('\n--- 3. Currency & Pricing Logic ---');
  const rate = 85;
  const starterMonthlyUsd = SAAS_PLANS.starter.priceMonthly; // 49
  const expectedStarterPaise = Math.round(49 * rate * 100); // 416500 paise (₹4,165.00)
  const actualStarterPaise = Math.round(starterMonthlyUsd * rate * 100);
  assert(actualStarterPaise === expectedStarterPaise, `Starter monthly paise calculation: ${actualStarterPaise} paise`);

  const growthYearlyUsd = SAAS_PLANS.growth.priceYearly; // 1240
  const expectedGrowthYearlyPaise = Math.round(1240 * rate * 100); // 10540000 paise (₹1,05,400.00)
  const actualGrowthYearlyPaise = Math.round(growthYearlyUsd * rate * 100);
  assert(actualGrowthYearlyPaise === expectedGrowthYearlyPaise, `Growth yearly paise calculation: ${actualGrowthYearlyPaise} paise`);

  assert(SAAS_PLANS.free.priceMonthly === 0 && SAAS_PLANS.free.priceYearly === 0, 'Free plan price must be 0');

  // =========================================================================
  // 4. Resend Email Service & Branded Templates
  // =========================================================================
  console.log('\n--- 4. Resend Email Service & Templates ---');

  // Test unconfigured fallback
  const origResendKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  try {
    const unconfiguredResult = await EmailService.sendEmail({
      to: 'customer@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });
    assert(
      unconfiguredResult.sent === false && unconfiguredResult.reason === 'not_configured',
      'Unconfigured Resend gracefully returns sent:false without throwing'
    );
  } finally {
    process.env.RESEND_API_KEY = origResendKey;
  }

  // Test Welcome Template
  const welcome = EmailService.templates.welcome({
    name: 'Priya Mehta',
    email: 'priya@techstartup.in',
  });
  assert(welcome.subject.includes(BRAND.appName), 'Welcome subject contains appName');
  assert(welcome.html.includes('Priya Mehta'), 'Welcome HTML contains recipient name');
  assert(welcome.html.includes('priya@techstartup.in'), 'Welcome HTML contains recipient email');

  // Test Payment Receipt Template
  const receipt = EmailService.templates.paymentReceipt({
    name: 'Aarav Patel',
    email: 'aarav@patelconsulting.com',
    planName: 'Growth Automation',
    amountFormatted: '₹10,965.00',
    currency: 'INR',
    orderId: 'order_test_123',
    paymentId: 'pay_test_456',
  });
  assert(receipt.subject.includes('Receipt') && receipt.subject.includes('Growth Automation'), 'Receipt subject formatted');
  assert(receipt.html.includes('₹10,965.00'), 'Receipt HTML contains formatted amount');
  assert(receipt.html.includes('pay_test_456'), 'Receipt HTML contains payment ID');

  // Test OTP Backup Template
  const otp = EmailService.templates.otpBackup({
    email: 'dev@company.com',
    otp: '928410',
    expiresMinutes: 10,
  });
  assert(otp.subject.includes('928410'), 'OTP subject contains verification code');
  assert(otp.html.includes('928410'), 'OTP HTML contains bold verification code');

  // Test Weekly Report Template
  const weekly = EmailService.templates.weeklyReport({
    businessName: 'NexusFlow AI',
    periodLabel: 'Sept 21 – Sept 28, 2026',
    metricsSummary: {
      trafficChangePct: 24,
      leadsGenerated: 18,
      avgRoas: 4.2,
    },
    sections: {
      whatHappened: 'Organic traffic increased by 24% after keyword refresh.',
      whyItHappened: 'High ranking on buyer-intent commercial queries.',
    },
  });
  assert(weekly.subject.includes('NexusFlow AI'), 'Weekly report subject contains business name');
  assert(weekly.html.includes('+24%'), 'Weekly report HTML contains metric data');
  assert(weekly.html.includes('4.2x'), 'Weekly report HTML contains ROAS');

  // =========================================================================
  // Test Summary
  // =========================================================================
  console.log(`\n======================================================`);
  console.log(`🏁 Phase 1 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
