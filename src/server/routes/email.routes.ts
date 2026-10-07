import { Router, Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/email/status
 * Returns Resend connection status and available templates.
 */
router.get('/status', (req: Request, res: Response) => {
  const config = EmailService.getConfig();
  res.json({
    configured: config.configured,
    fromEmail: config.fromEmail,
    provider: 'Resend Transactional API',
    templates: [
      { id: 'welcome', name: 'Welcome Email', description: 'Onboarding & Workspace initialization with AI agent highlights' },
      { id: 'login', name: 'Login Success Alert', description: 'Realtime security alert when user logs into dashboard' },
      { id: 'password_reset', name: 'Password Reset', description: '6-digit OTP & secure password reset link' },
      { id: 'seo_report', name: 'Monthly SEO Report (PDF)', description: 'Website health score, Core Web Vitals & crawled pages breakdown' },
      { id: 'invoice', name: 'Payment Invoice (PDF)', description: 'Official tax receipt with Razorpay Order ID & subscription tier' },
    ],
  });
});

/**
 * POST /api/email/test
 * Test dispatching any of the transactional email templates.
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { to, type = 'welcome', name, planName, amount, businessName, websiteUrl, otp } = req.body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid recipient email address (to).' });
    }

    const recipient = to.trim();
    let result;

    switch (type) {
      case 'login':
        result = await EmailService.sendLoginSuccess(recipient, {
          name: name || 'Founder',
          loginMethod: 'Dev Test Verification',
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Localhost',
          loginTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }),
        });
        break;
      case 'password_reset':
        result = await EmailService.sendPasswordReset(
          recipient,
          name || 'Founder',
          otp || Math.floor(100000 + Math.random() * 900000).toString(),
          `${process.env.APP_URL || 'http://localhost:3000'}/forgot-password`
        );
        break;

      case 'seo_report':
        result = await EmailService.sendMonthlySeoReport(recipient, {
          businessName: businessName || 'Truck Mitra Logistics',
          websiteUrl: websiteUrl || 'https://truckmitra.in',
          monthLabel: 'September 2026',
          overallScore: 86,
          technicalScore: 92,
          onPageScore: 84,
          contentScore: 81,
          localScore: 89,
          crawledPages: 14,
          issuesResolvedCount: 6,
          pdfDownloadUrl: `${process.env.APP_URL || 'http://localhost:3000'}/seo`,
        });
        break;

      case 'invoice':
        result = await EmailService.sendPaymentInvoice(recipient, {
          name: name || 'Founder',
          planName: planName || 'Growth Founder Slot',
          amountFormatted: amount || '₹499',
          currency: 'INR',
          orderId: `order_${Date.now().toString().slice(-8)}`,
          paymentId: `pay_${Date.now().toString().slice(-8)}`,
          invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          billingCycle: 'Monthly',
          pdfDownloadUrl: `${process.env.APP_URL || 'http://localhost:3000'}/settings`,
        });
        break;

      case 'welcome':
      default:
        result = await EmailService.sendWelcome(
          recipient,
          name || 'Growth Marketer',
          `${process.env.APP_URL || 'http://localhost:3000'}/login`
        );
        break;
    }

    if (!result.sent) {
      return res.status(400).json({
        success: false,
        error: result.error || result.reason || 'Failed to dispatch email via Resend',
        recipient,
        templateType: type,
      });
    }

    res.json({
      success: true,
      message: `✓ ${type.toUpperCase()} email successfully dispatched via Resend to ${recipient}!`,
      resendId: result.id,
      recipient,
      templateType: type,
    });
  } catch (err: any) {
    console.error('[EmailRoutes Error] Test send failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
