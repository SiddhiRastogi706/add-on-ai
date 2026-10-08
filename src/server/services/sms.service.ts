import axios from 'axios';

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: string;
  provider: string;
}

export class SmsService {
  private static provider = (process.env.SMS_PROVIDER || 'foxxsms').toLowerCase();

  // FoxxSMS Configuration (Primary DLT Enterprise Gateway)
  private static gatewayUrl = process.env.SMS_GATEWAY_URL || 'http://foxxsms.net/sms//submitsms.jsp';
  private static user = process.env.SMS_USER;
  private static apiKey = process.env.SMS_API_KEY;
  private static senderId = process.env.SMS_SENDER_ID || 'TRKMIT';
  private static accusage = process.env.SMS_ACCUSAGE || '1';
  private static entityId = process.env.SMS_ENTITY_ID;
  private static templateId = process.env.SMS_TEMPLATE_ID;

  // Fast2SMS Configuration
  private static fast2smsKey = process.env.FAST2SMS_API_KEY;

  // Twilio Configuration
  private static twilioSid = process.env.TWILIO_ACCOUNT_SID;
  private static twilioToken = process.env.TWILIO_AUTH_TOKEN;
  private static twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  /**
   * Normalize mobile number (e.g. +91 98765-43210 -> 9876543210)
   */
  public static cleanMobileNumber(phone: string): string {
    const clean = phone.replace(/[^\d]/g, '');
    if (clean.length === 12 && clean.startsWith('91')) {
      return clean.substring(2);
    }
    return clean;
  }

  /**
   * Dispatches a 6-digit OTP via the best available SMS gateway
   */
  static async sendOtp(mobileNumber: string, otp: string): Promise<SmsSendResult> {
    const rawMobile = this.cleanMobileNumber(mobileNumber);
    const e164 = `+91${rawMobile}`;

    const currentProvider = (process.env.SMS_PROVIDER || this.provider || 'foxxsms').toLowerCase();
    const apiKey = process.env.SMS_API_KEY || this.apiKey;
    const user = process.env.SMS_USER || this.user;

    const failures: string[] = [];

    // 1. Primary: FoxxSMS (Enterprise Gateway)
    if (currentProvider === 'foxxsms' || (apiKey && user && currentProvider !== 'fast2sms' && currentProvider !== 'twilio')) {
      if (!apiKey || !user) {
        failures.push('FoxxSMS is selected but SMS_USER or SMS_API_KEY is missing.');
      } else {
        const result = await this.sendViaFoxxSMS(e164, otp);
        if (result.success) return result;
        failures.push(`FoxxSMS: ${result.error || 'delivery failed'}`);
        console.warn(`[SmsService] FoxxSMS dispatch failed (${result.error}), checking configured fallback...`);
      }
    }

    // 2. Fast2SMS is the configured secondary gateway or selected primary.
    if (this.fast2smsKey && (currentProvider === 'fast2sms' || failures.length > 0)) {
      const fastResult = await this.sendViaFast2SMS(rawMobile, otp);
      if (fastResult.success) return fastResult;
      failures.push(`Fast2SMS: ${fastResult.error || 'delivery failed'}`);
    } else if (currentProvider === 'fast2sms') {
      failures.push('Fast2SMS is selected but FAST2SMS_API_KEY is missing.');
    }

    // 3. Twilio (If explicitly selected as provider)
    if (this.twilioSid && this.twilioToken && this.twilioFrom && currentProvider === 'twilio') {
      const twilioResult = await this.sendViaTwilio(e164, otp);
      if (twilioResult.success) return twilioResult;
      failures.push(`Twilio: ${twilioResult.error || 'delivery failed'}`);
    } else if (currentProvider === 'twilio') {
      failures.push('Twilio is selected but its account credentials are incomplete.');
    }

    // Try FoxxSMS as a secondary gateway when another provider was selected.
    if (apiKey && user && currentProvider !== 'foxxsms') {
      const retryResult = await this.sendViaFoxxSMS(e164, otp);
      if (retryResult.success) return retryResult;
      failures.push(`FoxxSMS: ${retryResult.error || 'delivery failed'}`);
    }

    return {
      success: false,
      error: failures.length > 0
        ? failures.join(' ')
        : 'No SMS gateway is configured. Configure FoxxSMS, Fast2SMS, or Twilio credentials.',
      provider: currentProvider,
    };
  }

