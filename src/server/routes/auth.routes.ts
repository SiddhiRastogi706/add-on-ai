import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { randomBytes, randomInt, createHash, timingSafeEqual } from 'crypto';
import { prisma } from '../db';
import { authMiddleware, AuthRequest, JWT_SECRET } from '../middleware/auth';
import { SmsService } from '../services/sms.service';
import { EmailService } from '../services/email.service';
import { BRAND } from '../../config/brand';
import { authLimiter } from '../middleware/rate-limit';
import { dispatchLoginPush } from '../services/push.service';

const router = Router();

router.post('/signup', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, username, identifier, password, name, organizationName } = req.body;
    // Signup accepts either an email or a username (or both); a single `identifier` is classified by "@".
    const rawIdentifier = typeof identifier === 'string' ? identifier.trim().toLowerCase() : '';
    let normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    let normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
    if (rawIdentifier) {
      if (rawIdentifier.includes('@')) normalizedEmail = normalizedEmail || rawIdentifier;
      else normalizedUsername = normalizedUsername || rawIdentifier;
    }
    // The email column is required, so username-only accounts get a reserved placeholder address.
    const hasRealEmail = Boolean(normalizedEmail);
    if (!normalizedEmail && normalizedUsername) {
      normalizedEmail = `${normalizedUsername}@users.addonaix.local`;
    }
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanOrganizationName =
      typeof organizationName === 'string' ? organizationName.trim() : '';

    if (!normalizedEmail || typeof password !== 'string') {
      return res.status(400).json({ error: 'Enter an email or username, and a password.' });
    }
    if (hasRealEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (normalizedUsername && !/^[a-z0-9][a-z0-9._-]{2,29}$/.test(normalizedUsername)) {
      return res.status(400).json({
        error: 'Username must be 3–30 characters and use only letters, numbers, dots, underscores, or hyphens.',
      });
    }
    const displayLabel = normalizedUsername || normalizedEmail.split('@')[0];
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
    }
    if (cleanName.length > 100 || cleanOrganizationName.length > 100) {
      return res.status(400).json({ error: 'Name and workspace name must be 100 characters or fewer.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          ...(normalizedUsername ? [{ username: normalizedUsername }] : []),
        ],
      },
    });
    if (existingUser) {
      return res.status(409).json({
        error: existingUser.email === normalizedEmail
          ? hasRealEmail ? 'An account with this email already exists.' : 'That username is already taken.'
          : 'That username is already taken.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const org = await prisma.organization.create({
      data: {
        name: cleanOrganizationName || `${cleanName || displayLabel}'s Workspace`,
        plan: 'free',
      },
    });

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername || null,
        passwordHash,
        name: cleanName || displayLabel,
        role: 'ADMIN',
        organizationId: org.id,
      },
    });

    // Create default initial business profile for this organization
    await prisma.business.create({
      data: {
        organizationId: org.id,
        name: cleanOrganizationName || cleanName || displayLabel,
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
    if (hasRealEmail) {
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
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
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
    const { email, username, identifier, password } = req.body;
    const loginIdentifier = [identifier, email, username].find(
      (value) => typeof value === 'string' && value.trim()
    );
    if (typeof loginIdentifier !== 'string' || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Enter your email or username and password.' });
    }
    const normalizedIdentifier = loginIdentifier.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { username: normalizedIdentifier },
        ],
      },
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
    dispatchLoginPush(user, req.headers['user-agent']);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
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

    // Master credentials .env se aate hain (MASTER_ADMIN_EMAIL / MASTER_ADMIN_PASSWORD).
    // Production mein default admin123 allowed nahi hai.
    const masterEmail = (process.env.MASTER_ADMIN_EMAIL || (process.env.NODE_ENV === 'production' ? '' : 'admin@marketmind.ai')).trim().toLowerCase();
    const masterPassword = process.env.MASTER_ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin123');
    const inputEmail = String(email).trim().toLowerCase();
    const sameStr = (a: string, b: string) => {
      const ha = createHash('sha256').update(a).digest();
      const hb = createHash('sha256').update(b).digest();
      return timingSafeEqual(ha, hb);
    };

    if (!masterEmail || !masterPassword || !sameStr(inputEmail, masterEmail) || !sameStr(String(password), masterPassword)) {
      return res.status(401).json({ error: 'Invalid administrator credentials. Access denied.' });
    }

    // Master admin ko exact email se dhundo, na mile to bana do, aur role SUPER_ADMIN pakka karo
    let user = await prisma.user.findUnique({ where: { email: masterEmail }, include: { organization: true } });

    if (!user) {
      let org = await prisma.organization.findFirst({ where: { name: 'MarketMind HQ Master Admin' } });
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
      user = await prisma.user.create({
        data: {
          email: masterEmail,
          passwordHash: await bcrypt.hash(randomBytes(24).toString('hex'), 10),
          name: 'Master Platform Admin',
          role: 'SUPER_ADMIN',
          organizationId: org.id,
        },
        include: { organization: true },
      });
    } else if (user.role !== 'SUPER_ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN' },
        include: { organization: true },
      });
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

router.get('/google-config', (_req: Request, res: Response) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null });
});

