import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { MediaService, ALLOWED_IMAGE_TYPES } from '../services/media.service';
import {
  MAX_RETRIES,
  PaymentRequiredError,
  STALE_PENDING_MS,
  chargeForGeneration,
  refundGeneration,
  runGeneration,
} from '../services/poster-photo.service';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const POSTER_ID = '/:id([a-z0-9]{20,})';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
});

// File ke starting bytes se asli type check karo (sirf mimetype par bharosa nahi)
function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

function handleUpload(field: string) {
  const single = upload.single(field);
  return (req: Request, res: Response, next: NextFunction) => {
    single(req, res, (err: any) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Image must be 10 MB or smaller.' });
      return res.status(400).json({ error: 'Could not read the uploaded image.' });
    });
  };
}

function requireImage(req: Request, res: Response, next: NextFunction) {
  const file = req.file;
  if (!file || !ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return res.status(415).json({ error: 'Upload a JPEG, PNG or WebP image.' });
  }
  const real = sniffImageType(file.buffer);
  if (!real) return res.status(415).json({ error: 'The file is not a valid JPEG, PNG or WebP image.' });
  file.mimetype = real;
  next();
}

async function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Admin access required.' });
  const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } });
  if (dbUser?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Admin access required.' });
  next();
}

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  keyGenerator: (req) => (req as AuthRequest).user?.id || 'anon',
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many poster requests. Please wait a minute and try again.' },
});

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

function serializePoster(p: any) {
  return {
    id: p.id,
    itemName: p.itemName,
    description: p.description,
    price: p.price,
    templateId: p.templateId,
    status: p.status,
    resultUrl: p.resultUrl,
    caption: p.caption,
    error: p.error,
    retryCount: p.retryCount,
    retriesLeft: Math.max(0, MAX_RETRIES - p.retryCount),
    notifyUser: p.notifyUser,
    createdAt: p.createdAt,
  };
}

// Server restart ya crash ki wajah se atke PENDING poster ko FAILED karke refund do
async function expireIfStale(poster: any, organizationId: string) {
  if (poster.status !== 'PENDING' || Date.now() - new Date(poster.updatedAt).getTime() < STALE_PENDING_MS) return poster;
  const updated = await prisma.poster.updateMany({
    where: { id: poster.id, status: 'PENDING' },
    data: { status: 'FAILED', error: 'Generation took too long. Please try again.' },
  });
  if (updated.count === 1) await refundGeneration(poster.id);
  return prisma.poster.findUnique({ where: { id: poster.id } });
}

async function findOwnedPoster(req: AuthRequest, res: Response) {
  const poster = await prisma.poster.findUnique({ where: { id: req.params.id } });
  if (!poster || poster.userId !== req.user!.id) {
    res.status(404).json({ error: 'Poster not found.' });
    return null;
  }
  return poster;
}

/* ------------------------------ /api/posters ------------------------------ */
export const photoPosterRouter = Router();

// Purana JSON "one-prompt" /generate route alag hai; sirf multipart request yahan aati hai
photoPosterRouter.post(
  '/generate',
  (req: Request, res: Response, next: NextFunction) => (req.is('multipart/form-data') ? next() : next('router')),
  authMiddleware,
  generateLimiter,
  handleUpload('itemImage'),
  requireImage,
  async (req: AuthRequest, res: Response) => {
    try {
      const itemName = clean(req.body.itemName, 120);
      const templateId = clean(req.body.templateId, 60);
      if (!itemName) return res.status(400).json({ error: 'Item name is required.' });
      if (!templateId) return res.status(400).json({ error: 'Select a template.' });

      const template = await prisma.template.findFirst({ where: { id: templateId, active: true } });
      if (!template) return res.status(404).json({ error: 'Template not found.' });

      const user = req.user!;
      const itemImage = await MediaService.saveImage(req.file!.buffer, req.file!.mimetype, 'poster-photos', user.organizationId);

      const poster = await prisma.poster.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          itemName,
          description: clean(req.body.description, 500) || null,
          price: clean(req.body.price, 40) || null,
          itemImage,
          templateId: template.id,
        },
      });

      try {
        await chargeForGeneration(user, poster.id);
      } catch (err) {
        await prisma.poster.delete({ where: { id: poster.id } }).catch(() => undefined);
        throw err;
      }

      setImmediate(() => void runGeneration(poster.id, 0, user.organizationId));
      return res.status(202).json(serializePoster(poster));
    } catch (err: any) {
      if (err instanceof PaymentRequiredError) return res.status(402).json(err.body);
      console.error('[poster] generate error:', err?.message);
      return res.status(500).json({ error: 'Could not start poster generation. Please try again.' });
    }
  }
);

photoPosterRouter.get(POSTER_ID, authMiddleware, async (req: AuthRequest, res: Response) => {
  let poster = await findOwnedPoster(req, res);
  if (!poster) return;
  poster = await expireIfStale(poster, req.user!.organizationId);
  return res.json(serializePoster(poster));
});

photoPosterRouter.get(`${POSTER_ID}/download`, authMiddleware, async (req: AuthRequest, res: Response) => {
  const poster = await findOwnedPoster(req, res);
  if (!poster) return;
  if (!poster.resultUrl) return res.status(409).json({ error: 'Poster is not ready yet.' });
  try {
    const { buffer, mimeType } = await MediaService.loadImage(poster.resultUrl);
    const safeName = poster.itemName.replace(/[^\w-]+/g, '_').slice(0, 40) || 'poster';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.png"`);
    return res.send(buffer);
  } catch {
    return res.status(502).json({ error: 'Could not download the poster. Please try again.' });
  }
});

