import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { prisma } from '../db';

export const ALL_USERS_TOPIC = 'all-users';
export const MAX_PROMO_PER_DAY = 3;
const FCM_BATCH_SIZE = 500;
const TOPIC_BATCH_SIZE = 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

export interface PushPayload {
  title: string;
  body: string;
  link?: string;
}

let cachedMessaging: Messaging | null | undefined;

// Service account .env se uthao: ya to base64 JSON, ya teen alag variables
function loadServiceAccount(): { projectId: string; clientEmail: string; privateKey: string } | null {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    try {
      const json = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
      return { projectId: json.project_id, clientEmail: json.client_email, privateKey: json.private_key };
    } catch {
      console.warn('[Push] FIREBASE_SERVICE_ACCOUNT_BASE64 valid base64 JSON nahi hai.');
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) return { projectId, clientEmail, privateKey };
  return null;
}

function getFcm(): Messaging | null {
  if (cachedMessaging !== undefined) return cachedMessaging;

  const account = loadServiceAccount();
  if (!account) {
    cachedMessaging = null;
    return null;
  }

  try {
    const app = getApps()[0] || initializeApp({ credential: cert(account) });
    cachedMessaging = getMessaging(app);
  } catch (err: any) {
    console.warn('[Push] Firebase Admin init fail hua:', err.message);
    cachedMessaging = null;
  }
  return cachedMessaging;
}

export function isPushConfigured(): boolean {
  return getFcm() !== null;
}

// Sirf http(s) ya same-site path allow karte hain (javascript: jaise links block)
export function sanitizeLink(link?: string | null): string {
  const fallback = process.env.APP_URL || '/';
  if (!link) return fallback;
  const trimmed = link.trim();
  if (/^\/(?!\/)/.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return fallback;
}

// Data-only message: notification service worker khud dikhata hai, isliye click par hamara link khulta hai
function buildMessage(payload: PushPayload) {
  return {
    data: {
      title: payload.title,
      body: payload.body,
      link: sanitizeLink(payload.link),
    },
    webpush: { headers: { Urgency: 'high', TTL: '86400' } },
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export interface SendReport {
  total: number;
  success: number;
  failure: number;
  removed: number;
}

// 500-500 ke batches mein bhejo; invalid/expired tokens DB se delete
export async function sendToTokens(tokens: string[], payload: PushPayload): Promise<SendReport> {
  const report: SendReport = { total: tokens.length, success: 0, failure: 0, removed: 0 };
  const fcm = getFcm();
  if (!fcm || tokens.length === 0) return report;

  const message = buildMessage(payload);

  for (const batch of chunk(tokens, FCM_BATCH_SIZE)) {
    try {
      const response = await fcm.sendEachForMulticast({ tokens: batch, ...message });
      report.success += response.successCount;
      report.failure += response.failureCount;

      const deadTokens: string[] = [];
      response.responses.forEach((result, index) => {
        if (!result.success && result.error && DEAD_TOKEN_CODES.has(result.error.code)) {
          deadTokens.push(batch[index]);
        }
      });

      if (deadTokens.length > 0) {
        const deleted = await prisma.pushToken.deleteMany({ where: { token: { in: deadTokens } } });
        report.removed += deleted.count;
      }
    } catch (err: any) {
      console.warn('[Push] Batch send fail hua:', err.message);
      report.failure += batch.length;
    }
  }

  return report;
}

export async function sendToUser(userId: string, payload: PushPayload): Promise<SendReport> {
  const rows = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
  return sendToTokens(rows.map((row) => row.token), payload);
}

// User-Agent se simple browser naam nikalo
export function detectBrowser(userAgent = ''): string {
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/OPR\//.test(userAgent)) return 'Opera';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return 'Unknown browser';
}

export function detectDeviceLabel(userAgent = ''): string {
  const os = /Android/.test(userAgent) ? 'Android'
    : /iPhone|iPad|iOS/.test(userAgent) ? 'iOS'
    : /Windows/.test(userAgent) ? 'Windows'
    : /Mac OS/.test(userAgent) ? 'macOS'
    : /Linux/.test(userAgent) ? 'Linux'
    : 'Unknown OS';
  return `${detectBrowser(userAgent)} on ${os}`;
}

interface LoginUser {
  id: string;
  name: string;
  role: string;
}

// Login ke baad admin alert + user welcome; kabhi await mat karo taaki login slow na ho
export function dispatchLoginPush(user: LoginUser, userAgent: string | undefined): void {
  if (!isPushConfigured()) return;

  setImmediate(async () => {
    try {
      const time = new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
      });

      if (user.role !== 'SUPER_ADMIN') {
        const adminTokens = await prisma.pushToken.findMany({
          where: { isAdminAlert: true, user: { role: 'SUPER_ADMIN' } },
          select: { token: true },
        });
        await sendToTokens(adminTokens.map((row) => row.token), {
          title: 'New login',
          body: `🔔 ${user.name} ne abhi login kiya (${detectBrowser(userAgent)}, ${time})`,
        });
      }

      await sendToUser(user.id, {
        title: 'Addon AI',
        body: `✅ Login successful! Welcome back, ${user.name}`,
      });
    } catch (err: any) {
      console.warn('[Push] Login notification fail hua:', err.message);
    }
  });
}

export async function subscribeTokensToAllUsers(tokens: string[]): Promise<number> {
  const fcm = getFcm();
  if (!fcm || tokens.length === 0) return 0;

  let subscribed = 0;
  for (const batch of chunk(tokens, TOPIC_BATCH_SIZE)) {
    try {
      const result = await fcm.subscribeToTopic(batch, ALL_USERS_TOPIC);
      subscribed += result.successCount;
    } catch (err: any) {
      console.warn('[Push] Topic subscribe fail hua:', err.message);
    }
  }
  return subscribed;
}

export async function unsubscribeTokenFromAllUsers(token: string): Promise<void> {
  const fcm = getFcm();
  if (!fcm) return;
  await fcm.unsubscribeFromTopic([token], ALL_USERS_TOPIC).catch(() => undefined);
}

// "Aaj" ka din India time (IST) se gino
function startOfTodayIst(): Date {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  istNow.setUTCHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - IST_OFFSET_MS);
}