router.post('/google-login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { credential } = req.body as { credential?: string };
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ error: 'Google sign-in is not configured on this server.' });
    }
    if (!credential || typeof credential !== 'string' || credential.length > 10000) {
      return res.status(400).json({ error: 'A valid Google credential is required.' });
    }

    const verification = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: credential },
      timeout: 10000,
    });
    const claims = verification.data as {
      aud?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      sub?: string;
      iss?: string;
    };

    if (
      claims.aud !== clientId ||
      typeof claims.sub !== 'string' ||
      typeof claims.email !== 'string' ||
      (claims.iss !== undefined && !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss)) ||
      !(claims.email_verified === true || claims.email_verified === 'true')
    ) {
      return res.status(401).json({ error: 'Google could not verify this account. Please try again.' });
    }

    const targetEmail = claims.email.trim().toLowerCase();
    const verifiedName = claims.name?.trim() || targetEmail.split('@')[0];
    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { organization: true },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
      try {
        const organization = await prisma.organization.create({
          data: {
            name: `${verifiedName}'s Workspace`,
            plan: 'free',
            users: {
              create: {
                email: targetEmail,
                passwordHash,
                name: verifiedName,
                role: 'ADMIN',
              },
            },
            businesses: {
              create: {
                name: `${verifiedName}'s Business`,
                websiteUrl: 'https://yourwebsite.com',
                industry: 'Professional Services',
                description: 'Digital growth business profile for your company.',
                productsAndServices: JSON.stringify(['Core Offer', 'Lead Generation', 'Customer Support']),
                targetAudience: 'Prospective customers and decision-makers in our market',
                targetLocations: JSON.stringify(['Local Market', 'Regional Market', 'Online']),
                marketingGoals: JSON.stringify(['Generate Leads', 'Increase Traffic', 'Improve Brand Awareness']),
                brandColors: JSON.stringify({ primary: '#2563EB', secondary: '#10B981', accent: '#F59E0B' }),
                brandTone: 'Professional, Trustworthy & Efficient',
                dailyBudgetLimit: 5000,
                currency: 'INR',
              },
            },
          },
          include: { users: true },
        });
        user = { ...organization.users[0], organization };
      } catch (error) {
        const existingUser = await prisma.user.findUnique({
          where: { email: targetEmail },
          include: { organization: true },
        });
        if (!existingUser) throw error;
        user = existingUser;
      }
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
        name: user.name || verifiedName,
        ip: clientIp,
        loginMethod: 'Google OAuth 2.0 Single Sign-On',
        loginTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }),
      },
      user.organizationId
    ).catch(err => console.warn('[Auth] Google login email warning:', err.message));
    dispatchLoginPush(user, req.headers['user-agent']);

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
      provider: 'google',
    });
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response?.status === 400) {
      return res.status(401).json({ error: 'Google could not verify this account. Please try again.' });
    }
    console.error('[Auth] Google sign-in failed:', err.message);
    res.status(502).json({ error: 'Google sign-in could not be verified right now. Please try again.' });
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
    const otp = randomInt(100000, 1000000).toString();
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

    // Send reset codes by email only when the email provider accepts the request.
    if (channel === 'email' || !cleanDigits || cleanDigits.length < 10) {
      const emailData = EmailService.templates.otpBackup({
        name: user.name,
        email: user.email,
        otp,
        expiresMinutes: 10,
      });
      const emailResult = await EmailService.sendEmail({
        to: user.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        organizationId: user.organizationId,
      });
      if (!emailResult.sent) {
        otpMemoryCache.delete(cleanId);
        otpMemoryCache.delete(user.email.toLowerCase());
        await prisma.user.update({
          where: { id: user.id },
          data: { resetOtp: null, resetOtpExpires: null },
        });
        console.error('[Auth] Password reset email was not accepted:', emailResult.error || emailResult.reason);
        return res.status(502).json({
          error: 'Could not send the password reset email. Check the email service configuration and try again.',
        });
      }
    }

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

    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ error: 'Choose a new password between 8 and 128 characters.' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtp: null,
        resetOtpExpires: null,
      },
    });

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
    dispatchLoginPush(user, req.headers['user-agent']);

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
router.post('/phone/send-otp', authLimiter, async (req: Request, res: Response) => {
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

    // In local development, allow a safe mock SMS flow when no gateway is configured.
    const smsResult = await SmsService.sendOtp(cleanPhone, otp);
    const isDevFallback = process.env.NODE_ENV !== 'production' && smsResult.provider === 'dev-console';

    if (!smsResult.success && !isDevFallback) {
      otpMemoryCache.delete(cleanPhone);
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { resetOtp: null, resetOtpExpires: null },
        });
      }
      console.warn(`[Auth] OTP SMS delivery failed via ${smsResult.provider}: ${smsResult.error}`);
      return res.status(502).json({
        error: `SMS provider ${smsResult.provider} could not deliver the OTP${smsResult.error ? `: ${smsResult.error}` : ". Please check that provider's account configuration and try again."}`,
        provider: smsResult.provider,
      });
    }

    const masked = cleanPhone.length === 10
      ? `+91 ${cleanPhone.slice(0, 2)}••••••${cleanPhone.slice(-2)}`
      : phone;

    res.json({
      success: true,
      message: isDevFallback
        ? `Development SMS fallback accepted the OTP request to ${masked}. Use the temporary code visible in the dev console.`
        : `${smsResult.provider} accepted the OTP request to ${masked}. Delivery to the phone is not confirmed yet.`,
      phone: masked,
      rawPhone: cleanPhone,
      isNewUser: !existingUser,
      provider: smsResult.provider,
      smsSent: true,
      providerReference: smsResult.messageId,
      demoOtp: isDevFallback ? otp : undefined,
    });
  } catch (err: any) {
    console.error('Phone send-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP: ' + err.message });
  }
});

// Step 2: Verify 6-digit OTP and automatically log in / register (No passwords!)
router.post('/phone/verify-otp', authLimiter, async (req: Request, res: Response) => {
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

    if (!isCacheMatch && !isDbMatch) {
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
          plan: 'free',
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
    dispatchLoginPush(user, req.headers['user-agent']);

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
