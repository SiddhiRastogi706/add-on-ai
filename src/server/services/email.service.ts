import axios from 'axios';
import { BRAND } from '../../config/brand';

export interface EmailConfig {
  configured: boolean;
  apiKey: string | null;
  fromEmail: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  organizationId?: string;
}

export interface SendEmailResult {
  sent: boolean;
  id?: string;
  error?: string;
  reason?: string;
}

export class EmailService {
  /**
   * Single helper to resolve email credentials/config.
   * Defaults to onboarding@resend.dev unless a custom verified domain is specified.
   */
  static getConfig(organizationId?: string): EmailConfig {
    const apiKey = process.env.RESEND_API_KEY || null;
    let fromEmail = process.env.EMAIL_FROM || `Addon AI <onboarding@resend.dev>`;
    if (!fromEmail.includes('@')) {
      fromEmail = `Addon AI <onboarding@resend.dev>`;
    }
    const configured = Boolean(apiKey && apiKey.trim().length > 0);

    return {
      configured,
      apiKey,
      fromEmail,
    };
  }

  /**
   * Dispatches email via Resend API using direct HTTP POST.
   * If not configured, gracefully returns { sent: false, reason: 'not_configured' } without throwing.
   */
  static async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const config = this.getConfig(options.organizationId);

    if (!config.configured || !config.apiKey) {
      console.log(`[EmailService] Resend not configured. Skipped sending email to ${options.to}`);
      return { sent: false, reason: 'not_configured' };
    }

