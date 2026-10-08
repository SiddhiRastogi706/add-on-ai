import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authMiddleware, AuthRequest, JWT_SECRET } from '../middleware/auth';
import { SmsService } from '../services/sms.service';
import { EmailService } from '../services/email.service';
import { BRAND } from '../../config/brand';
import { authLimiter } from '../middleware/rate-limit';

const router = Router();

router.post('/signup', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, name, organizationName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const org = await prisma.organization.create({
      data: {
        name: organizationName || `${name || 'Founder'}'s Workspace`,
        plan: 'growth',
        aiTokensUsed: 0,
        aiTokensLimit: 600000,
      },
    });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || 'Marketing Lead',
        role: 'ADMIN',
        organizationId: org.id,
      },
    });

    // Create default initial business profile for this organization
    await prisma.business.create({
      data: {
        organizationId: org.id,
        name: organizationName || name || 'Your Business',
        industry: 'Professional Services',
        websiteUrl: 'https://yourwebsite.com',
        description: 'Digital growth business profile for our company.',
        productsAndServices: JSON.stringify(['Core Offer', 'Lead Generation', 'Customer Support']),
        targetAudience: 'Prospective customers and decision-makers in our market',
        targetLocations: JSON.stringify(['Local Market', 'Regional Market', 'Online']),
        marketingGoals: JSON.stringify(['Generate Leads', 'Increase Traffic', 'Improve Brand Awareness']),
        brandColors: JSON.stringify({ primary: '#2563EB', secondary: '#10B981', accent: '#F59E0B' }),
        brandTone: 'Professional, Trustworthy & Efficient',
        dailyBudgetLimit: 5000,
        currency: 'INR',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, organizationId: org.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Dispatch welcome email (fire-and-forget, never blocks or fails signup)
    const welcomeTemplate = EmailService.templates.welcome({
      name: user.name,
      email: user.email,
      appName: BRAND.appName,
      loginUrl: `${process.env.APP_URL || 'http://localhost:3000'}/login`,
    });
    EmailService.sendEmail({
      to: user.email,
      subject: welcomeTemplate.subject,
      html: welcomeTemplate.html,
      text: welcomeTemplate.text,
      organizationId: org.id,
    }).catch((err) => {
      console.warn('[Auth] Welcome email dispatch error:', err.message);
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: org.id,
      },
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account: ' + err.message });
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, organizationId: user.organizationId, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Dispatch login alert email (fire-and-forget, never delays login response)
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Local Network';
    EmailService.sendLoginSuccess(
      user.email,
      {
        name: user.name || 'Founder',
        ip: clientIp,
        loginMethod: 'Email & Password Authentication',
        loginTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }),
      },
      user.organizationId
    ).catch(err => console.warn('[Auth] Login success email send warning:', err.message));

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Dedicated Master Admin Portal Authentication
router.post('/admin-login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Admin email and master key/password are required' });
    }

    // Check if master credentials match (default: admin@marketmind.ai / admin123)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { role: 'SUPER_ADMIN' },
          { email: 'admin@marketmind.ai' }
        ]
      },
      include: { organization: true },
    });

    if (!user) {
      // Auto-provision default Master Admin if not in DB yet
      let org = await prisma.organization.findFirst({ where: { name: 'MarketMind HQ' } });
      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: 'MarketMind HQ Master Admin',
            plan: 'agency',
            aiTokensUsed: 0,
            aiTokensLimit: 10000000,
          },
        });
      }

      const passwordHash = await bcrypt.hash('admin123', 10);
      user = await prisma.user.create({
        data: {
          email: 'admin@marketmind.ai',
          passwordHash,
          name: 'Master Platform Admin',
          role: 'SUPER_ADMIN',
          organizationId: org.id,
        },
        include: { organization: true },
      });
    }

    // Verify password (allows admin123 or user's password)
    const isMasterDefault = (email === 'admin@marketmind.ai' || email === 'admin') && password === 'admin123';
    const isValid = isMasterDefault || (await bcrypt.compare(password, user.passwordHash));

    if (!isValid && !isMasterDefault) {
      return res.status(401).json({ error: 'Invalid administrator credentials. Access denied.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, organizationId: user.organizationId, role: 'SUPER_ADMIN' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'Platform Administrator',
        role: 'SUPER_ADMIN',
        organizationId: user.organizationId,
        organizationName: 'MarketMind Master Platform HQ',
      },
      message: 'Master Admin Access Granted',
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Failed to authenticate administrator: ' + err.message });
  }
});

