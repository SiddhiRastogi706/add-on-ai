import axios from 'axios';
import crypto from 'crypto';

export interface RazorpayConfig {
  configured: boolean;
  keyId: string | null;
  keySecret: string | null;
  webhookSecret: string | null;
  usdInrRate: number;
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export class RazorpayService {
  /**
   * Single helper to resolve credentials/config.
   * Can easily be swapped to per-organization encrypted DB storage in the future.
   */
  static getConfig(organizationId?: string): RazorpayConfig {
    const keyId = process.env.RAZORPAY_KEY_ID || null;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || null;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || null;
    const rateEnv = process.env.USD_INR_RATE;
    const usdInrRate = rateEnv && !isNaN(Number(rateEnv)) ? Number(rateEnv) : 85;

    const configured = Boolean(keyId && keySecret);

    return {
      configured,
      keyId,
      keySecret,
      webhookSecret,
      usdInrRate,
    };
  }

  /**
   * Creates an order with Razorpay via direct HTTP call.
   */
  static async createOrder(
    amountPaise: number,
    receipt: string,
    notes?: Record<string, string>,
    organizationId?: string
  ): Promise<RazorpayOrderResponse> {
    const config = this.getConfig(organizationId);

    if (!config.configured || !config.keyId || !config.keySecret) {
      throw new Error('Razorpay is not configured. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.');
    }

    const authHeader = `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`;

    try {
      const response = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
          amount: amountPaise,
          currency: 'INR',
          receipt,
          notes: notes || {},
        },
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log(`[Razorpay] Order created: status ${response.status}, orderId: ${response.data?.id}`);

      return {
        id: response.data.id,
        amount: response.data.amount,
        currency: response.data.currency,
        status: response.data.status,
        receipt: response.data.receipt,
        notes: response.data.notes,
      };
    } catch (err: any) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error?.description || err.message || 'Razorpay order creation failed';
      console.error(`[Razorpay Error] Failed to create order: status ${status || 'unknown'}, message: ${errorMsg}`);
      throw new Error(`Razorpay Error: ${errorMsg}`);
    }
  }

  /**
   * Verifies checkout payment signature using HMAC SHA256 and constant-time timingSafeEqual.
   */
  static verifyCheckoutSignature(
    orderId: string,
    paymentId: string,
    signature: string,
    organizationId?: string
  ): boolean {
    const config = this.getConfig(organizationId);
    if (!config.keySecret) {
      console.warn('[Razorpay] Cannot verify checkout signature: RAZORPAY_KEY_SECRET is not configured.');
      return false;
    }

    try {
      const payload = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', config.keySecret)
        .update(payload)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const actualBuf = Buffer.from(signature, 'utf8');

      if (expectedBuf.length !== actualBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch (err: any) {
      console.error('[Razorpay] Error verifying checkout signature:', err.message);
      return false;
    }
  }

  /**
   * Verifies webhook payload signature against raw request body using HMAC SHA256 and timingSafeEqual.
   */
  static verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    organizationId?: string
  ): boolean {
    const config = this.getConfig(organizationId);
    if (!config.webhookSecret) {
      console.warn('[Razorpay] Cannot verify webhook signature: RAZORPAY_WEBHOOK_SECRET is not configured.');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', config.webhookSecret)
        .update(rawBody)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const actualBuf = Buffer.from(signature, 'utf8');

      if (expectedBuf.length !== actualBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch (err: any) {
      console.error('[Razorpay] Error verifying webhook signature:', err.message);
      return false;
    }
  }
}
