import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authMiddleware, AuthRequest, JWT_SECRET } from '../middleware/auth';
import { RazorpayService } from '../services/razorpay.service';
import { CashfreeService } from '../services/cashfree.service';
import { EmailService } from '../services/email.service';
import { SAAS_PLANS } from '../../config/plans';
import { WalletService } from '../services/wallet.service';

const router = Router();

function tryGetAuthUser(req: Request): { id: string; email: string; organizationId: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.id && decoded.organizationId) {
      return decoded;
    }
  } catch (e) {}
  return null;
}

/**
 * GET /api/payments/config
 * Returns active payment gateway configuration (Cashfree & Razorpay).
 * NEVER returns secret keys.
 */
router.get('/config', (req: Request, res: Response) => {
  const rzpConfig = RazorpayService.getConfig();
  const cfConfig = CashfreeService.getConfig();

  res.json({
    configured: cfConfig.configured || rzpConfig.configured,
    preferredProvider: cfConfig.configured ? 'cashfree' : (rzpConfig.configured ? 'razorpay' : 'sandbox'),
    cashfree: {
      configured: cfConfig.configured,
      appId: cfConfig.appId,
      env: cfConfig.env,
    },
    razorpay: {
      configured: rzpConfig.configured,
      keyId: rzpConfig.keyId,
    },
    usdInrRate: 1, // Pricing is natively in Indian Rupees (INR)
  });
});

