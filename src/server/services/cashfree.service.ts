import axios from 'axios';

export interface CashfreeConfig {
  configured: boolean;
  appId: string | null;
  secretKey: string | null;
  env: 'production' | 'sandbox';
  baseUrl: string;
  apiVersion: string;
  returnUrl: string;
}

export interface CashfreeOrderResponse {
  orderId: string;
  cfOrderId: string;
  paymentSessionId: string;
  orderAmount: number;
  orderCurrency: string;
  orderStatus: string;
  createdAt: string;
}

export interface CashfreePaymentRecord {
  paymentId: string;
  cfPaymentId: string;
  paymentStatus: string; // 'SUCCESS' | 'FAILED' | 'PENDING' | 'USER_DROPPED'
  paymentAmount: number;
  paymentCurrency: string;
  paymentMethod: any;
  paymentTime: string;
}

export class CashfreeService {
  /**
   * Retrieves Cashfree configuration from environment variables.
   */
  static getConfig(): CashfreeConfig {
    const appId = process.env.CASHFREE_APP_ID || null;
    const secretKey = process.env.CASHFREE_SECRET_KEY || null;
    const env = (process.env.CASHFREE_ENV === 'sandbox' ? 'sandbox' : 'production') as 'production' | 'sandbox';
    const baseUrl = env === 'sandbox' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';
    const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';
    const returnUrl = process.env.CASHFREE_RETURN_URL || 'https://truckmitra.in/payments/verify';

    const configured = Boolean(appId && secretKey);

    return {
      configured,
      appId,
      secretKey,
      env,
      baseUrl,
      apiVersion,
      returnUrl,
    };
  }

