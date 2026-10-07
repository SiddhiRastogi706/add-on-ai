import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { RedisService } from '../services/redis.service';
import { EmailService } from '../services/email.service';
import { prisma } from '../db';

const router = Router();

const SLOTS_FILE = path.resolve(__dirname, '../../data/slots_state.json');
const REDIS_SLOT_KEY = 'marketmind:slots:claimed_count';

interface SlotState {
  totalSlots: number;
  claimedSlots: number;
  price: number;
  originalPrice: number;
  currency: string;
  slotNumber: number;
  recentClaims: Array<{
    name: string;
    city: string;
    claimedAt: string;
  }>;
}

// Ensure data folder exists
const ensureDataDir = () => {
  const dir = path.dirname(SLOTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Default initial state (88 claimed slots out of 100, 12 remaining)
const getDefaultState = (): SlotState => ({
  totalSlots: 100,
  claimedSlots: 88,
  price: 499,
  originalPrice: 14999,
  currency: '₹',
  slotNumber: 1,
  recentClaims: [
    { name: 'Kavita Sharma', city: 'Bengaluru', claimedAt: '3 mins ago' },
    { name: 'Rohan Mehra', city: 'Mumbai', claimedAt: '7 mins ago' },
    { name: 'Aditya Verma', city: 'Delhi NCR', claimedAt: '12 mins ago' },
    { name: 'Sneha Patel', city: 'Ahmedabad', claimedAt: '19 mins ago' },
    { name: 'Vikram Joshi', city: 'Pune', claimedAt: '24 mins ago' },
  ],
});

const loadState = (): SlotState => {
  try {
    ensureDataDir();
    if (fs.existsSync(SLOTS_FILE)) {
      const data = fs.readFileSync(SLOTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading slots state:', err);
  }
  const defaultState = getDefaultState();
  saveState(defaultState);
  return defaultState;
};

const saveState = (state: SlotState) => {
  try {
    ensureDataDir();
    fs.writeFileSync(SLOTS_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving slots state:', err);
  }
};

// Sync Redis and file state on load
const getSynchronizedState = async (): Promise<SlotState> => {
  const state = loadState();
  try {
    const redisVal = await RedisService.get(REDIS_SLOT_KEY);
    if (redisVal !== null) {
      const parsed = parseInt(redisVal, 10);
      if (!isNaN(parsed) && parsed > 0) {
        state.claimedSlots = Math.max(state.claimedSlots, parsed);
      }
    } else {
      await RedisService.set(REDIS_SLOT_KEY, state.claimedSlots.toString());
    }
  } catch (e) {
    // Redis offline fallback to disk state
  }
  return state;
};

// GET /api/slots/status
router.get('/status', async (req: Request, res: Response) => {
  const state = await getSynchronizedState();
  const isSoldOut = state.claimedSlots >= state.totalSlots;
  const remainingSlots = Math.max(0, state.totalSlots - state.claimedSlots);
  const discountPercent = Math.round(((state.originalPrice - state.price) / state.originalPrice) * 100);

  res.json({
    totalSlots: state.totalSlots,
    claimedSlots: Math.min(state.claimedSlots, state.totalSlots),
    remainingSlots,
    isSoldOut,
    price: state.price,
    originalPrice: state.originalPrice,
    currency: state.currency,
    discountPercent,
    slotNumber: state.slotNumber,
    recentClaims: state.recentClaims.slice(0, 5),
    redisPowered: true,
  });
});

// POST /api/slots/claim (Atomic Concurrency via Redis INCR)
router.post('/claim', async (req: Request, res: Response) => {
  const state = await getSynchronizedState();
  const { name = 'New Founder', city = 'India' } = req.body;

  if (state.claimedSlots >= state.totalSlots) {
    return res.status(400).json({
      error: 'Slot #1 is completely full (100/100). All lifetime access spots have been claimed!',
      isSoldOut: true,
      totalSlots: state.totalSlots,
      claimedSlots: state.totalSlots,
      remainingSlots: 0,
    });
  }

  // Atomic increment via Upstash Redis
  let assignedSlot = state.claimedSlots + 1;
  try {
    const atomicCount = await RedisService.incr(REDIS_SLOT_KEY);
    assignedSlot = atomicCount;
  } catch (err) {
    console.warn('Redis INCR failed, using local increment', err);
  }

  if (assignedSlot > state.totalSlots) {
    // Revert count if exceeded
    await RedisService.set(REDIS_SLOT_KEY, state.totalSlots.toString());
    return res.status(400).json({
      error: 'Slot #1 has just filled up! All 100 lifetime access spots are taken.',
      isSoldOut: true,
      totalSlots: state.totalSlots,
      claimedSlots: state.totalSlots,
      remainingSlots: 0,
    });
  }

  state.claimedSlots = assignedSlot;
  state.recentClaims.unshift({
    name,
    city,
    claimedAt: 'Just now',
  });
  if (state.recentClaims.length > 20) {
    state.recentClaims.pop();
  }

  saveState(state);

  const isSoldOut = state.claimedSlots >= state.totalSlots;
  const remainingSlots = Math.max(0, state.totalSlots - state.claimedSlots);

  res.json({
    success: true,
    message: 'Slot successfully reserved! Please complete your registration on the authorization page.',
    slotNumber: state.claimedSlots,
    totalSlots: state.totalSlots,
    remainingSlots,
    isSoldOut,
    price: state.price,
  });
});

// POST /api/slots/book (Book a Founder Slot with Name, Phone, Gmail & Email Notification)
router.post('/book', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, company, slotDate, slotTime, notes } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide your full name.' });
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      return res.status(400).json({ error: 'Please provide a valid phone or WhatsApp number.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid Gmail or email address.' });
    }

    const state = await getSynchronizedState();

    if (state.claimedSlots >= state.totalSlots) {
      return res.status(400).json({
        error: 'Batch #1 (100 Slots) is completely full! All slots have been booked.',
        isSoldOut: true,
      });
    }

    // Atomic increment
    let assignedSlot = state.claimedSlots + 1;
    try {
      const atomicCount = await RedisService.incr(REDIS_SLOT_KEY);
      assignedSlot = atomicCount;
    } catch (err) {
      console.warn('Redis INCR failed, using local increment', err);
    }

    if (assignedSlot > state.totalSlots) {
      await RedisService.set(REDIS_SLOT_KEY, state.totalSlots.toString());
      return res.status(400).json({
        error: 'All 100 Founder slots have just been filled!',
        isSoldOut: true,
      });
    }

    state.claimedSlots = assignedSlot;
    const formattedDate = slotDate || new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });
    const formattedTime = slotTime || '11:30 AM IST';

    state.recentClaims.unshift({
      name: name.trim(),
      city: company ? company.trim() : 'India',
      claimedAt: 'Just now',
    });
    if (state.recentClaims.length > 20) {
      state.recentClaims.pop();
    }
    saveState(state);

    // Save lead to database if business exists
    try {
      const biz = await prisma.business.findFirst({ orderBy: { createdAt: 'asc' } });
      if (biz) {
        await prisma.lead.create({
          data: {
            businessId: biz.id,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            company: company ? company.trim() : 'Founder VIP Booking',
            source: 'Founder VIP Slot Booking',
            status: 'QUALIFIED',
            aiPriority: 'HOT',
            aiSuggestedAction: `VIP Founder Slot #${assignedSlot} booked for ${formattedDate} at ${formattedTime}. Reach out via WhatsApp ${phone.trim()}.`,
            notesJson: JSON.stringify([
              `VIP Slot #${assignedSlot} booked at ${new Date().toISOString()}`,
              `Preferred Slot: ${formattedDate} at ${formattedTime}`,
              notes ? `Notes: ${notes}` : null,
            ].filter(Boolean)),
          },
        });

        // Also log activity
        await prisma.activityLog.create({
          data: {
            businessId: biz.id,
            agentType: 'SLOT_BOOKING_AGENT',
            actionSummary: `VIP Founder Slot #${assignedSlot} Reserved: ${name.trim()}`,
            details: `Phone: ${phone.trim()} | Email: ${email.trim()} | Slot: ${formattedDate} ${formattedTime}`,
            status: 'SUCCESS',
            traceId: `slot-${Date.now()}`,
          },
        });
      }
    } catch (dbErr) {
      console.warn('[Slots DB Warning] Lead recording error:', dbErr);
    }

    // Send confirmation email via EmailService
    let emailSent = false;
    let emailResult: any = null;
    try {
      emailResult = await EmailService.sendSlotBookingConfirmation(email.trim(), {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        slotDate: formattedDate,
        slotTime: formattedTime,
        slotNumber: assignedSlot,
        company: company ? company.trim() : undefined,
        notes: notes ? notes.trim() : undefined,
      });
      emailSent = emailResult.sent;
      console.log(`[Slots Booking] Confirmation email dispatch result for ${email.trim()}:`, emailResult);
    } catch (mailErr: any) {
      console.error('[Slots Booking Error] Email dispatch failed:', mailErr.message);
    }

    const remainingSlots = Math.max(0, state.totalSlots - state.claimedSlots);

    res.json({
      success: true,
      message: `Aapka VIP Founder Slot #${assignedSlot} successfully book ho gaya hai! Confirmation email aapki Gmail (${email.trim()}) par send kar diya gaya hai.`,
      slotNumber: assignedSlot,
      totalSlots: state.totalSlots,
      remainingSlots,
      emailSent,
      emailDetails: emailResult,
      booking: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        company: company ? company.trim() : '',
        slotDate: formattedDate,
        slotTime: formattedTime,
        slotNumber: assignedSlot,
      },
    });
  } catch (err: any) {
    console.error('[Slots Booking Error]:', err);
    res.status(500).json({ error: err.message || 'Internal server error while booking slot' });
  }
});

// POST /api/slots/reset (For test purposes)
router.post('/reset', async (req: Request, res: Response) => {
  const defaultState = getDefaultState();
  saveState(defaultState);
  await RedisService.set(REDIS_SLOT_KEY, defaultState.claimedSlots.toString());
  res.json({ success: true, message: 'Slots reset to initial 88/100 in file and Upstash Redis', state: defaultState });
});

export default router;
