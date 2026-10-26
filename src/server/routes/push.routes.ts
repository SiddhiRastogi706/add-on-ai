import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limit';
import {
  broadcastToAll,
  DailyCapError,
  detectDeviceLabel,
  getBroadcastsSentToday,
  isPushConfigured,
  MAX_PROMO_PER_DAY,
  subscribeTokensToAllUsers,
  unsubscribeTokenFromAllUsers,
} from '../services/push.service';

const router = Router();

// Sirf platform SUPER_ADMIN: JWT ke saath DB mein role bhi dobara check hota hai
async function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dbUser = req.user ? await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } }) : null;
    if (req.user?.role !== 'SUPER_ADMIN' || dbUser?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the platform administrator can do this.' });
    }
    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Could not verify admin access.' });
  }
}

const linkSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => /^https?:\/\/\S+$/i.test(value) || /^\/(?!\/)\S*$/.test(value), 'Link must start with https:// or /')
  .optional()
  .or(z.literal('').transform(() => undefined));

const tokenSchema = z.object({
  token: z.string().trim().min(20).max(4096),
  adminAlerts: z.boolean().optional(),
});

const broadcastSchema = z.object({
  title: z.string().trim().min(1).max(65),
  body: z.string().trim().min(1).max(240),
  link: linkSchema,
  mode: z.enum(['tokens', 'topic']).default('tokens'),
});

// POST /api/push/token: logged-in user ka device token save (har device ka alag token)
router.post('/token', authLimiter, authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid notification token.' });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, role: true } });
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const isAdminAlert = Boolean(parsed.data.adminAlerts) && user.role === 'SUPER_ADMIN';
    const deviceLabel = detectDeviceLabel(req.headers['user-agent']);

    // Same browser par dusra user login kare to token naye user ko transfer ho jata hai
    await prisma.pushToken.upsert({
      where: { token: parsed.data.token },
      create: { userId: user.id, token: parsed.data.token, deviceLabel, isAdminAlert },
      update: { userId: user.id, deviceLabel, isAdminAlert },
    });

    if (isPushConfigured()) {
      subscribeTokensToAllUsers([parsed.data.token]).catch(() => undefined);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('[Push] Token save error:', err.message);
    res.status(500).json({ error: 'Could not save notification token.' });
  }
});

// DELETE /api/push/token: user notifications band kare ya logout kare
router.delete('/token', authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = tokenSchema.pick({ token: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid notification token.' });

  await prisma.pushToken.deleteMany({ where: { token: parsed.data.token, userId: req.user!.id } });
  unsubscribeTokenFromAllUsers(parsed.data.token).catch(() => undefined);
  res.json({ success: true });
});

// GET /api/push/admin/overview: devices, users aur aaj ka quota
router.get('/admin/overview', authMiddleware, requireSuperAdmin, async (_req: AuthRequest, res: Response) => {
  const [devices, usersGrouped, adminDevices, usedToday, recent] = await Promise.all([
    prisma.pushToken.count(),
    prisma.pushToken.groupBy({ by: ['userId'] }),
    prisma.pushToken.count({ where: { isAdminAlert: true } }),
    getBroadcastsSentToday(),
    prisma.pushBroadcast.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);

  res.json({
    configured: isPushConfigured(),
    devices,
    users: usersGrouped.length,
    adminDevices,
    usedToday,
    dailyLimit: MAX_PROMO_PER_DAY,
    recent,
  });
});

// POST /api/push/admin/broadcast: sabhi users ko notification (admin only)
router.post('/admin/broadcast', authLimiter, authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  const parsed = broadcastSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid notification content.' });
  }

  try {
    const result = await broadcastToAll(
      { title: parsed.data.title, body: parsed.data.body, link: parsed.data.link },
      parsed.data.mode,
      req.user!.id
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    if (err instanceof DailyCapError) return res.status(429).json({ error: err.message });
    console.error('[Push] Broadcast error:', err.message);
    res.status(500).json({ error: err.message || 'Broadcast failed.' });
  }
});

// POST /api/push/admin/sync-topic: purane tokens ko "all-users" topic mein daalo
router.post('/admin/sync-topic', authLimiter, authMiddleware, requireSuperAdmin, async (_req: AuthRequest, res: Response) => {
  const rows = await prisma.pushToken.findMany({ select: { token: true } });
  const subscribed = await subscribeTokensToAllUsers(rows.map((row) => row.token));
  res.json({ success: true, subscribed, total: rows.length });
});

export default router;