export async function getBroadcastsSentToday(): Promise<number> {
  return prisma.pushBroadcast.count({ where: { createdAt: { gte: startOfTodayIst() } } });
}

export class DailyCapError extends Error {
  constructor() {
    super(`Promotional notification limit reached (${MAX_PROMO_PER_DAY} per day). Try again tomorrow.`);
  }
}

export interface BroadcastResult extends SendReport {
  id: string;
  mode: 'tokens' | 'topic';
  topicMessageId?: string;
  usedToday: number;
  dailyLimit: number;
}

export async function broadcastToAll(
  payload: PushPayload,
  mode: 'tokens' | 'topic',
  sentById: string
): Promise<BroadcastResult> {
  const fcm = getFcm();
  if (!fcm) throw new Error('Firebase is not configured on the server.');

  // Pehle record banao phir count karo: parallel requests mein bhi limit tootegi nahi
  const record = await prisma.pushBroadcast.create({
    data: { title: payload.title, body: payload.body, link: payload.link || null, mode, sentById },
  });
  const usedToday = await getBroadcastsSentToday();
  if (usedToday > MAX_PROMO_PER_DAY) {
    await prisma.pushBroadcast.delete({ where: { id: record.id } });
    throw new DailyCapError();
  }

  let report: SendReport;
  let topicMessageId: string | undefined;

  if (mode === 'topic') {
    topicMessageId = await fcm.send({ topic: ALL_USERS_TOPIC, ...buildMessage(payload) });
    // Topic send mein FCM device-wise report nahi deta
    report = { total: 0, success: 0, failure: 0, removed: 0 };
  } else {
    const rows = await prisma.pushToken.findMany({ select: { token: true } });
    report = await sendToTokens(rows.map((row) => row.token), payload);
  }

  await prisma.pushBroadcast.update({
    where: { id: record.id },
    data: {
      totalTokens: report.total,
      successCount: report.success,
      failureCount: report.failure,
      removedTokens: report.removed,
    },
  });

  return { ...report, id: record.id, mode, topicMessageId, usedToday, dailyLimit: MAX_PROMO_PER_DAY };
}