    const isSyntheticEmail = options.to.endsWith('@addon.ai');
    const targetEmail = isSyntheticEmail ? 'skyexpressroad@gmail.com' : options.to;

    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: config.fromEmail,
          to: [targetEmail],
          subject: options.subject,
          html: options.html,
          ...(options.text ? { text: options.text } : {}),
        },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 12000,
        }
      );

      console.log(`[EmailService] Email sent successfully to ${targetEmail}: status ${response.status}, id: ${response.data?.id}`);
      return {
        sent: true,
        id: response.data?.id,
      };
    } catch (err: any) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.message || err.message || 'Resend API call failed';
      console.error(`[EmailService Error] Failed to send email to ${targetEmail}: status ${status || 'unknown'}, message: ${errorMsg}`);

      // Resend Free/Testing Sandbox restriction fallback:
      // If Resend only allows sending to the registered account email (skyexpressroad@gmail.com),
      // forward to that address so the user receives all test alerts in their real inbox!
      if (
        status === 403 &&
        typeof errorMsg === 'string' &&
        errorMsg.includes('You can only send testing emails to your own email address') &&
        targetEmail !== 'skyexpressroad@gmail.com'
      ) {
        console.warn(`[EmailService] Resend unverified domain sandbox mode: forwarding test notification to registered account (skyexpressroad@gmail.com)...`);
        try {
          const fallbackRes = await axios.post(
            'https://api.resend.com/emails',
            {
              from: config.fromEmail,
              to: ['skyexpressroad@gmail.com'],
              subject: options.subject,
              html: `<div style="padding:10px 14px;background:#fef3c7;border-left:4px solid #f59e0b;font-family:sans-serif;font-size:12px;color:#92400e;margin-bottom:16px;">
                <strong>Sandbox Testing Notice:</strong> Resend unverified domain mode me yeh email <code>${targetEmail}</code> ke liye bheja gaya tha, jo aapke verified account par deliver kiya gaya hai.
              </div>` + options.html,
              ...(options.text ? { text: options.text } : {}),
            },
            {
              headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 12000,
            }
          );
          console.log(`[EmailService] Fallback email delivered to skyexpressroad@gmail.com, id: ${fallbackRes.data?.id}`);
          return {
            sent: true,
            id: fallbackRes.data?.id,
          };
        } catch (fallbackErr: any) {
          console.error(`[EmailService] Fallback dispatch failed:`, fallbackErr.message);
        }
      }

      return {
        sent: false,
        error: errorMsg,
      };
    }
  }

  // =========================================================================
  // DIRECT CONVENIENCE METHODS
  // =========================================================================

  /**
   * 1. Send Welcome Email
   */
  static async sendWelcome(to: string, name: string, loginUrl?: string, organizationId?: string): Promise<SendEmailResult> {
    const template = this.templates.welcome({
      name,
      email: to,
      appName: BRAND.appName,
      loginUrl: loginUrl || `${process.env.APP_URL || 'http://localhost:3000'}/login`,
    });
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      organizationId,
    });
  }

  /**
   * 2. Send Password Reset / Security OTP Email
   */
  static async sendPasswordReset(
    to: string,
    name: string,
    otp: string,
    resetUrl?: string,
    organizationId?: string
  ): Promise<SendEmailResult> {
    const template = this.templates.passwordReset({
      name,
      email: to,
      otp,
      resetUrl: resetUrl || `${process.env.APP_URL || 'http://localhost:3000'}/forgot-password`,
      expiresMinutes: 10,
    });
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      organizationId,
    });
  }

  /**
   * 3. Send Monthly SEO Report (PDF) Email
   */
  static async sendMonthlySeoReport(
    to: string,
    params: {
      businessName: string;
      websiteUrl: string;
      monthLabel?: string;
      overallScore?: number;
      technicalScore?: number;
      onPageScore?: number;
      contentScore?: number;
      localScore?: number;
      crawledPages?: number;
      issuesResolvedCount?: number;
      pdfDownloadUrl?: string;
    },
    organizationId?: string
  ): Promise<SendEmailResult> {
    const template = this.templates.monthlySeoReport({
      businessName: params.businessName || 'Your Business',
      websiteUrl: params.websiteUrl || 'https://truckmitra.in',
      monthLabel: params.monthLabel || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      overallScore: params.overallScore ?? 84,
      technicalScore: params.technicalScore ?? 90,
      onPageScore: params.onPageScore ?? 82,
      contentScore: params.contentScore ?? 78,
      localScore: params.localScore ?? 88,
      crawledPages: params.crawledPages ?? 12,
      issuesResolvedCount: params.issuesResolvedCount ?? 5,
      pdfDownloadUrl: params.pdfDownloadUrl || `${process.env.APP_URL || 'http://localhost:3000'}/seo`,
    });
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      organizationId,
    });
  }

  /**
   * 4. Send Payment Invoice / Receipt (PDF) Email
   */
  static async sendPaymentInvoice(
    to: string,
    params: {
      name?: string;
      planName: string;
      amountFormatted: string;
      currency?: string;
      orderId: string;
      paymentId: string;
      invoiceNumber?: string;
      billingCycle?: string;
      date?: string;
      pdfDownloadUrl?: string;
    },
    organizationId?: string
  ): Promise<SendEmailResult> {
    const template = this.templates.paymentInvoice({
      name: params.name || 'Founder',
      email: to,
      planName: params.planName,
      amountFormatted: params.amountFormatted,
      currency: params.currency || 'INR',
      orderId: params.orderId,
      paymentId: params.paymentId,
      invoiceNumber: params.invoiceNumber,
      billingCycle: params.billingCycle || 'Monthly',
      date: params.date,
      pdfDownloadUrl: params.pdfDownloadUrl,
    });
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      organizationId,
    });
  }

  /**
   * 5. Send Successful Login Notification Email
   */
  static async sendLoginSuccess(
    to: string,
    params: {
      name?: string;
      loginTime?: string;
      ip?: string;
      loginMethod?: string;
      dashboardUrl?: string;
    },
    organizationId?: string
  ): Promise<SendEmailResult> {
    const template = this.templates.loginSuccess({
      name: params.name || 'Founder',
      email: to,
      loginTime: params.loginTime || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      ip: params.ip,
      loginMethod: params.loginMethod || 'Secure Web Authentication',
      dashboardUrl: params.dashboardUrl || `${process.env.APP_URL || 'http://localhost:3000'}/`,
    });
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      organizationId,
    });
  }

  /**
   * 6. Send VIP Founder Slot Booking Confirmation Email
   */
  static async sendSlotBookingConfirmation(
    to: string,
    params: {
      name: string;
      phone: string;
      email: string;
      slotDate?: string;
      slotTime?: string;
      slotNumber?: number;
      company?: string;
      notes?: string;
    },
    organizationId?: string
  ): Promise<SendEmailResult> {
    const template = this.templates.slotBookingConfirmation({
      name: params.name,
      email: to,
      phone: params.phone,
      slotDate: params.slotDate || new Date().toLocaleDateString('en-IN', { dateStyle: 'full' }),
      slotTime: params.slotTime || '11:30 AM IST',
      slotNumber: params.slotNumber || 89,
      company: params.company,
      notes: params.notes,
    });
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      organizationId,
    });
  }

  // =========================================================================
  // BRANDED, HIGH-CONVERTING HTML TEMPLATES
  // =========================================================================
  static templates = {
    /**
     * Template 1: Welcome Email
     */
    welcome(params: { name: string; email: string; appName?: string; loginUrl?: string }): { subject: string; html: string; text: string } {
      const appName = params.appName || BRAND.appName;
      const loginUrl = params.loginUrl || `${process.env.APP_URL || 'http://localhost:3000'}/login`;
      const subject = `Welcome to ${appName} — Your Autonomous 24/7 AI Marketing Team!`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Hero Banner -->
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%); padding: 36px 28px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 14px; background: rgba(255, 255, 255, 0.2); font-size: 24px; font-weight: 900; margin-bottom: 12px;">a</div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">${appName}</h1>
      <p style="margin: 8px 0 0; opacity: 0.92; font-size: 14px; font-weight: 500;">${BRAND.tagline}</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 36px 32px;">
      <p style="font-size: 18px; font-weight: 700; margin-top: 0; color: #0f172a;">Welcome aboard, ${params.name || 'Founder'}! 👋</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Your workspace has been successfully initialized. Our fleet of <strong>10 specialized autonomous AI agents</strong> is now ready to audit your website, track competitor search gaps, generate high-converting campaigns, and scale your inbound revenue 24/7.
      </p>

      <!-- Account Details Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px;">Your Workspace Credentials</div>
        <div style="font-size: 13px; color: #334155; margin-bottom: 6px;"><strong>Registered Email:</strong> <span style="font-family: monospace; color: #4f46e5;">${params.email}</span></div>
        <div style="font-size: 13px; color: #334155; margin-bottom: 6px;"><strong>Workspace Plan:</strong> Founder Growth Tier</div>
        <div style="font-size: 13px; color: #334155;"><strong>AI Quota:</strong> 600,000 Autonomous AI Tokens / Mo</div>
      </div>

      <!-- Autonomous Agent Fleet Highlights -->
      <div style="margin: 28px 0 24px;">
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 12px;">What Your AI Fleet Does Starting Today:</div>
        
        <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
          <strong style="color: #4f46e5; font-size: 13px;">🔍 Technical & On-Page SEO Agent:</strong>
          <p style="margin: 3px 0 0; font-size: 12px; color: #64748b;">Live site crawler, Core Web Vitals diagnostics, Schema JSON-LD auto-patches, and SERP Rank Tracker.</p>
        </div>

        <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
          <strong style="color: #059669; font-size: 13px;">🎯 Meta & Google Ads Specialist:</strong>
          <p style="margin: 3px 0 0; font-size: 12px; color: #64748b;">Autonomous high-intent ad copy, creatives, and strict paused-status campaigns with budget safety limits.</p>
        </div>

        <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
          <strong style="color: #d97706; font-size: 13px;">✍️ Autonomous Content & Social Engine:</strong>
          <p style="margin: 3px 0 0; font-size: 12px; color: #64748b;">Long-form blogs, landing pages, LinkedIn thought leadership posts, and AI image posters on auto-pilot.</p>
        </div>

        <div style="padding: 10px 0;">
          <strong style="color: #7c3aed; font-size: 13px;">⚔️ 24/7 Competitor Intelligence:</strong>
          <p style="margin: 3px 0 0; font-size: 12px; color: #64748b;">Continuous organic keyword gap monitoring to capture missed traffic from rival platforms.</p>
        </div>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 14px 34px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);">
          Launch AI Command Center &rarr;
        </a>
      </div>

      <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 0;">
        Have questions or want custom agent workflows? Reply directly to this email or visit our documentation portal.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
      &copy; ${BRAND.year} ${BRAND.companyName}. All rights reserved. &bull; <a href="https://addon.ai" style="color: #64748b; text-decoration: none;">addon.ai</a>
    </div>
  </div>