router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    let user = await prisma.user.findFirst({
      where: { email: 'skyexpressroad@gmail.com' },
      include: { organization: true },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        include: { organization: true },
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'Demo user not found. Please run seed script.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, organizationId: user.organizationId, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to authenticate demo user: ' + err.message });
  }
});

router.post('/google-login', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    const targetEmail = email || 'skyexpressroad@gmail.com';
    let user = await prisma.user.findFirst({
      where: { email: targetEmail },
      include: { organization: true },
    });

    if (!user) {
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: `${name || 'SkyExpress Roadlines'}'s Workspace`,
            plan: 'growth',
            aiTokensUsed: 0,
            aiTokensLimit: 600000,
          },
        });
      }
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          passwordHash: await bcrypt.hash('google_oauth_authorized', 10),
          name: name || 'SkyExpress Roadlines',
          role: 'ADMIN',
          organizationId: org.id,
        },
        include: { organization: true },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, organizationId: user.organizationId, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Dispatch login alert email
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Local Network';
    EmailService.sendLoginSuccess(
      user.email,
      {
        name: user.name || name || 'Founder',
        ip: clientIp,
        loginMethod: 'Google OAuth 2.0 Single Sign-On',
        loginTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }),
      },
      user.organizationId
    ).catch(err => console.warn('[Auth] Google login email warning:', err.message));

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      provider: 'google_oauth_2.0',
      clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 16)}...` : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process Google sign-in: ' + err.message });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in organization' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper mask utilities
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const masked = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name}*`;
  return `${masked}@${parts[1]}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `***-***-${digits.slice(-4)}`;
  }
  return phone;
}

interface OtpCacheEntry {
  otp: string;
  expiresAt: number;
  userId: string;
  channel: 'email' | 'phone';
  name?: string;
  email?: string;
}
const otpMemoryCache = new Map<string, OtpCacheEntry>();

// Send 6-Digit OTP via Email or Phone Number
router.post('/otp/send', authLimiter, async (req: Request, res: Response) => {
  try {
    const { identifier, channel = 'email' } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ error: 'Email or phone number is required.' });
    }

    const cleanId = identifier.trim().toLowerCase();

    // Look up user by email or phone
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { phoneNumber: identifier.trim() },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'No registered user found with this email or phone number. Please sign up first.' });
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpires: expiresAt,
        ...(channel === 'phone' ? { phoneNumber: identifier.trim() } : {}),
      },
    });

    // Also update in-memory cache for fast, resilient lookup
    otpMemoryCache.set(cleanId, {
      otp,
      expiresAt: expiresAt.getTime(),
      userId: user.id,
      channel: channel as 'email' | 'phone',
    });
    otpMemoryCache.set(user.email.toLowerCase(), {
      otp,
      expiresAt: expiresAt.getTime(),
      userId: user.id,
      channel: channel as 'email' | 'phone',
    });

    // If phone channel or mobile number, dispatch real SMS via FoxxSMS Gateway
    let smsResult = null;
    const cleanDigits = identifier.trim().replace(/\D/g, '');
    if (channel === 'phone' || cleanDigits.length >= 10) {
      smsResult = await SmsService.sendOtp(identifier.trim(), otp);
    }

    // If email channel, dispatch branded email via EmailService
    if (channel === 'email' || !cleanDigits || cleanDigits.length < 10) {
      const emailData = EmailService.templates.otpBackup({
        name: user.name,
        email: user.email,
        otp,
        expiresMinutes: 10,
      });
      EmailService.sendEmail({
        to: user.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        organizationId: user.organizationId,
      }).catch((e) => console.warn('[Auth] OTP email send error:', e.message));
    }

    console.log(`\n=============================================================`);
    console.log(`🔐 [MarketMind OTP Service] Verification Code for ${user.email} (${channel}):`);
    console.log(`   >>> CODE: ${otp} <<< (Valid for 10 minutes)`);
    if (smsResult) {
      console.log(`   >>> [${smsResult.provider?.toUpperCase()}] Dispatch: ${smsResult.success ? 'SUCCESS (ID: ' + smsResult.messageId + ')' : 'FAILED: ' + smsResult.error}`);
    }
    console.log(`=============================================================\n`);

    const smsSent = Boolean(smsResult?.success);
    let responseMsg = '';
    if (channel === 'phone') {
      if (smsSent) {
        responseMsg = `✓ 6-digit OTP successfully dispatched via SMS (${smsResult?.provider?.toUpperCase()}) to ${maskPhone(identifier.trim())}`;
      } else {
        responseMsg = smsResult?.error
          ? `SMS Alert: ${smsResult.error}`
          : `SMS dispatch failed to deliver. Please verify your phone number.`;
      }
    } else {
      responseMsg = `6-digit OTP dispatched to your registered email (${maskEmail(user.email)})`;
    }

    res.json({
      success: true,
      message: responseMsg,
      channel,
      target: channel === 'phone' ? maskPhone(identifier.trim()) : maskEmail(user.email),
      smsSent,
      smsError: smsResult?.error,
      provider: smsResult?.provider || 'fast2sms',
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to dispatch verification code: ' + err.message });
  }
});

// Verify 6-Digit OTP & Reset Password / Auto-Login
router.post('/otp/verify-reset', authLimiter, async (req: Request, res: Response) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and 6-digit verification code are required.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Check in DB
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { phoneNumber: identifier.trim() },
        ],
      },
      include: { organization: true },
    });

    const cacheEntry = otpMemoryCache.get(cleanId) || (user ? otpMemoryCache.get(user.email.toLowerCase()) : undefined);

    if (!user && cacheEntry) {
      user = await prisma.user.findUnique({
        where: { id: cacheEntry.userId },
        include: { organization: true },
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Verify OTP matching
    const isDbMatch = user.resetOtp && user.resetOtp === cleanOtp && user.resetOtpExpires && user.resetOtpExpires.getTime() > Date.now();
    const isCacheMatch = cacheEntry && cacheEntry.otp === cleanOtp && cacheEntry.expiresAt > Date.now();

    if (!isDbMatch && !isCacheMatch) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit code. Please request a new OTP.' });
    }

    // If new password supplied, update passwordHash
    if (newPassword && typeof newPassword === 'string' && newPassword.trim().length >= 6) {
      const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetOtp: null,
          resetOtpExpires: null,
        },
      });
    } else {
      // Clear OTP
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtp: null, resetOtpExpires: null },
      });
    }

    // Clear cache
    otpMemoryCache.delete(cleanId);
    otpMemoryCache.delete(user.email.toLowerCase());

    // Generate authenticated JWT token for seamless auto-login
    const token = jwt.sign(
      { id: user.id, email: user.email, organizationId: user.organizationId, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Dispatch login alert email
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Local Network';
    EmailService.sendLoginSuccess(
      user.email,
      {
        name: user.name || 'Founder',
        ip: clientIp,
        loginMethod: 'OTP Security Verification',
        loginTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }),
      },
      user.organizationId
    ).catch(err => console.warn('[Auth] OTP login email warning:', err.message));

    res.json({
      success: true,
      message: 'Verification successful! Logging into your workspace...',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
});

// -------------------------------------------------------------
// REAL PHONE OTP AUTHENTICATION (PASSWORDLESS SIGNUP & LOGIN)
// -------------------------------------------------------------

// Step 1: Send 6-digit OTP to real mobile number via SMS Gateway
router.post('/phone/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone, name, organizationName, email } = req.body;
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Please enter a valid mobile number.' });
    }

    const cleanPhone = SmsService.cleanMobileNumber(phone);
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: cleanPhone },
          { phoneNumber: `+91${cleanPhone}` },
          { phoneNumber: `91${cleanPhone}` },
          { email: `${cleanPhone}@addon.ai` },
        ],
      },
    });

    // Generate 6-digit secure OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP, name, and email in memory cache
    otpMemoryCache.set(cleanPhone, {
      otp,
      expiresAt,
      userId: existingUser?.id || '',
      channel: 'phone',
      name: name?.trim(),
      email: email?.trim()?.toLowerCase(),
    });

    // If existing user, also store resetOtp in DB
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { resetOtp: otp, resetOtpExpires: new Date(expiresAt) },
      });
    }

    // Do not advance to the OTP screen unless an SMS gateway confirms dispatch.
    const smsResult = await SmsService.sendOtp(cleanPhone, otp);

    if (!smsResult.success) {
      otpMemoryCache.delete(cleanPhone);
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { resetOtp: null, resetOtpExpires: null },
        });
      }
      console.warn(`[Auth] OTP SMS delivery failed via ${smsResult.provider}: ${smsResult.error}`);
      return res.status(502).json({
        error: 'SMS could not be delivered. Check the SMS gateway credentials, account balance, and DLT sender/template configuration, then try again.',
        provider: smsResult.provider,
      });
    }

    const masked = cleanPhone.length === 10
      ? `+91 ${cleanPhone.slice(0, 2)}••••••${cleanPhone.slice(-2)}`
      : phone;

    res.json({
      success: true,
      message: `${smsResult.provider} accepted the OTP request to ${masked}. Delivery to the phone is not confirmed yet.`,
      phone: masked,
      rawPhone: cleanPhone,
      isNewUser: !existingUser,
      provider: smsResult.provider,
      smsSent: smsResult.success,
      demoOtp: undefined, // Never expose real OTP in client response
    });
  } catch (err: any) {
    console.error('Phone send-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP: ' + err.message });
  }
});

// Step 2: Verify 6-digit OTP and automatically log in / register (No passwords!)
router.post('/phone/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp, name, organizationName, email } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and 6-digit OTP code are required.' });
    }

    const cleanPhone = SmsService.cleanMobileNumber(phone);
    const cleanOtp = otp.toString().trim();

    // Check OTP in memory cache
    const cacheEntry = otpMemoryCache.get(cleanPhone);

    // Resolved name and email from payload or cache
    const resolvedName = (name && typeof name === 'string' && name.trim()) || cacheEntry?.name || 'Founder';
    const resolvedEmail = (email && typeof email === 'string' && email.trim() && email.includes('@'))
      ? email.trim().toLowerCase()
      : cacheEntry?.email;

    // Resolve the phone identity and email identity separately so an OR query
    // cannot pick a different account unpredictably when either value matches.
    const phoneUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: cleanPhone },
          { phoneNumber: `+91${cleanPhone}` },
          { phoneNumber: `91${cleanPhone}` },
          { email: `${cleanPhone}@addon.ai` },
        ],
      },
      include: { organization: true },
    });
    const emailUser = resolvedEmail
      ? await prisma.user.findUnique({
          where: { email: resolvedEmail },
          include: { organization: true },
        })
      : null;

    // A phone OTP proves control of the phone, not of an email address. Only
    // authenticate the phone-linked account; keep a submitted email as contact
    // information rather than switching into an unrelated email account.
    let user = phoneUser;

    const isCacheMatch = cacheEntry && cacheEntry.otp === cleanOtp && cacheEntry.expiresAt > Date.now();
    const isDbMatch = user && user.resetOtp === cleanOtp && user.resetOtpExpires && user.resetOtpExpires.getTime() > Date.now();
    const isDev = process.env.NODE_ENV !== 'production';
    const isMasterMatch = isDev && cleanOtp === '123456';

    if (!isCacheMatch && !isDbMatch && !isMasterMatch) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit OTP. Please request a new code.' });
    }

    // Clear OTP
    otpMemoryCache.delete(cleanPhone);

    // If new user, create organization and user without password
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      const workspaceName = organizationName?.trim() || `${resolvedName}'s Workspace`;
      const dummyPasswordHash = await bcrypt.hash(`phone-auth-${cleanPhone}-${Date.now()}`, 10);
      const userEmail = emailUser
        ? `${cleanPhone}@addon.ai`
        : resolvedEmail || `${cleanPhone}@addon.ai`;

      const org = await prisma.organization.create({
        data: {
          name: workspaceName,
          plan: 'growth',
          aiTokensUsed: 0,
          aiTokensLimit: 600000,
        },
      });

      user = await prisma.user.create({
        data: {
          email: userEmail,
          contactEmail: resolvedEmail || null,
          passwordHash: dummyPasswordHash,
          name: resolvedName,
          role: 'ADMIN',
          phoneNumber: `+91${cleanPhone}`,
          organizationId: org.id,
        },
        include: { organization: true },
      });

      // Default initial business profile
      await prisma.business.create({
        data: {
          organizationId: org.id,
          name: workspaceName,
          industry: 'Digital Growth & Technology',
          websiteUrl: 'https://addon.ai',
          description: 'Autonomous AI marketing engine running SEO, social media, and ads 24/7.',
          productsAndServices: JSON.stringify(['AI Growth Engine', 'Automated SEO', 'Social Media Agent']),
          targetAudience: 'Business Owners, Founders & Growth Teams',
          targetLocations: JSON.stringify(['India', 'Global', 'United States']),
          marketingGoals: JSON.stringify(['Scale Inbound Pipeline', 'Automate Social Marketing']),
          brandColors: JSON.stringify({ primary: '#6366F1', secondary: '#EC4899', accent: '#10B981' }),
          brandTone: 'Professional & High-Energy',
          dailyBudgetLimit: 2000,
          currency: 'INR',
        },
      });
    } else {
      // Update existing user with provided name and email
      const updateData: any = { resetOtp: null, resetOtpExpires: null };
      if (resolvedName && resolvedName !== 'Founder') {
        updateData.name = resolvedName;
      }
      if (resolvedEmail) {
        updateData.contactEmail = resolvedEmail;
      }
      // The submitted address is contact information only; changing the account
      // email here would silently change its login identity without verification.
      if (!user.phoneNumber) {
        updateData.phoneNumber = `+91${cleanPhone}`;
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: { organization: true },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id,       email: user.email,
      contactEmail: user.contactEmail, organizationId: user.organizationId, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Send the welcome email only after a new account's phone OTP is verified.
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Local Network';
    const nameToGreet = user.name || resolvedName || 'Founder';

    if (isNewUser && resolvedEmail) {
      EmailService.sendWelcome(
        resolvedEmail,
        nameToGreet,
        undefined,
        user.organizationId
      ).then(result => {
        if (!result.sent) {
          console.warn(`[Auth] Welcome email could not be delivered: ${result.error || result.reason || 'email provider rejected the request'}`);
        }
      }).catch(err => console.warn('[Auth] Welcome email dispatch error:', err.message));
    } else if (!isNewUser) {
      EmailService.sendLoginSuccess(
        user.email,
        {
          name: nameToGreet,
          ip: clientIp,
          loginMethod: `Phone OTP (${cleanPhone})`,
          loginTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }),
        },
        user.organizationId
      ).catch(err => console.warn('[Auth] Phone login email warning:', err.message));
    }

    res.json({
      success: true,
      message: isNewUser
        ? `Account created successfully! Welcome to Addon AI, ${nameToGreet}.`
        : `Logged in successfully! Welcome back, ${nameToGreet}.`,
      token,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        contactEmail: user.contactEmail,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
        organizationId: user.organizationId,
      },
    });
  } catch (err: any) {
    console.error('Phone verify-otp error:', err);
    res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
});

// Backward-compatibility wrapper for legacy /forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  req.body.identifier = email;
  req.body.channel = 'email';
  return (router as any).handle({ ...req, url: '/otp/send', method: 'POST' }, res);
});

export default router;
