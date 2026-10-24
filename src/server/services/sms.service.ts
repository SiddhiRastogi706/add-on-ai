/// <reference types="node" />
import axios from 'axios';

export type SmsResult = {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
};

const REQUEST_TIMEOUT_MS = 15000;

/** Turns ANY provider error payload into a readable string (fixes "[object Object]"). */
export function extractErrorMessage(data: unknown, fallback: string): string {
  if (data === undefined || data === null || data === '') return fallback;
  if (typeof data === 'string') return data;

  if (Array.isArray(data)) {
    return (
      data
        .map((x) => extractErrorMessage(x, ''))
        .filter(Boolean)
        .join(', ') || fallback
    );
  }

  if (typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const candidate = d.message ?? d.error ?? d.errors ?? d.detail ?? d.details;
    if (candidate !== undefined && candidate !== null) {
      const nested = extractErrorMessage(candidate, '');
      if (nested) return nested;
    }
    try {
      return JSON.stringify(d);
    } catch {
      return fallback;
    }
  }

  return String(data);
}

function formatAxiosError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const detail = extractErrorMessage(err.response?.data, err.message);
    return `${detail} (HTTP ${status ?? 'n/a'})`;
  }
  return err instanceof Error ? err.message : extractErrorMessage(err, 'Unknown SMS error');
}

export class SmsService {
  /** Returns raw 10-digit Indian mobile number (strips +, spaces, 91 / 0 prefix). */
  static cleanMobileNumber(phone: string): string {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    else if (digits.length > 10) digits = digits.slice(-10);
    return digits;
  }

  /** E.164 format: +91XXXXXXXXXX */
  static toE164(phone: string): string {
    return `+91${SmsService.cleanMobileNumber(phone)}`;
  }

  static async sendOtp(phone: string, otp: string): Promise<SmsResult> {
    const provider = (process.env.SMS_PROVIDER || 'startmessaging').trim().toLowerCase();

    const clean = SmsService.cleanMobileNumber(phone);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      return {
        success: false,
        provider,
        error: 'Invalid mobile number. Enter a valid 10-digit Indian mobile number.',
      };
    }

    if (provider === 'startmessaging') return SmsService.sendViaStartMessaging(clean, otp);
    if (provider === 'smsto' || provider === 'sms.to') return SmsService.sendViaSmsTo(clean, otp);

    return {
      success: false,
      provider,
      error: `Unsupported SMS provider "${provider}". Set SMS_PROVIDER to "startmessaging" (default) or "smsto".`,
    };
  }

  // ------------------------------------------------------------ StartMessaging
  private static async sendViaStartMessaging(clean: string, otp: string): Promise<SmsResult> {
    const provider = 'startmessaging';
    const apiKey = (process.env.SMS_API_KEY || '').trim();
    const isProd = process.env.NODE_ENV === 'production';

    if (!apiKey) {
      if (isProd) {
        return { success: false, provider, error: 'SMS_API_KEY is missing. Set it in your server environment variables.' };
      }
      console.warn(`[sms] SMS_API_KEY missing (non-production). OTP for ${clean}: ${otp}`);
      return { success: true, provider: 'dev-console', messageId: 'dev-console' };
    }

    const configuredUrl = process.env.SMS_GATEWAY_URL?.trim();
    let url: string;
    try {
      const endpoint = new URL(configuredUrl || 'https://api.startmessaging.com/otp/send');
      if (endpoint.pathname === '/') endpoint.pathname = '/otp/send';
      url = endpoint.toString();
    } catch {
      return {
        success: false,
        provider,
        error: 'SMS_GATEWAY_URL must be a valid StartMessaging API URL.',
      };
    }
    const templateId = process.env.SMS_TEMPLATE_ID?.trim();
    const appName = process.env.SMS_APP_NAME?.trim() || 'AddonAIx';

    const body: Record<string, unknown> = {
      phoneNumber: SmsService.toE164(clean),
      variables: { otp, appName },
    };
    if (templateId) body.templateId = templateId;

    try {
      const res = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        timeout: REQUEST_TIMEOUT_MS,
      });

      const data = res.data as {
        success?: boolean;
        message?: unknown;
        data?: { messageId?: string; otpRequestId?: string };
        messageId?: string;
      } | undefined;
      if (data?.success !== true) {
        return { success: false, provider, error: extractErrorMessage(data, 'StartMessaging rejected the request') };
      }

      return {
        success: true,
        provider,
        messageId: data?.data?.messageId ?? data?.data?.otpRequestId ?? data?.messageId,
      };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('[sms][startmessaging] failed:', err.response?.status, JSON.stringify(err.response?.data));
      } else {
        console.error('[sms][startmessaging] failed:', err);
      }
      return { success: false, provider, error: formatAxiosError(err) };
    }
  }

  // ------------------------------------------------------------ SMS.to
  private static async sendViaSmsTo(clean: string, otp: string): Promise<SmsResult> {
    const provider = 'sms.to';
    const apiKey = (process.env.SMS_API_KEY || '').trim();
    const isProd = process.env.NODE_ENV === 'production';

    if (!apiKey) {
      if (isProd) {
        return { success: false, provider, error: 'SMS_API_KEY is missing. Set it in your server environment variables.' };
      }
      console.warn(`[sms] SMS_API_KEY missing (non-production). OTP for ${clean}: ${otp}`);
      return { success: true, provider: 'dev-console', messageId: 'dev-console' };
    }

    const appName = process.env.SMS_APP_NAME?.trim() || 'AddonAIx';
    const url = process.env.SMS_GATEWAY_URL?.trim() || 'https://api.sms.to/sms/send';

    try {
      const res = await axios.post(
        url,
        {
          to: SmsService.toE164(clean),
          message: `${otp} is your ${appName} verification code. Do not share it with anyone.`,
        },
        {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          timeout: REQUEST_TIMEOUT_MS,
        }
      );

      const data = res.data as any;
      if (data && data.success === false) {
        return { success: false, provider, error: extractErrorMessage(data, 'SMS.to rejected the request') };
      }
      return { success: true, provider, messageId: data?.message_id };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('[sms][sms.to] failed:', err.response?.status, JSON.stringify(err.response?.data));
      } else {
        console.error('[sms][sms.to] failed:', err);
      }
      return { success: false, provider, error: formatAxiosError(err) };
    }
  }
}