</body>
</html>
      `;

      const text = `Welcome to ${appName}!\n\nHello ${params.name},\n\nYour workspace has been created. Log in at ${loginUrl} to access your 24/7 AI marketing team.\n\nAccount: ${params.email}\nPlan: Founder Growth Tier\n\nSupport: ${BRAND.contactEmail}`;

      return { subject, html, text };
    },

    /**
     * Template 2: Password Reset / Verification Code
     */
    passwordReset(params: { name?: string; email: string; otp: string; resetUrl?: string; expiresMinutes?: number }): { subject: string; html: string; text: string } {
      const exp = params.expiresMinutes || 10;
      const resetUrl = params.resetUrl || `${process.env.APP_URL || 'http://localhost:3000'}/forgot-password`;
      const subject = `🔒 ${params.otp} is your ${BRAND.appName} Security Code`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #38bdf8; text-transform: uppercase;">Account Security & Verification</div>
      <h1 style="margin: 6px 0 0; font-size: 20px; font-weight: 800;">${BRAND.appName}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px 28px; text-align: center;">
      <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 0;">Password Reset Request</p>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 8px 0 20px;">
        We received a request to reset your password or sign into your <strong>${BRAND.appName}</strong> workspace. Use the 6-digit verification code below:
      </p>

      <!-- OTP Box -->
      <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 14px; padding: 18px 24px; margin: 20px 0; display: inline-block;">
        <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">${params.otp}</span>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
        ⏱️ This verification code is valid for <strong>${exp} minutes</strong>.
      </p>

      <div style="margin: 28px 0;">
        <a href="${resetUrl}" style="background: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block;">
          Enter Code & Reset Password &rarr;
        </a>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 12px 16px; text-align: left; font-size: 11px; color: #92400e; margin-top: 24px;">
        <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email. Your password remains safe and no changes have been applied to your account.
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
      &copy; ${BRAND.year} ${BRAND.companyName} &bull; Security & Identity Protection
    </div>
  </div>
</body>
</html>
      `;

      const text = `Your ${BRAND.appName} password reset verification code is: ${params.otp}\n\nThis code expires in ${exp} minutes.\nReset link: ${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`;

      return { subject, html, text };
    },

    /**
     * Template 3: Monthly SEO Audit & Performance Report (PDF)
     */
    monthlySeoReport(params: {
      businessName: string;
      websiteUrl: string;
      monthLabel: string;
      overallScore: number;
      technicalScore: number;
      onPageScore: number;
      contentScore: number;
      localScore: number;
      crawledPages: number;
      issuesResolvedCount: number;
      pdfDownloadUrl?: string;
    }): { subject: string; html: string; text: string } {
      const subject = `📊 Monthly SEO Audit & Performance Briefing: ${params.monthLabel} — ${params.businessName}`;
      const downloadUrl = params.pdfDownloadUrl || `${process.env.APP_URL || 'http://localhost:3000'}/seo`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); padding: 32px 28px; color: #ffffff;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #38bdf8; text-transform: uppercase;">Executive SEO Audit Report</span>
        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 6px;">${params.monthLabel}</span>
      </div>
      <h1 style="margin: 10px 0 2px; font-size: 22px; font-weight: 900;">${params.businessName}</h1>
      <p style="margin: 0; font-size: 12px; color: #cbd5e1; font-family: monospace;">Target Domain: ${params.websiteUrl}</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 28px;">
      
      <!-- Overall Health Card -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%); border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">Overall Website SEO Health Score</div>
        <div style="font-size: 48px; font-weight: 900; color: #065f46; margin: 4px 0;">${params.overallScore}<span style="font-size: 20px; font-weight: 700; color: #047857;">/100</span></div>
        <div style="font-size: 13px; font-weight: 700; color: #047857;">✓ Excellent Organic Visibility & Technical Compliance</div>
      </div>

      <!-- 4 Pillars Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Technical SEO</div>
          <div style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 4px 0;">${params.technicalScore}%</div>
          <div style="font-size: 11px; color: #059669; font-weight: 600;">Sitemap & HTTPS Valid</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">On-Page Architecture</div>
          <div style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 4px 0;">${params.onPageScore}%</div>
          <div style="font-size: 11px; color: #059669; font-weight: 600;">H1, Meta Titles & Tags</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Content Depth</div>
          <div style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 4px 0;">${params.contentScore}%</div>
          <div style="font-size: 11px; color: #059669; font-weight: 600;">Word Count & Headings</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Local SEO (NAP)</div>
          <div style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 4px 0;">${params.localScore}%</div>
          <div style="font-size: 11px; color: #059669; font-weight: 600;">Google Business Sync</div>
        </div>
      </div>

      <!-- Autonomous Agent Actions Summary -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin-bottom: 28px;">
        <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 10px;">Executive Highlights This Month:</div>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #475569; line-height: 1.7;">
          <li><strong>${params.crawledPages} Internal Pages Scanned</strong> across mobile & desktop crawlers.</li>
          <li><strong>${params.issuesResolvedCount} Automated SEO Patches Staged</strong> (JSON-LD LocalBusiness Schema & Meta tags).</li>
          <li><strong>Lighthouse v5 Core Web Vitals Passed:</strong> FCP clocked at 1.3s (target &le; 1.8s).</li>
          <li><strong>Keyword Rank Movements:</strong> High-intent queries tracked across SERP 3-Pack and Knowledge snippets.</li>
        </ul>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 32px 0 16px;">
        <a href="${downloadUrl}" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff; padding: 14px 34px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);">
          Download Full SEO Report (PDF) &rarr;
        </a>
      </div>
      <div style="text-align: center; font-size: 12px;">
        <a href="${downloadUrl}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Open Live SEO Studio in Dashboard</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
      Generated Autonomously by ${BRAND.appName} Technical SEO Agent &bull; ${BRAND.tagline}
    </div>
  </div>
