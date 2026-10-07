import axios from 'axios';
import crypto from 'crypto';

export interface WhatsAppConfig {
  token?: string;
  phoneNumberId?: string;
  verifyToken?: string;
  appSecret?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  to?: string;
  message: string;
}

export class WhatsAppService {
  /**
   * Single credential helper resolving WhatsApp Cloud API configuration.
   * Can be swapped to per-organization encrypted DB storage in the future.
   */
  static getConfig(_organizationId?: string): WhatsAppConfig {
    return {
      token: process.env.WHATSAPP_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
      appSecret: process.env.META_APP_SECRET,
    };
  }

  /**
   * Normalizes phone numbers (especially Indian mobile numbers) to E.164 digits without '+'.
   * Meta Cloud API expects format: <country_code><national_number> (e.g., 919876543210).
   *
   * Handles:
   * - 10-digit Indian numbers: '9876543210' -> '919876543210'
   * - 11-digit leading 0: '09876543210' -> '919876543210'
   * - Formatted numbers: '+91 98765-43210' -> '919876543210'
   * - Standard international without plus: '14155552671' -> '14155552671'
   */
  static cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    // Strip non-digit characters
    const digits = phone.replace(/\D/g, '');

    // 10 digits: assume Indian domestic mobile number, prefix with 91
    if (digits.length === 10) {
      return `91${digits}`;
    }

    // 11 digits starting with 0: Indian trunk prefix 0, replace with 91
    if (digits.length === 11 && digits.startsWith('0')) {
      return `91${digits.slice(1)}`;
    }

    return digits;
  }

  /**
   * Sends a standard session text message via Meta WhatsApp Cloud API v19.0.
   *
   * ⚠️ IMPORTANT NOTE ON THE 24-HOUR CUSTOMER SERVICE WINDOW:
   * Under Meta WhatsApp Business Platform policies, free-form session text messages can
   * ONLY be sent within a 24-hour customer service window opened by a user-initiated inbound
   * message. If sending outside this 24-hour window, you MUST use an approved pre-registered
   * template message via sendTemplateMessage().
   */
  static async sendTextMessage(
    to: string,
    text: string,
    organizationId?: string
  ): Promise<WhatsAppSendResult> {
    const cleanTo = this.cleanPhoneNumber(to);
    if (!cleanTo) {
      return {
        success: false,
        message: 'Invalid recipient phone number',
      };
    }

    if (!text || !text.trim()) {
      return {
        success: false,
        message: 'Message body cannot be empty',
      };
    }

    const config = this.getConfig(organizationId);
    if (!config.token || !config.phoneNumberId) {
      return {
        success: false,
        message: 'WhatsApp Cloud API credentials not configured (missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID)',
      };
    }

    try {
      const endpoint = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;
      const body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: {
          preview_url: false,
          body: text,
        },
      };

      const res = await axios.post(endpoint, body, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const messageId = res.data?.messages?.[0]?.id;

      return {
        success: true,
        messageId,
        to: cleanTo,
        message: 'WhatsApp text message dispatched successfully',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Unknown WhatsApp Cloud API error';

      console.error('[WhatsAppService] Send text error:', {
        status: err.response?.status,
        message: errorMsg,
      });

      return {
        success: false,
        message: `WhatsApp text delivery failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Sends an approved pre-registered template message via Meta WhatsApp Cloud API v19.0.
   * Can be sent outside the 24-hour customer service window.
   */
  static async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: any[],
    organizationId?: string
  ): Promise<WhatsAppSendResult> {
    const cleanTo = this.cleanPhoneNumber(to);
    if (!cleanTo) {
      return {
        success: false,
        message: 'Invalid recipient phone number',
      };
    }

    if (!templateName) {
      return {
        success: false,
        message: 'Template name is required',
      };
    }

    const config = this.getConfig(organizationId);
    if (!config.token || !config.phoneNumberId) {
      return {
        success: false,
        message: 'WhatsApp Cloud API credentials not configured (missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID)',
      };
    }

    try {
      const endpoint = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;
      const body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components: components || [],
        },
      };

      const res = await axios.post(endpoint, body, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const messageId = res.data?.messages?.[0]?.id;

      return {
        success: true,
        messageId,
        to: cleanTo,
        message: 'WhatsApp template message dispatched successfully',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Unknown WhatsApp Cloud API error';

      console.error('[WhatsAppService] Send template error:', {
        status: err.response?.status,
        message: errorMsg,
      });

      return {
        success: false,
        message: `WhatsApp template delivery failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Verifies incoming webhook X-Hub-Signature-256 HMAC SHA256 header using timingSafeEqual.
   */
  static verifyWebhookSignature(
    rawBody: Buffer | string,
    signatureHeader?: string,
    secret?: string
  ): boolean {
    const appSecret = secret || process.env.META_APP_SECRET;
    if (!appSecret || !signatureHeader) {
      return false;
    }

    if (!signatureHeader.startsWith('sha256=')) {
      return false;
    }

    const signatureHash = signatureHeader.slice(7);

    try {
      const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedHash, 'hex');
      const receivedBuf = Buffer.from(signatureHash, 'hex');

      if (expectedBuf.length !== receivedBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, receivedBuf);
    } catch (e) {
      return false;
    }
  }
}
