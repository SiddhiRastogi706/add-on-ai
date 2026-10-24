/// <reference types="node" />
import axios, { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios';

type Captured = { url: string; body: unknown; headers: Record<string, unknown> };

function makeFakeResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
}

async function runSmsTest() {
  const originalProvider = process.env.SMS_PROVIDER;
  const originalApiKey = process.env.SMS_API_KEY;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalGatewayUrl = process.env.SMS_GATEWAY_URL;
  const originalTemplateId = process.env.SMS_TEMPLATE_ID;
  const originalAppName = process.env.SMS_APP_NAME;
  const originalPost = axios.post;

  process.env.NODE_ENV = 'test';
  delete process.env.SMS_API_KEY;
  delete process.env.SMS_GATEWAY_URL;
  delete process.env.SMS_TEMPLATE_ID;
  delete process.env.SMS_APP_NAME;

  const { SmsService } = await import('../src/server/services/sms.service');
  process.env.SMS_API_KEY = 'test-api-key';
  console.log('🧪 Testing SMS provider integration...');

  let failed = false;
  const fail = (msg: string, extra?: unknown) => {
    console.error(`  ❌ FAIL: ${msg}`, extra ?? '');
    failed = true;
  };

  // 1. Mobile number normalization
  const clean1 = SmsService.cleanMobileNumber('8076745291');
  const clean2 = SmsService.cleanMobileNumber('+918076745291');
  const clean3 = SmsService.cleanMobileNumber('918076745291');

  if (clean1 === '8076745291' && clean2 === '8076745291' && clean3 === '8076745291') {
    console.log('  ✅ PASS: Mobile number normalization to 10-digit raw number');
  } else {
    console.error('  ❌ FAIL: Mobile number normalization', { clean1, clean2, clean3 });
    process.exit(1);
  }

  let captured: Captured = { url: '', body: undefined, headers: {} };
  const mockPost = (response: AxiosResponse<any>) => {
    axios.post = (async (
      url: string,
      body?: unknown,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<any>> => {
      captured = { url, body, headers: (config?.headers as Record<string, unknown>) || {} };
      return response;
    }) as typeof axios.post;
  };

  try {
    // 2. StartMessaging (default provider)
    delete process.env.SMS_PROVIDER;
    mockPost(
      makeFakeResponse({
        success: true,
        statusCode: 201,
        data: { otpRequestId: 'test-otp-request-id', messageId: 'test-message-id', status: 'queued' },
      })
    );

    const smResult = await SmsService.sendOtp('+919876543210', '123456');
    const smBody = captured.body as
      | { phoneNumber?: string; variables?: { otp?: string; appName?: string }; templateId?: string }
      | undefined;

    if (
      smResult.success &&
      smResult.provider === 'startmessaging' &&
      smResult.messageId === 'test-message-id' &&
      captured.url === 'https://api.startmessaging.com/otp/send' &&
      captured.headers['X-API-Key'] === 'test-api-key' &&
      smBody?.phoneNumber === '+919876543210' &&
      smBody.variables?.otp === '123456' &&
      smBody.variables?.appName === 'AddonAIx' &&
      smBody.templateId === undefined
    ) {
      console.log('  ✅ PASS: Sends OTP through StartMessaging (default) with X-API-Key and E.164 phone number');
    } else {
      fail('StartMessaging request configuration or response mapping is incorrect', { smResult, captured });
    }

    // 3. A base URL is normalized to the documented OTP endpoint.
    process.env.SMS_GATEWAY_URL = 'https://api.startmessaging.com/';
    mockPost(
      makeFakeResponse({
        success: true,
        data: { messageId: 'base-url-message-id', status: 'queued' },
      })
    );
    const baseUrlResult = await SmsService.sendOtp('9876543210', '123456');
    if (
      baseUrlResult.success &&
      captured.url === 'https://api.startmessaging.com/otp/send'
    ) {
      console.log('  ✅ PASS: StartMessaging API root URL is normalized to /otp/send');
    } else {
      fail('StartMessaging base URL was not normalized to the OTP endpoint', { baseUrlResult, captured });
    }
    delete process.env.SMS_GATEWAY_URL;

    // 4. StartMessaging rejects (success: false in body)
    mockPost(makeFakeResponse({ success: false, message: 'Insufficient balance' }));
    const rejected = await SmsService.sendOtp('9876543210', '123456');
    if (!rejected.success && rejected.provider === 'startmessaging' && rejected.error === 'Insufficient balance') {
      console.log('  ✅ PASS: StartMessaging rejection is reported as a failure with the real reason');
    } else {
      fail('StartMessaging rejection was not reported correctly', rejected);
    }

    // 4b. HTTP 400 with an OBJECT error must never become "[object Object]"
    axios.post = (async () => {
      const err: any = new Error('Request failed with status code 400');
      err.isAxiosError = true;
      err.response = {
        status: 400,
        data: { success: false, error: { code: 'INVALID_PHONE', message: 'Invalid phone number' } },
      };
      throw err;
    }) as typeof axios.post;

    const bad = await SmsService.sendOtp('9876543210', '123456');
    if (
      !bad.success &&
      typeof bad.error === 'string' &&
      bad.error.includes('Invalid phone number') &&
      bad.error.includes('HTTP 400') &&
      !bad.error.includes('[object Object]')
    ) {
      console.log('  ✅ PASS: HTTP 400 object errors are readable (no [object Object])');
    } else {
      fail('HTTP 400 error was not formatted correctly', bad);
    }

    // 5. API key missing in production
    delete process.env.SMS_API_KEY;
    process.env.NODE_ENV = 'production';
    const noKey = await SmsService.sendOtp('9876543210', '123456');
    if (!noKey.success && /SMS_API_KEY is missing/.test(noKey.error || '')) {
      console.log('  ✅ PASS: Missing SMS_API_KEY returns a clear error');
    } else {
      fail('Missing API key was not reported correctly', noKey);
    }
    process.env.SMS_API_KEY = 'test-sms-to-key';
    process.env.NODE_ENV = 'test';

    // 6. SMS.to
    process.env.SMS_PROVIDER = 'smsto';
    mockPost(
      makeFakeResponse({
        success: true,
        message: 'Message is queued for sending!',
        message_id: 'test-message-id',
      })
    );

    const result = await SmsService.sendOtp('+919876543210', '123456');
    const body = captured.body as { message?: string; to?: string } | undefined;
    if (
      result.success &&
      result.provider === 'sms.to' &&
      result.messageId === 'test-message-id' &&
      captured.url === 'https://api.sms.to/sms/send' &&
      String(captured.headers.Authorization || '') === 'Bearer test-sms-to-key' &&
      body?.to === '+919876543210' &&
      body.message?.includes('123456')
    ) {
      console.log('  ✅ PASS: Sends OTP through SMS.to using Bearer auth and E.164 phone number');
    } else {
      fail('SMS.to request configuration or response mapping is incorrect', { result, captured });
    }

    // 7. Removed foxxsms provider
    process.env.SMS_PROVIDER = 'foxxsms';
    const old = await SmsService.sendOtp('9876543210', '123456');
    if (!old.success && /Unsupported SMS provider/.test(old.error || '')) {
      console.log('  ✅ PASS: Old foxxsms provider value is no longer supported (clear error)');
    } else {
      fail('foxxsms should be reported as unsupported', old);
    }
  } finally {
    axios.post = originalPost;
    const restore = (key: string, value: string | undefined) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    };
    restore('SMS_PROVIDER', originalProvider);
    restore('SMS_API_KEY', originalApiKey);
    restore('NODE_ENV', originalNodeEnv);
    restore('SMS_GATEWAY_URL', originalGatewayUrl);
    restore('SMS_TEMPLATE_ID', originalTemplateId);
    restore('SMS_APP_NAME', originalAppName);
  }

  if (failed) {
    process.exitCode = 1;
    console.error('❌ Some SMS service tests failed.\n');
  } else {
    console.log('🎉 SMS service tests passed!\n');
  }
}

runSmsTest().catch((err) => {
  console.error('Fatal SMS test error:', err);
  process.exit(1);
});