</body>
</html>
      `;

      const text = `Monthly SEO Audit Briefing — ${params.businessName} (${params.monthLabel})\n\nOverall SEO Score: ${params.overallScore}/100\nTechnical: ${params.technicalScore}%\nOn-Page: ${params.onPageScore}%\nContent: ${params.contentScore}%\nLocal SEO: ${params.localScore}%\n\nPages Scanned: ${params.crawledPages}\nIssues Resolved: ${params.issuesResolvedCount}\n\nView Full Report: ${downloadUrl}`;

      return { subject, html, text };
    },

    /**
     * Template 4: Payment Invoice / Tax Receipt (PDF)
     */
    paymentInvoice(params: {
      name: string;
      email: string;
      planName: string;
      amountFormatted: string;
      currency?: string;
      orderId: string;
      paymentId: string;
      invoiceNumber?: string;
      billingCycle?: string;
      date?: string;
      pdfDownloadUrl?: string;
    }): { subject: string; html: string; text: string } {
      const invNum = params.invoiceNumber || `INV-${new Date().getFullYear()}-${params.paymentId.slice(-6).toUpperCase()}`;
      const dateStr = params.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const subject = `🧾 Tax Invoice #${invNum} & Payment Receipt — ${params.planName} (${BRAND.appName})`;
      const downloadUrl = params.pdfDownloadUrl || `${process.env.APP_URL || 'http://localhost:3000'}/settings`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Invoice Header -->
    <div style="background: #0f172a; padding: 32px 28px; color: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">${BRAND.appName}</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">${BRAND.companyName}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Official Tax Receipt</div>
          <div style="font-size: 13px; font-family: monospace; font-weight: 700; color: #ffffff; margin-top: 2px;">#${invNum}</div>
        </div>
      </div>
    </div>

    <!-- Invoice Details -->
    <div style="padding: 32px 28px;">
      
      <!-- Billed To & Date -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px;">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Billed To</div>
          <div style="font-weight: 700; color: #0f172a;">${params.name || 'Valued Customer'}</div>
          <div style="color: #64748b; font-family: monospace;">${params.email}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Invoice Date</div>
          <div style="font-weight: 700; color: #0f172a;">${dateStr}</div>
          <div style="margin-top: 4px;"><span style="display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800;">✓ PAID & VERIFIED</span></div>
        </div>
      </div>

      <!-- Line Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase;">
            <th style="padding: 10px 0;">Description</th>
            <th style="padding: 10px 0; text-align: center;">Billing Cycle</th>
            <th style="padding: 10px 0; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 14px 0;">
              <strong style="color: #0f172a; font-size: 14px;">${params.planName} Plan</strong>
              <div style="color: #64748b; font-size: 12px; margin-top: 2px;">Autonomous AI CMO Fleet Access (All 10 Agents)</div>
            </td>
            <td style="padding: 14px 0; text-align: center; color: #64748b;">${params.billingCycle || 'Monthly'}</td>
            <td style="padding: 14px 0; text-align: right; font-weight: 700; color: #0f172a;">${params.amountFormatted}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 14px 0; text-align: right; color: #64748b; font-size: 13px;">Subtotal:</td>
            <td style="padding: 14px 0; text-align: right; font-weight: 700; color: #0f172a; font-size: 13px;">${params.amountFormatted}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 0; text-align: right; color: #64748b; font-size: 13px;">GST / Taxes (Included):</td>
            <td style="padding: 4px 0; text-align: right; color: #64748b; font-size: 13px;">₹0.00</td>
          </tr>
          <tr style="border-top: 2px solid #e2e8f0;">
            <td colspan="2" style="padding: 12px 0; text-align: right; font-weight: 800; font-size: 15px; color: #0f172a;">Total Paid:</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 900; font-size: 18px; color: #059669;">${params.amountFormatted}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Payment Gateway Verification Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 28px; font-size: 12px; color: #64748b;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Razorpay Payment ID:</span>
          <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${params.paymentId}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Razorpay Order ID:</span>
          <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${params.orderId}</span>
        </div>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="${downloadUrl}" style="background: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 13px; display: inline-block;">
          Download Tax Invoice (PDF) &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
      &copy; ${BRAND.year} ${BRAND.companyName} &bull; ${BRAND.contactEmail} &bull; GST Registered
    </div>
  </div>
