import { SmsService } from '../src/server/services/sms.service';

async function runSmsTest() {
  console.log('🧪 Testing FoxxSMS Service Integration...');

  // Test mobile number normalization
  const clean1 = SmsService.cleanMobileNumber('8076745291');
  const clean2 = SmsService.cleanMobileNumber('+918076745291');
  const clean3 = SmsService.cleanMobileNumber('918076745291');

  if (clean1 === '8076745291' && clean2 === '8076745291' && clean3 === '8076745291') {
    console.log('  ✅ PASS: Mobile number normalization to 10-digit raw number');
  } else {
    console.error('  ❌ FAIL: Mobile number normalization', { clean1, clean2, clean3 });
    process.exit(1);
  }

  console.log('🎉 FoxxSMS Service Tests Passed!\n');
}

runSmsTest().catch((err) => {
  console.error('Fatal SMS test error:', err);
  process.exit(1);
});
