import { prisma } from '../db';
import { getAIProvider } from '../ai/factory';
import { MediaService } from './media.service';
import { BillingUser, beginCharge, prismaBillingStore, refundCharge } from './feature-billing.service';
import { sendToUser } from './push.service';

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const GENERATION_TIMEOUT_MS = 60_000;
export const MAX_RETRIES = 3;
export const STALE_PENDING_MS = 4 * 60 * 1000;

// Price ab src/config/pricing.ts (poster_photo) se aata hai. Demo / bonus / plan credit / wallet sab billing service handle karti hai
export class PaymentRequiredError extends Error {
  constructor(public body: { error: string; code: string; needPaise: number; message: string }) {
    super(body.message);
    this.name = 'PaymentRequiredError';
  }
}

export async function chargeForGeneration(user: BillingUser, posterId: string) {
  const result = await beginCharge(prismaBillingStore, user, 'poster_photo');
  if (result.ok === false) throw new PaymentRequiredError(result.body);
  await prisma.poster.update({ where: { id: posterId }, data: { chargeId: result.chargeId } });
}

// Charge ledger idempotent hai, to double refund nahi hota
export async function refundGeneration(posterId: string) {
  const poster = await prisma.poster.findUnique({ where: { id: posterId }, select: { chargeId: true } });
  if (!poster?.chargeId) return;
  try {
    await refundCharge(prismaBillingStore, poster.chargeId);
    await prisma.poster.update({ where: { id: posterId }, data: { chargeId: null } });
  } catch (err: any) {
    console.error('[poster] refund failed:', err?.message);
  }
}

function buildPrompt(input: { itemName: string; description?: string | null; price?: string | null; phone: string; business: string }) {
  return `Image 1 is the user's real photo of their product/place. Image 2 is a reference poster template. Create a NEW square 1:1 marketing poster that copies the layout, composition, color palette, typography style and decorative elements of Image 2, but uses the real photo from Image 1 as the main visual. Do not alter what the photo actually shows. Replace all text with: Title: ${input.itemName}; Description: ${input.description || 'none'}; Price: ${input.price || 'none'}; Contact: ${input.phone || 'none'}; Business: ${input.business}. Write 3-4 short benefit bullet points relevant to the item. All text must be spelled correctly, sharp and readable. Do not copy any logo or brand name from the template; use my business name/logo instead. If a field above says none, leave that element out of the poster.`;
}

async function callGeminiImage(prompt: string, photo: { buffer: Buffer; mimeType: string }, template: { buffer: Buffer; mimeType: string }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: photo.mimeType, data: photo.buffer.toString('base64') } },
                { inlineData: { mimeType: template.mimeType, data: template.buffer.toString('base64') } },
              ],
            },
          ],
          generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
        }),
      }
    );

    const body: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.error?.message || `Gemini image API error (${response.status})`);
    }

    const parts: any[] = body?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p?.inlineData?.data || p?.inline_data?.data);
    const inline = imagePart?.inlineData || imagePart?.inline_data;
    if (!inline?.data) {
      throw new Error(body?.promptFeedback?.blockReason ? 'The photo was blocked by the safety filter' : 'AI did not return an image');
    }
    return { buffer: Buffer.from(inline.data, 'base64'), mimeType: inline.mimeType || inline.mime_type || 'image/png' };
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('Generation timed out after 60 seconds');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function generateCaption(input: { itemName: string; description?: string | null; price?: string | null; business: string }) {
  const fallback = [
    `✨ ${input.itemName}${input.price ? ` — ${input.price}` : ''}`,
    input.description || '',
    `Visit ${input.business} today!`,
    '#offer #newarrival #shoplocal',
  ].filter(Boolean).join('\n\n');

  try {
    const text = await getAIProvider().generateText(
      `Write a short, engaging social media caption (max 60 words) with 5 relevant hashtags for this poster.\nItem: ${input.itemName}\nDescription: ${input.description || 'n/a'}\nPrice: ${input.price || 'n/a'}\nBusiness: ${input.business}\nReturn only the caption text.`,
      'You are a social media copywriter for small businesses. Keep it friendly and concise.',
      { temperature: 0.8, maxTokens: 300, timeout: 15000 }
    );
    const cleaned = String(text || '').trim();
    return cleaned.length > 10 ? cleaned.slice(0, 1200) : fallback;
  } catch (err: any) {
    console.warn('[poster] caption fallback:', err?.message);
    return fallback;
  }
}

async function notifyIfRequested(posterId: string, ok: boolean) {
  const poster = await prisma.poster.findUnique({ where: { id: posterId } });
  if (!poster?.notifyUser) return;
  try {
    await sendToUser(poster.userId, {
      title: ok ? '🎨 Your poster is ready!' : '⚠️ Poster generation failed',
      body: ok ? `${poster.itemName} — tap to review and approve.` : 'Please try again. Your wallet charge was refunded.',
      link: '/',
    });
  } catch (err: any) {
    console.warn('[poster] push notify failed:', err?.message);
  }
}

// Background mein chalta hai; request ko block nahi karta
export async function runGeneration(posterId: string, attempt: number, organizationId: string) {
  try {
    const poster = await prisma.poster.findUnique({ where: { id: posterId }, include: { template: true } });
    if (!poster) return;

    const [user, business] = await Promise.all([
      prisma.user.findUnique({ where: { id: poster.userId }, select: { phoneNumber: true, name: true } }),
      prisma.business.findFirst({ where: { organizationId }, orderBy: { createdAt: 'asc' }, select: { name: true } }),
    ]);
    const businessName = business?.name || user?.name || 'Addonaix';
    const prompt = buildPrompt({
      itemName: poster.itemName,
      description: poster.description,
      price: poster.price,
      phone: user?.phoneNumber || '',
      business: businessName,
    });

    const [photo, template] = await Promise.all([
      MediaService.loadImage(poster.itemImage),
      MediaService.loadImage(poster.template.imageUrl),
    ]);

    let result: { buffer: Buffer; mimeType: string } | null = null;
    let lastError: any;
    for (let tryNo = 0; tryNo < 2 && !result; tryNo++) {
      try {
        result = await callGeminiImage(prompt, photo, template);
      } catch (err: any) {
        lastError = err;
        console.warn(`[poster] ${posterId} generation attempt ${tryNo + 1} failed:`, err?.message);
      }
    }
    if (!result) throw lastError || new Error('Generation failed');

    const [resultUrl, caption] = await Promise.all([
      MediaService.saveImage(result.buffer, result.mimeType, 'posters', organizationId),
      generateCaption({ itemName: poster.itemName, description: poster.description, price: poster.price, business: businessName }),
    ]);

    await prisma.poster.update({
      where: { id: posterId },
      data: { status: 'READY', resultUrl, caption, error: null },
    });
    await notifyIfRequested(posterId, true);
  } catch (err: any) {
    console.error(`[poster] ${posterId} failed:`, err?.message);
    await prisma.poster
      .update({
        where: { id: posterId },
        data: { status: 'FAILED', error: String(err?.message || 'Generation failed').slice(0, 300) },
      })
      .catch(() => undefined);
    await refundGeneration(posterId);
    await notifyIfRequested(posterId, false);
  }
}