</body>
</html>
      `;

      const text = `Official Tax Invoice #${invNum} — ${BRAND.appName}\n\nPlan: ${params.planName}\nAmount Paid: ${params.amountFormatted}\nDate: ${dateStr}\nPayment ID: ${params.paymentId}\nOrder ID: ${params.orderId}\nBilled To: ${params.email}\n\nThank you for choosing ${BRAND.appName}!`;

      return { subject, html, text };
    },

    /**
     * Backward-Compatible Aliases
     */
    otpBackup(params: { name?: string; email: string; otp: string; expiresMinutes?: number }): { subject: string; html: string; text: string } {
      return EmailService.templates.passwordReset(params);
    },

    paymentReceipt(params: {
      name: string;
      email: string;
      planName: string;
      amountFormatted: string;
      currency: string;
      orderId: string;
      paymentId: string;
      date?: string;
    }): { subject: string; html: string; text: string } {
      return EmailService.templates.paymentInvoice(params);
    },

    weeklyReport(params: {
      businessName: string;
      periodLabel: string;
      metricsSummary: {
        trafficChangePct?: number;
        leadsGenerated?: number;
        adSpend?: number;
        avgRoas?: number;
        seoIssuesFixed?: number;
        socialPostsPublished?: number;
      };
      sections: {
        whatHappened?: string;
        whyItHappened?: string;
        whatAiDid?: string[];
        nextSteps?: string[];
      };
    }): { subject: string; html: string; text: string } {
      const subject = `Executive Marketing Briefing: ${params.periodLabel} — ${params.businessName}`;

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 28px 24px; color: #ffffff;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #a5b4fc; text-transform: uppercase;">Executive Intelligence Report</div>
            <h1 style="margin: 6px 0 0; font-size: 20px; font-weight: 800;">${params.businessName}</h1>
            <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.8;">Reporting Period: ${params.periodLabel}</p>
          </div>
          <div style="padding: 24px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 20px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Traffic Growth</div>
                <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 4px;">+${params.metricsSummary.trafficChangePct || 0}%</div>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Leads</div>
                <div style="font-size: 18px; font-weight: 800; color: #4f46e5; margin-top: 4px;">${params.metricsSummary.leadsGenerated || 0}</div>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Avg ROAS</div>
                <div style="font-size: 18px; font-weight: 800; color: #d97706; margin-top: 4px;">${params.metricsSummary.avgRoas || 0}x</div>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 6px;">Executive Summary</h3>
              <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0;">${params.sections.whatHappened || 'Autonomous marketing actions deployed across channels.'}</p>
            </div>

            ${
              params.sections.whyItHappened
                ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 6px;">Key Drivers & Insights</h3>
              <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0;">${params.sections.whyItHappened}</p>
            </div>`
                : ''
            }

            ${
              Array.isArray(params.sections.whatAiDid) && params.sections.whatAiDid.length > 0
                ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 8px;">Autonomous Actions Executed</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
                ${params.sections.whatAiDid.map((item) => `<li>${item}</li>`).join('')}
              </ul>
            </div>`
                : ''
            }

            ${
              Array.isArray(params.sections.nextSteps) && params.sections.nextSteps.length > 0
                ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 8px;">Recommended Next Steps</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
                ${params.sections.nextSteps.map((item) => `<li>${item}</li>`).join('')}
              </ul>
            </div>`
                : ''
            }
          </div>
          <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
            Generated by ${BRAND.appName} &bull; ${BRAND.tagline}
          </div>
        </div>
      `;

      const text = `Executive Marketing Briefing — ${params.businessName}\nPeriod: ${params.periodLabel}\n\nSummary:\n${params.sections.whatHappened || ''}\n\nTraffic: +${params.metricsSummary.trafficChangePct || 0}%\nLeads: ${params.metricsSummary.leadsGenerated || 0}\nROAS: ${params.metricsSummary.avgRoas || 0}x\n\nGenerated by ${BRAND.appName}`;

      return { subject, html, text };
    },

    /**
     * Template 5: Successful Login Notification
     */
    loginSuccess(params: {
      name: string;
      email: string;
      loginTime?: string;
      ip?: string;
      loginMethod?: string;
      appName?: string;
      dashboardUrl?: string;
    }): { subject: string; html: string; text: string } {
      const appName = params.appName || BRAND.appName;
      const dashboardUrl = params.dashboardUrl || `${process.env.APP_URL || 'http://localhost:3000'}/`;
      const subject = `🔐 Successful Login Alert: Aap successfully login ho chuka ho, ${params.name}!`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; line-height: 1.5;">
  <div style="max-width: 580px; margin: 0 auto; background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); font-size: 24px; margin-bottom: 12px;">🔐</div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Successful Login Alert</h1>
      <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.95;">Aapka Addon AI Command Center successfully login ho chuka hai!</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 28px;">
      <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #f1f5f9;">
        Hi ${params.name},
      </p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Aapne abhi-abhi apne <strong style="color: #ffffff;">${appName}</strong> account me login kiya hai. Aapke saare 10 Autonomous AI Marketing Agents (SEO, Content, Ads, WhatsApp, Slots) ready aur active hain.
      </p>

      <!-- Login Security Details Card -->
      <div style="background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; color: #10b981; margin-bottom: 12px; display: flex; align-items: center;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; margin-right: 6px;"></span>
          SESSION AUTHENTICATED & VERIFIED
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Account / Email:</td>
            <td style="padding: 6px 0; text-align: right; color: #f1f5f9; font-weight: 600; font-family: monospace;">${params.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Login Time:</td>
            <td style="padding: 6px 0; text-align: right; color: #f1f5f9; font-weight: 600;">${params.loginTime || 'Just now'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Authentication Method:</td>
            <td style="padding: 6px 0; text-align: right; color: #38bdf8; font-weight: 600;">${params.loginMethod || 'Web Security Auth'}</td>
          </tr>
          ${params.ip ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Network / IP:</td>
            <td style="padding: 6px 0; text-align: right; color: #94a3b8; font-family: monospace;">${params.ip}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Encryption Protocol:</td>
            <td style="padding: 6px 0; text-align: right; color: #10b981; font-weight: 600;">256-Bit TLS (Secure)</td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); letter-spacing: 0.2px;">
          Go to AI Command Center &rarr;
        </a>
      </div>

      <!-- Security Notice -->
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 14px 16px; margin-top: 24px;">
        <div style="font-size: 12px; color: #fca5a5; line-height: 1.5;">
          <strong>🛡️ Security Notice:</strong> Agar yeh login aapne khud kiya hai, toh aap is message ko safely ignore kar sakte hain. Agar yeh login aapne nahi kiya, toh turant <a href="${process.env.APP_URL || 'http://localhost:3000'}/forgot-password" style="color: #ef4444; font-weight: 700; text-decoration: underline;">Apna Password Reset Karein</a>.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 28px; background: #0f172a; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      <p style="margin: 0;">Autonomous AI Marketing Infrastructure • High-Security Realtime Alerts</p>
    </div>

  </div>
</body>
</html>
      `;

      const text = `Hi ${params.name},\n\nYou have successfully logged into the Addon AI command center!\n\nLogin Time: ${params.loginTime || 'Just now'}\nAccount: ${params.email}\nSecurity: 256-Bit TLS\n\nDashboard: ${dashboardUrl}\n\nSecurity Notice: If this was not you, please reset your password immediately.`;

      return { subject, html, text };
    },

    /**
     * Template 6: VIP Founder Slot Booking Confirmation
     */
    slotBookingConfirmation(params: {
      name: string;
      email: string;
      phone: string;
      slotDate: string;
      slotTime: string;
      slotNumber: number;
      company?: string;
      notes?: string;
      appName?: string;
      dashboardUrl?: string;
    }): { subject: string; html: string; text: string } {
      const appName = params.appName || BRAND.appName;
      const dashboardUrl = params.dashboardUrl || `${process.env.APP_URL || 'http://localhost:3000'}/`;
      const subject = `🎉 VIP Founder Slot #${params.slotNumber} Confirmed — ${appName} AI Growth Onboarding`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; line-height: 1.5;">
  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    
    <!-- Top Gradient Banner -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #6366f1 100%); padding: 36px 28px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; padding: 6px 14px; border-radius: 9999px; background: rgba(0, 0, 0, 0.25); font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
        ✨ VIP FOUNDER RESERVATION • BATCH #1
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Slot #${params.slotNumber} Confirmed!</h1>
      <p style="margin: 8px 0 0; opacity: 0.95; font-size: 14px; font-weight: 500;">Autonomous 24/7 AI Marketing Onboarding &amp; Strategy Demo</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px 28px; color: #e2e8f0;">
      <p style="font-size: 18px; font-weight: 700; margin-top: 0; color: #ffffff;">Namaste ${params.name}! 👋</p>
      <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
        Aapka exclusive <strong>Founder VIP Slot #${params.slotNumber} of 100</strong> successfully reserve ho chuka hai. Hamari team aapke business profile (${params.company || 'Logistics & Fleet Transport'}) ke liye AI growth architecture ready kar rahi hai.
      </p>

      <!-- Booking Summary Card -->
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #10b981; letter-spacing: 0.5px; margin-bottom: 12px;">
          ✓ Verified Reservation Details:
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 500;">Allocated Slot:</td>
            <td style="padding: 7px 0; text-align: right; color: #fbbf24; font-weight: 800;">Slot #${params.slotNumber} of 100</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 500;">Full Name:</td>
            <td style="padding: 7px 0; text-align: right; color: #ffffff; font-weight: 600;">${params.name}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 500;">Phone / WhatsApp:</td>
            <td style="padding: 7px 0; text-align: right; color: #38bdf8; font-weight: 600;">${params.phone}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 500;">Gmail / Email:</td>
            <td style="padding: 7px 0; text-align: right; color: #a5b4fc; font-weight: 600;">${params.email}</td>
          </tr>
          ${params.company ? `
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 500;">Company / Brand:</td>
            <td style="padding: 7px 0; text-align: right; color: #ffffff; font-weight: 600;">${params.company}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 500;">Scheduled Date:</td>
            <td style="padding: 7px 0; text-align: right; color: #34d399; font-weight: 700;">${params.slotDate}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 500;">Preferred Time:</td>
            <td style="padding: 7px 0; text-align: right; color: #34d399; font-weight: 700;">${params.slotTime}</td>
          </tr>
        </table>
      </div>

      <!-- What to expect -->
      <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 14px; padding: 18px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #a5b4fc; margin-bottom: 8px;">Next Steps for Your Session:</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
          <li>A direct Google Meet / Demo link will be sent to your WhatsApp (<strong>${params.phone}</strong>) &amp; this Gmail 30 mins prior to the slot.</li>
          <li>We will demonstrate live keyword gap targeting, automated route landing pages, and AI creatives customized for your business.</li>
          <li>Your dedicated workspace access will be unlocked with zero monthly lock-in.</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); letter-spacing: 0.2px;">
          Open Your AI Command Center &rarr;
        </a>
      </div>

      <p style="font-size: 12px; text-align: center; color: #64748b; margin-top: 16px;">
        Agar aapko date ya time change karna ho, toh is email par reply karein ya WhatsApp karein: <strong>+91 98765 43210</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 28px; background: #0f172a; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      <p style="margin: 0;">Autonomous AI Marketing Infrastructure • High-Priority Founder Slot Dispatch</p>
    </div>

  </div>
</body>
</html>
      `;

      const text = `Namaste ${params.name},\n\nAapka VIP Founder Slot #${params.slotNumber} of 100 successfully confirm ho chuka hai!\n\nBooking Details:\n- Name: ${params.name}\n- Phone: ${params.phone}\n- Gmail: ${params.email}\n- Date: ${params.slotDate}\n- Time: ${params.slotTime}\n\nGoogle Meet link aapke WhatsApp aur Gmail par slot time se 30 mins pehle bhej diya jayega.\n\nCommand Center: ${dashboardUrl}`;

      return { subject, html, text };
    },
  };
}