photoPosterRouter.post(`${POSTER_ID}/approve`, authMiddleware, async (req: AuthRequest, res: Response) => {
  const poster = await findOwnedPoster(req, res);
  if (!poster) return;
  const result = await prisma.poster.updateMany({
    where: { id: poster.id, status: { in: ['READY', 'APPROVED'] } },
    data: { status: 'APPROVED' },
  });
  if (result.count !== 1) return res.status(409).json({ error: 'Only a ready poster can be approved.' });
  return res.json(serializePoster(await prisma.poster.findUnique({ where: { id: poster.id } })));
});

photoPosterRouter.post(`${POSTER_ID}/reject`, authMiddleware, generateLimiter, async (req: AuthRequest, res: Response) => {
  const poster = await findOwnedPoster(req, res);
  if (!poster) return;
  const user = req.user!;

  if (!['READY', 'FAILED'].includes(poster.status)) {
    return res.status(409).json({ error: 'This poster cannot be rejected right now.' });
  }
  if (poster.retryCount >= MAX_RETRIES) {
    const done = await prisma.poster.update({ where: { id: poster.id }, data: { status: 'REJECTED' } });
    return res.json(serializePoster(done));
  }

  const nextAttempt = poster.retryCount + 1;
  try {
    // Pehle status claim karo taaki double click par dobara charge na ho
    const claimed = await prisma.poster.updateMany({
      where: { id: poster.id, status: poster.status, retryCount: poster.retryCount },
      data: { status: 'PENDING', retryCount: nextAttempt, error: null },
    });
    if (claimed.count !== 1) return res.status(409).json({ error: 'Poster is already being regenerated.' });

    try {
      await chargeForGeneration(user, poster.id);
    } catch (err) {
      await prisma.poster.update({ where: { id: poster.id }, data: { status: poster.status, retryCount: poster.retryCount, error: poster.error } });
      throw err;
    }

    setImmediate(() => void runGeneration(poster.id, nextAttempt, user.organizationId));
    return res.status(202).json(serializePoster(await prisma.poster.findUnique({ where: { id: poster.id } })));
  } catch (err: any) {
    if (err instanceof PaymentRequiredError) return res.status(402).json(err.body);
    console.error('[poster] reject error:', err?.message);
    return res.status(500).json({ error: 'Could not regenerate the poster. Please try again.' });
  }
});

photoPosterRouter.post(`${POSTER_ID}/notify`, authMiddleware, async (req: AuthRequest, res: Response) => {
  const poster = await findOwnedPoster(req, res);
  if (!poster) return;
  await prisma.poster.update({ where: { id: poster.id }, data: { notifyUser: true } });
  return res.json({ success: true });
});

/* ----------------------------- /api/templates ----------------------------- */
export const templatesRouter = Router();
const PAGE_SIZE = 20;

templatesRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const cursor = clean(req.query.cursor, 60);
  const category = clean(req.query.category, 60);

  const rows = await prisma.template.findMany({
    where: { active: true, ...(category && category !== 'All' ? { category } : {}) },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, imageUrl: true, category: true, createdAt: true },
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  res.json({ items, nextCursor: hasMore ? items[items.length - 1].id : null });
});

templatesRouter.get('/categories', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const rows = await prisma.template.groupBy({ by: ['category'], where: { active: true }, orderBy: { category: 'asc' } });
  res.json(rows.map((r) => r.category));
});

templatesRouter.get('/admin/all', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  const cursor = clean(req.query.cursor, 60);
  const rows = await prisma.template.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  res.json({ items, nextCursor: hasMore ? items[items.length - 1].id : null });
});

templatesRouter.post(
  '/admin',
  authMiddleware,
  requireSuperAdmin,
  handleUpload('image'),
  requireImage,
  async (req: AuthRequest, res: Response) => {
    const category = clean(req.body.category, 60) || 'General';
    const imageUrl = await MediaService.saveImage(req.file!.buffer, req.file!.mimetype, 'templates', req.user!.organizationId);
    const template = await prisma.template.create({ data: { imageUrl, category } });
    res.status(201).json(template);
  }
);

templatesRouter.patch('/admin/:id', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  const data: { active?: boolean; category?: string } = {};
  if (typeof req.body.active === 'boolean') data.active = req.body.active;
  if (typeof req.body.category === 'string' && req.body.category.trim()) data.category = clean(req.body.category, 60);
  try {
    res.json(await prisma.template.update({ where: { id: req.params.id }, data }));
  } catch {
    res.status(404).json({ error: 'Template not found.' });
  }
});

templatesRouter.delete('/admin/:id', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Purane posters is template ko refer karte hain, isliye delete ki jagah hide karo
    await prisma.template.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Template not found.' });
  }
});

/* ------------------------------- /api/media ------------------------------- */
export const mediaRouter = Router();

mediaRouter.get('/:id', async (req: Request, res: Response) => {
  const asset = await MediaService.getDbAsset(req.params.id);
  if (!asset || !ALLOWED_IMAGE_TYPES.includes(asset.mimeType)) return res.status(404).end();
  res.setHeader('Content-Type', asset.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.send(Buffer.from(asset.data));
});