  /**
   * FoxxSMS Enterprise Gateway Dispatcher
   */
  private static async sendViaFoxxSMS(formattedMobile: string, otp: string): Promise<SmsSendResult> {
    const template =
      process.env.SMS_MESSAGE_TEMPLATE ||
      'Dear user, your OTP for Truck Mitra login is {OTP}. Do not share it with anyone. Valid for 5 minutes.';
    const message = template.replace('{OTP}', otp);

    console.log('[SmsService] Dispatching OTP via FoxxSMS Gateway...');

    try {
      const user = process.env.SMS_USER || this.user;
      const key = process.env.SMS_API_KEY || this.apiKey;
      const senderid = process.env.SMS_SENDER_ID || this.senderId;
      const accusage = process.env.SMS_ACCUSAGE || this.accusage;
      const gatewayUrl = process.env.SMS_GATEWAY_URL || this.gatewayUrl;
      const entityid = process.env.SMS_ENTITY_ID || this.entityId;
      const templateid = process.env.SMS_TEMPLATE_ID || this.templateId;

      const params: Record<string, string> = {
        user,
        key,
        mobile: formattedMobile,
        message,
        senderid,
        accusage,
        entityid,
        templateid,
      };

      if (process.env.SMS_TYPE === 'flash') {
        params.smstype = 'flash';
      }
      if (process.env.SMS_UNICODE === '1') {
        params.unicode = '1';
      }

      console.log(`[SmsService] FoxxSMS dispatching securely to ${formattedMobile.slice(0, 4)}••••${formattedMobile.slice(-2)} (Sender: ${senderid}, DLT: Active)`);

      const response = await axios.get(gatewayUrl, {
        params,
        timeout: 10000,
      });

      const data = typeof response.data === 'string' ? response.data.trim() : JSON.stringify(response.data);
      const normalizedResponse = data.toLowerCase();
      const indicatesFailure = /error|failed|unsuccess|invalid|denied|failure/.test(normalizedResponse);
      const indicatesSuccess =
        !indicatesFailure && /(^|[^a-z])success([^a-z]|$)/.test(normalizedResponse);
      const safeResponse = data.replace(/\+?\d{10,13}/g, '[redacted]');

      if (indicatesSuccess) {
        const parts = data.split(',');
        const messageId = parts.length > 3 ? parts[3] : undefined;
        console.log('[SmsService] FoxxSMS accepted the OTP request; handset delivery is unconfirmed.');
        return {
          success: true,
          messageId,
          rawResponse: safeResponse,
          provider: 'foxxsms',
        };
      } else {
        return {
          success: false,
          error: safeResponse,
          rawResponse: safeResponse,
          provider: 'foxxsms',
        };
      }
    } catch (err: any) {
      console.error(`[SmsService] Error sending SMS via FoxxSMS:`, err.message);
      return {
        success: false,
        error: err.message,
        provider: 'foxxsms',
      };
    }
  }

  /**
   * Fast2SMS Quick OTP Gateway
   */
  private static async sendViaFast2SMS(rawMobile: string, otp: string): Promise<SmsSendResult> {
    console.log(`[SmsService] Dispatching OTP to mobile: ${rawMobile} via Fast2SMS...`);
    try {
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'q',
          message: `Your Addon AI verification code is ${otp}. Valid for 10 minutes.`,
          language: 'english',
          numbers: rawMobile,
        },
        {
          headers: {
            authorization: this.fast2smsKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log(`[SmsService] Fast2SMS response:`, response.data);
      if (response.data?.return === true) {
        return {
          success: true,
          messageId: response.data?.request_id,
          rawResponse: JSON.stringify(response.data),
          provider: 'fast2sms',
        };
      } else {
        const errMsg = response.data?.message || 'Fast2SMS dispatch failed';
        console.warn(`[SmsService] Fast2SMS error:`, errMsg);
        return {
          success: false,
          error: errMsg,
          provider: 'fast2sms',
        };
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      console.error(`[SmsService] Fast2SMS error:`, errMsg);
      return {
        success: false,
        error: errMsg,
        provider: 'fast2sms',
      };
    }
  }

  /**
   * Twilio SMS Gateway
   */
  private static async sendViaTwilio(toE164: string, otp: string): Promise<SmsSendResult> {
    console.log(`[SmsService] Dispatching OTP to mobile: ${toE164} via Twilio...`);
    try {
      const auth = Buffer.from(`${this.twilioSid}:${this.twilioToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', toE164);
      params.append('From', this.twilioFrom!);
      params.append('Body', `Your Addon AI verification code is ${otp}. Valid for 10 minutes.`);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioSid}/Messages.json`,
        params.toString(),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      console.log(`[SmsService] Twilio response message SID:`, response.data?.sid);
      return {
        success: true,
        messageId: response.data?.sid,
        provider: 'twilio',
        rawResponse: JSON.stringify(response.data),
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      console.error(`[SmsService] Twilio error:`, errMsg);
      return {
        success: false,
        error: errMsg,
        provider: 'twilio',
      };
    }
  }
}