/**
 * POST /api/payments/create-order
 * Initiates a payment order in Indian Rupees (INR) via Cashfree (or Razorpay fallback).
 * Supports both logged-in users and guest checkouts from landing page.
 */
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const authUser = tryGetAuthUser(req);
    let organizationId = authUser?.organizationId;
    let userId = authUser?.id;
    let userEmail = authUser?.email;
    let userName = '';

    const {
      planId,
      billingCycle = 'monthly',
      customerName,
      customerEmail,
      customerPhone,
      walletAmount,
    } = req.body;

    const isSlot = planId === 'founder_slot' || planId === 'slot_499';
    const isWalletTopUp = planId === 'wallet_topup';

    if (!planId || (!SAAS_PLANS[planId] && !isSlot && !isWalletTopUp)) {
      return res.status(400).json({ error: 'Invalid planId. Must be a paid plan, founder_slot, or wallet_topup.' });
    }

    if (isWalletTopUp && !authUser) {
      return res.status(401).json({ error: 'Please log in before adding money to your wallet.' });
    }

    if (isWalletTopUp && (!Number.isInteger(walletAmount) || walletAmount < 100 || walletAmount > 50000)) {
      return res.status(400).json({ error: 'Wallet top-ups must be a whole-rupee amount between ₹100 and ₹50,000.' });
    }

    if (planId === 'free') {
      return res.status(400).json({ error: 'Cannot create a paid order for the free plan.' });
    }

    // If guest (not authenticated yet), find or create user and organization
    if (!organizationId) {
      const email = (customerEmail || '').toLowerCase().trim();
      const name = (customerName || '').trim() || 'Valued Founder';
      const phone = (customerPhone || '').replace(/\D/g, '').slice(-10) || '9876543210';

      if (!email) {
        return res.status(400).json({
          error: 'Please provide your Email, Name, and Phone number to proceed with payment.',
        });
      }

      let existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        organizationId = existingUser.organizationId;
        userId = existingUser.id;
        userEmail = existingUser.email;
        userName = existingUser.name;
      } else {
        const tempPasswordHash = await bcrypt.hash(`Addon#${Date.now()}`, 10);
        const org = await prisma.organization.create({
          data: {
            name: `${name}'s Workspace`,
            plan: 'free',
            aiTokensUsed: 0,
            aiTokensLimit: 1000000,
          },
        });
        const newUser = await prisma.user.create({
          data: {
            email,
            passwordHash: tempPasswordHash,
            name,
            phoneNumber: phone,
            role: 'ADMIN',
            organizationId: org.id,
          },
        });
        await prisma.business.create({
          data: {
            organizationId: org.id,
            name: `${name}'s Brand`,
            industry: 'Growth Marketing',
            websiteUrl: 'https://truckmitra.com',
            description: 'Autonomous AI Marketing Platform',
            productsAndServices: JSON.stringify(['AI Growth Engine']),
            targetAudience: 'Founders & Growth Marketers',
            targetLocations: JSON.stringify(['India', 'Global']),
            marketingGoals: JSON.stringify(['Increase Inbound Traffic & Conversions']),
            brandColors: JSON.stringify({ primary: '#537CF3', secondary: '#1CB77B', accent: '#DC5495' }),
            brandTone: 'Professional & Authoritative',
            dailyBudgetLimit: 2000,
            currency: 'INR',
          },
        });
        organizationId = org.id;
        userId = newUser.id;
        userEmail = newUser.email;
        userName = newUser.name;
      }
    } else {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      userName = user?.name || userEmail?.split('@')[0] || 'Founder';
    }

    const cfConfig = CashfreeService.getConfig();
    const rzpConfig = RazorpayService.getConfig(organizationId);

    if (!cfConfig.configured && (!rzpConfig.configured || !rzpConfig.keyId)) {
      return res.status(400).json({
        configured: false,
        error: 'No active payment gateway configured. Please check Cashfree credentials in .env.',
      });
    }

    let amountRupees: number;
    let planDisplayName: string;

    if (isWalletTopUp) {
      amountRupees = walletAmount;
      planDisplayName = 'Addon AI Wallet Top-up';
    } else if (isSlot || planId === 'founder_slot') {
      amountRupees = 499;
      planDisplayName = 'Founder Lifetime Slot #1';
    } else {
      const plan = SAAS_PLANS[planId];
      const isYearly = billingCycle === 'yearly';
      amountRupees = isYearly ? plan.priceYearly : plan.priceMonthly;
      planDisplayName = plan.name;
    }

    const amountPaise = amountRupees * 100;

    // 1. CASHFREE PRODUCTION INTEGRATION (Primary Live Gateway)
    if (cfConfig.configured) {
      const orderId = `cf_${isWalletTopUp ? 'wallet' : isSlot || planId === 'founder_slot' ? 'slot' : 'plan'}_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;

      const cfOrder = await CashfreeService.createOrder({
        orderId,
        orderAmount: amountRupees,
        customerName: customerName || userName,
        customerEmail: customerEmail || userEmail || 'billing@truckmitra.in',
        customerPhone: (customerPhone || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210',
        orderNote: `Addon AI — ${planDisplayName}`,
      });

      // Save Payment record in database
      await prisma.payment.create({
        data: {
          organizationId,
          planId: isWalletTopUp ? 'wallet_topup' : isSlot ? 'founder_slot' : planId,
          billingCycle: isWalletTopUp ? 'wallet' : isSlot || planId === 'founder_slot' ? 'lifetime' : (billingCycle === 'yearly' ? 'yearly' : 'monthly'),
          amountPaise,
          currency: 'INR',
          razorpayOrderId: cfOrder.orderId,
          status: 'CREATED',
        },
      });

      return res.json({
        provider: 'cashfree',
        orderId: cfOrder.orderId,
        cfOrderId: cfOrder.cfOrderId,
        paymentSessionId: cfOrder.paymentSessionId,
        amount: cfOrder.orderAmount,
        currency: 'INR',
        env: cfConfig.env,
        plan: {
          id: planId,
          name: planDisplayName,
          priceInr: amountRupees,
          billingCycle: isWalletTopUp ? 'wallet' : isSlot || planId === 'founder_slot' ? 'lifetime' : (billingCycle === 'yearly' ? 'yearly' : 'monthly'),
        },
      });
    }

    // 2. RAZORPAY FALLBACK INTEGRATION
    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;
    const order = await RazorpayService.createOrder(
      amountPaise,
      receipt,
      {
        planId,
        billingCycle: isWalletTopUp ? 'wallet' : isSlot ? 'lifetime' : (billingCycle === 'yearly' ? 'yearly' : 'monthly'),
        organizationId,
        userEmail: userEmail || '',
      },
      organizationId
    );

    await prisma.payment.create({
      data: {
        organizationId,
        planId: isWalletTopUp ? 'wallet_topup' : planId,
        billingCycle: isWalletTopUp ? 'wallet' : isSlot ? 'lifetime' : (billingCycle === 'yearly' ? 'yearly' : 'monthly'),
        amountPaise,
        currency: 'INR',
        razorpayOrderId: order.id,
        status: 'CREATED',
      },
    });

    res.json({
      provider: 'razorpay',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: rzpConfig.keyId,
      plan: {
        id: planId,
        name: planDisplayName,
        priceInr: amountRupees,
        billingCycle: isWalletTopUp ? 'wallet' : isSlot ? 'lifetime' : (billingCycle === 'yearly' ? 'yearly' : 'monthly'),
      },
    });
  } catch (err: any) {
    console.error('[Payments Error] Create order failed:', err.message);
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
});

/**
 * POST /api/payments/verify
 * Authenticated endpoint called by frontend upon successful Razorpay modal checkout.
 * Verifies HMAC signature, ensures ownership, and activates plan idempotently.
 */
router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized: missing organization context' });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification parameters' });
    }

    // 1. Verify checkout HMAC signature
    const isValid = RazorpayService.verifyCheckoutSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      organizationId
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }

    // 2. Load payment record and verify tenant ownership
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { organization: true },
    });

    if (!payment || payment.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Payment record not found for this organization.' });
    }

    // 3. Idempotent plan activation
    if (payment.status !== 'PAID') {
      await activateSubscriptionPlan({
        paymentId: payment.id,
        organizationId: payment.organizationId,
        planId: payment.planId,
        billingCycle: payment.billingCycle,
        amountPaise: payment.amountPaise,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: razorpay_payment_id,
        userEmail: req.user?.email,
        userName: req.user?.email?.split('@')[0],
      });
    }

    const wallet = payment.planId === 'wallet_topup'
      ? await WalletService.getWallet(payment.organizationId)
      : undefined;

    res.json({
      success: true,
      message: payment.planId === 'wallet_topup'
        ? 'Payment verified and wallet balance updated successfully!'
        : 'Payment verified and subscription activated successfully!',
      planId: payment.planId,
      walletBalancePaise: wallet?.balancePaise,
    });
  } catch (err: any) {
    console.error('[Payments Error] Verify failed:', err.message);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

/**
 * POST /api/payments/cashfree/verify
 * Public & authenticated endpoint called upon Cashfree checkout completion.
 * Directly queries Cashfree API to verify real payment status.
 * Automatically generates JWT token for seamless auto-login.
 */
router.post('/cashfree/verify', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id for Cashfree verification' });
    }

    console.log(`[Payments] Verifying Cashfree order ${order_id}...`);

    // 1. Verify with Cashfree API directly
    const verification = await CashfreeService.verifyPayment(order_id);

    if (!verification.isPaid) {
      return res.status(400).json({
        success: false,
        error: `Payment is not completed yet (Status: ${verification.status}). If amount was deducted, it will auto-activate via webhook shortly.`,
        status: verification.status,
      });
    }

    // 2. Find payment record in DB
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: order_id },
      include: { organization: true },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found for this order.' });
    }

    const user = await prisma.user.findFirst({
      where: { organizationId: payment.organizationId },
    });

    // 3. Idempotently activate subscription plan
    if (payment.status !== 'PAID') {
      await activateSubscriptionPlan({
        paymentId: payment.id,
        organizationId: payment.organizationId,
        planId: payment.planId,
        billingCycle: payment.billingCycle,
        amountPaise: payment.amountPaise,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: verification.paymentId || verification.cfOrderId || `cf_${Date.now()}`,
        userEmail: user?.email,
        userName: user?.name,
      });
    }

    const wallet = payment.planId === 'wallet_topup'
      ? await WalletService.getWallet(payment.organizationId)
      : undefined;

    // 4. Generate JWT token for seamless instant access
    let token: string | null = null;
    if (user) {
      token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          organizationId: payment.organizationId,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
    }

    res.json({
      success: true,
      message: payment.planId === 'wallet_topup'
        ? '✓ Cashfree payment verified and wallet balance updated!'
        : '✓ Cashfree payment successfully verified and subscription activated!',
      orderId: order_id,
      cfOrderId: verification.cfOrderId,
      amount: verification.amount,
      planId: payment.planId,
      status: 'PAID',
      walletBalancePaise: wallet?.balancePaise,
      token,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
          }
        : null,
    });
  } catch (err: any) {
    console.error('[Cashfree Verify Error]:', err.message);
    res.status(500).json({ error: 'Failed to verify Cashfree payment: ' + err.message });
  }
});

/**
 * POST /api/payments/cashfree/webhook
 * Public endpoint for Cashfree server-to-server webhook callbacks.
 */
router.post('/cashfree/webhook', async (req: Request, res: Response) => {
  try {
    const data = req.body?.data;
    const orderId = data?.order?.order_id;
    const paymentStatus = data?.payment?.payment_status;

    console.log(`[Cashfree Webhook] Received webhook event for order: ${orderId}, status: ${paymentStatus}`);

    if (orderId && paymentStatus === 'SUCCESS') {
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
      });

      if (payment && payment.status !== 'PAID') {
        const user = await prisma.user.findFirst({
          where: { organizationId: payment.organizationId },
        });

        await activateSubscriptionPlan({
          paymentId: payment.id,
          organizationId: payment.organizationId,
          planId: payment.planId,
          billingCycle: payment.billingCycle,
          amountPaise: payment.amountPaise,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: data?.payment?.cf_payment_id?.toString() || `cf_pay_${Date.now()}`,
          userEmail: user?.email,
          userName: user?.name,
        });

        console.log(`[Cashfree Webhook] ✓ Order ${orderId} successfully activated via webhook.`);
      }
    }

    res.json({ status: 'ok' });
  } catch (err: any) {
    console.warn('[Cashfree Webhook Warning]:', err.message);
    res.status(200).json({ status: 'error', message: err.message });
  }
});

/**
 * POST /api/payments/webhook
 * Public endpoint for Razorpay webhooks (NO auth).
 * Verifies X-Razorpay-Signature against the raw request body.
 * Idempotently handles payment.captured and payment.failed.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const rawBody = (req as any).rawBody;

    if (!rawBody || !signature) {
      return res.status(400).json({ error: 'Missing rawBody or signature' });
    }

    const isValid = RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[Payments Webhook] Invalid webhook signature received.');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    const eventType = event?.event;

    console.log(`[Payments Webhook] Received verified event: ${eventType}`);

    if (eventType === 'payment.captured') {
      const paymentEntity = event?.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const payment = await prisma.payment.findUnique({
          where: { razorpayOrderId: orderId },
        });

        if (payment && payment.status !== 'PAID') {
          await activateSubscriptionPlan({
            paymentId: payment.id,
            organizationId: payment.organizationId,
            planId: payment.planId,
            billingCycle: payment.billingCycle,
            amountPaise: payment.amountPaise,
            razorpayOrderId: payment.razorpayOrderId,
            razorpayPaymentId: paymentId || payment.razorpayPaymentId || `pay_wh_${Date.now()}`,
            userEmail: paymentEntity?.email,
          });
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = event?.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const payment = await prisma.payment.findUnique({
          where: { razorpayOrderId: orderId },
        });

        if (payment && payment.status === 'CREATED') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              razorpayPaymentId: paymentId,
            },
          });
          console.log(`[Payments Webhook] Marked payment ${payment.id} as FAILED`);
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Payments Webhook Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Helper to idempotently activate a subscription plan, update token quotas,
 * and dispatch payment receipt email.
 */
async function activateSubscriptionPlan(params: {
  paymentId: string;
  organizationId: string;
  planId: string;
  billingCycle: string;
  amountPaise: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  userEmail?: string;
  userName?: string;
}) {
  if (params.planId === 'wallet_topup') {
    await prisma.$transaction(async (tx) => {
      const paymentUpdate = await tx.payment.updateMany({
        where: { id: params.paymentId, status: { not: 'PAID' } },
        data: { status: 'PAID', razorpayPaymentId: params.razorpayPaymentId },
      });

      if (paymentUpdate.count === 0) return;

      await tx.organization.update({
        where: { id: params.organizationId },
        data: { walletBalancePaise: { increment: params.amountPaise } },
      });

      await tx.walletTransaction.create({
        data: {
          organizationId: params.organizationId,
          amountPaise: params.amountPaise,
          type: 'TOP_UP',
          status: 'POSTED',
          description: 'Wallet top-up',
          referenceId: `wallet-payment:${params.paymentId}`,
        },
      });
    });

    return;
  }

  const isSlot = params.planId === 'founder_slot' || params.planId === 'slot_499';
  const plan = isSlot ? SAAS_PLANS.growth : (SAAS_PLANS[params.planId] || SAAS_PLANS.growth);
  const isYearly = params.billingCycle === 'yearly';

  // Compute period end date (+1 month, +1 year, or 100 years for lifetime slot)
  const currentPeriodEnd = new Date();
  if (isSlot) {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 100);
  } else if (isYearly) {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
  } else {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  }

  // 1. Update Payment status to PAID
  await prisma.payment.update({
    where: { id: params.paymentId },
    data: {
      status: 'PAID',
      razorpayPaymentId: params.razorpayPaymentId,
    },
  });

  // 2. Update Organization plan & aiTokensLimit
  await prisma.organization.update({
    where: { id: params.organizationId },
    data: {
      plan: params.planId,
      aiTokensLimit: plan.aiTokensPerMonth,
    },
  });

  // 3. Create Subscription record
  await prisma.subscription.create({
    data: {
      organizationId: params.organizationId,
      planId: params.planId,
      status: 'ACTIVE',
      currentPeriodEnd,
    },
  });

  console.log(`[Payments] Successfully activated ${plan.name} (${params.billingCycle}) for org ${params.organizationId}`);

  // 4. Send email receipt (fire-and-forget, never throws)
  if (params.userEmail) {
    const amountFormatted = `₹${(params.amountPaise / 100).toLocaleString('en-IN')}`;
    const emailData = EmailService.templates.paymentReceipt({
      name: params.userName || 'Founder',
      email: params.userEmail,
      planName: plan.name,
      amountFormatted,
      currency: 'INR',
      orderId: params.razorpayOrderId,
      paymentId: params.razorpayPaymentId,
    });

    EmailService.sendEmail({
      to: params.userEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      organizationId: params.organizationId,
    }).catch((err) => {
      console.warn('[Payments] Could not send receipt email:', err.message);
    });
  }
}

export default router;