  /**
   * Gets standard auth and version headers for Cashfree API.
   */
  private static getHeaders() {
    const config = this.getConfig();
    if (!config.configured || !config.appId || !config.secretKey) {
      throw new Error('Cashfree is not configured. Missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY.');
    }

    return {
      'x-client-id': config.appId,
      'x-client-secret': config.secretKey,
      'x-api-version': config.apiVersion,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Creates a live order on Cashfree Payment Gateway.
   * Supports UPI, Cards, NetBanking, and Wallets in Indian Rupees (INR).
   */
  static async createOrder(params: {
    orderId: string;
    orderAmount: number; // In Rupees (e.g. 499.00 or 1.00)
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    returnUrl?: string;
    notifyUrl?: string;
    orderNote?: string;
    tags?: Record<string, string>;
  }): Promise<CashfreeOrderResponse> {
    const config = this.getConfig();
    const headers = this.getHeaders();

    // Ensure phone number has at least 10 digits
    const cleanPhone = params.customerPhone.replace(/\D/g, '').slice(-10) || '9999999999';

    // Return URL with {order_id} template token for frontend redirect verification
    // Cashfree Production requires https URLs
    const defaultHttpsReturn = 'https://truckmitra.in/payments/verify';
    const rawReturnUrl = params.returnUrl || config.returnUrl || defaultHttpsReturn;
    const returnUrl = rawReturnUrl.startsWith('https://')
      ? (rawReturnUrl.includes('{order_id}') ? rawReturnUrl : `${rawReturnUrl}?order_id={order_id}`)
      : `${defaultHttpsReturn}?order_id={order_id}`;

    const defaultHttpsNotify = 'https://truckmitra.in/api/payments/cashfree/webhook';
    const rawNotify = params.notifyUrl || (process.env.APP_URL?.startsWith('https://') ? `${process.env.APP_URL}/api/payments/cashfree/webhook` : defaultHttpsNotify);
    const notifyUrl = rawNotify.startsWith('https://') ? rawNotify : defaultHttpsNotify;

    const payload = {
      order_id: params.orderId,
      order_amount: Math.round(params.orderAmount * 100) / 100,
      order_currency: 'INR',
      customer_details: {
        customer_id: `cust_${cleanPhone}`,
        customer_name: params.customerName || 'Growth Marketer',
        customer_email: params.customerEmail || 'billing@truckmitra.in',
        customer_phone: cleanPhone,
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
      },
      order_note: params.orderNote || 'Addon AI Marketing Platform',
      order_tags: params.tags || undefined,
    };

    try {
      console.log(`[CashfreeService] Initiating order ${params.orderId} for ₹${payload.order_amount} INR (${config.env})...`);
      const response = await axios.post(`${config.baseUrl}/orders`, payload, {
        headers,
        timeout: 15000,
      });

      const data = response.data;
      console.log(`[CashfreeService] Order created successfully! CF Order ID: ${data.cf_order_id}, Status: ${data.order_status}`);

      return {
        orderId: data.order_id,
        cfOrderId: data.cf_order_id?.toString(),
        paymentSessionId: data.payment_session_id,
        orderAmount: data.order_amount,
        orderCurrency: data.order_currency,
        orderStatus: data.order_status,
        createdAt: data.created_at,
      };
    } catch (err: any) {
      const status = err.response?.status;
      const errorData = err.response?.data;
      const errorMsg = errorData?.message || errorData?.description || err.message || 'Cashfree order creation failed';
      console.error(`[CashfreeService Error] Failed to create order: status ${status}, message: ${errorMsg}`, errorData);
      throw new Error(`Cashfree Error: ${errorMsg}`);
    }
  }

  /**
   * Fetches order details directly from Cashfree to check real payment status.
   */
  static async getOrder(orderId: string): Promise<any> {
    const config = this.getConfig();
    const headers = this.getHeaders();

    try {
      const response = await axios.get(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
        headers,
        timeout: 12000,
      });
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error(`[CashfreeService Error] Failed to get order ${orderId}: ${errorMsg}`);
      throw new Error(`Cashfree Order Lookup Error: ${errorMsg}`);
    }
  }

  /**
   * Fetches all payment transactions attempted for an order.
   */
  static async getOrderPayments(orderId: string): Promise<CashfreePaymentRecord[]> {
    const config = this.getConfig();
    const headers = this.getHeaders();

    try {
      const response = await axios.get(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, {
        headers,
        timeout: 12000,
      });

      const list = Array.isArray(response.data) ? response.data : [];
      return list.map((item: any) => ({
        paymentId: item.cf_payment_id?.toString() || item.payment_id?.toString(),
        cfPaymentId: item.cf_payment_id?.toString(),
        paymentStatus: item.payment_status,
        paymentAmount: item.payment_amount,
        paymentCurrency: item.payment_currency || 'INR',
        paymentMethod: item.payment_method,
        paymentTime: item.payment_time,
      }));
    } catch (err: any) {
      console.warn(`[CashfreeService] Warning fetching payments for ${orderId}:`, err.message);
      return [];
    }
  }

  /**
   * Comprehensive verification: returns true if the order is PAID or has a successful payment.
   */
  static async verifyPayment(orderId: string): Promise<{
    isPaid: boolean;
    orderId: string;
    cfOrderId?: string;
    amount?: number;
    paymentId?: string;
    status: string;
  }> {
    const orderData = await this.getOrder(orderId);
    const orderStatus = orderData?.order_status;

    if (orderStatus === 'PAID') {
      const payments = await this.getOrderPayments(orderId);
      const successfulPayment = payments.find((p) => p.paymentStatus === 'SUCCESS') || payments[0];

      return {
        isPaid: true,
        orderId,
        cfOrderId: orderData.cf_order_id?.toString(),
        amount: orderData.order_amount,
        paymentId: successfulPayment?.cfPaymentId || successfulPayment?.paymentId || orderData.cf_order_id?.toString(),
        status: 'PAID',
      };
    }

    return {
      isPaid: false,
      orderId,
      cfOrderId: orderData?.cf_order_id?.toString(),
      amount: orderData?.order_amount,
      status: orderStatus || 'PENDING',
    };
  }
}
