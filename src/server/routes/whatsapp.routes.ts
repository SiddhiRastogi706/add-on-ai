import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getTenantBusiness } from '../middleware/tenant';
import { WhatsAppService } from '../services/whatsapp.service';

const router = Router();

/**
 * POST /api/whatsapp/send
 * Authenticated endpoint to send a WhatsApp session text or approved template message.
 */
router.post('/send', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { to, message, templateName, languageCode, components, businessId } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized: missing organization context' });
    }

    if (businessId) {
      const biz = await getTenantBusiness(req, businessId, res);
      if (!biz) return; // Response already handled by getTenantBusiness
    }

    if (!to) {
      return res.status(400).json({ error: 'Recipient phone number (to) is required' });
    }

    let result;
    if (templateName) {
      result = await WhatsAppService.sendTemplateMessage(
        to,
        templateName,
        languageCode || 'en',
        components,
        organizationId
      );
    } else {
      if (!message) {
        return res.status(400).json({ error: 'Message content is required for text messaging' });
      }
      result = await WhatsAppService.sendTextMessage(to, message, organizationId);
    }

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    console.error('[WhatsAppRoutes] Send error:', err);
    res.status(500).json({ error: err.message || 'Internal server error while sending WhatsApp message' });
  }
});

/**
 * GET /api/whatsapp/webhook
 * Public Meta verification endpoint for Webhook subscription setup.
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token && token === expectedToken) {
    console.log('[WhatsAppWebhook] Verification challenge succeeded');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsAppWebhook] Verification challenge failed: token mismatch');
  return res.status(403).send('Forbidden: Invalid verification token');
});

/**
 * POST /api/whatsapp/webhook
 * Public Meta incoming webhook events (inbound messages, status updates).
 * Verifies X-Hub-Signature-256 against rawBody, matches incoming phone to DB Lead, and logs message.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  // 1. Signature verification if META_APP_SECRET is set
  const appSecret = process.env.META_APP_SECRET;
  if (appSecret) {
    const signature = req.headers['x-hub-signature-256'] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const isValid = WhatsAppService.verifyWebhookSignature(rawBody, signature, appSecret);

    if (!isValid) {
      console.warn('[WhatsAppWebhook] Rejected invalid webhook signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
  }

  // 2. Acknowledge immediately to prevent Meta timeout/retries
  // (Process asynchronously or within request before returning)
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field === 'messages' && change.value) {
            const messages = change.value.messages || [];

            for (const msg of messages) {
              const from = msg.from; // e.g. 919876543210
              const messageText = msg.text?.body || msg.caption || `[${msg.type || 'unknown'} message]`;
              const msgId = msg.id;

              if (!from) continue;

              const cleanPhone = WhatsAppService.cleanPhoneNumber(from);
              const last10 = cleanPhone.slice(-10);

              // Find matching lead in database
              const lead = await prisma.lead.findFirst({
                where: {
                  OR: [
                    { phone: cleanPhone },
                    { phone: `+${cleanPhone}` },
                    { phone: last10 },
                    { phone: { endsWith: last10 } },
                  ],
                },
                include: { business: true },
              });

              if (lead) {
                let notes: any[] = [];
                try {
                  notes = JSON.parse(lead.notesJson || '[]');
                } catch {
                  notes = [];
                }

                notes.push({
                  date: new Date().toISOString(),
                  source: 'WHATSAPP_INBOUND',
                  text: messageText,
                  messageId: msgId,
                });

                await prisma.lead.update({
                  where: { id: lead.id },
                  data: {
                    notesJson: JSON.stringify(notes),
                    status: lead.status === 'NEW' ? 'CONTACTED' : lead.status,
                  },
                });

                await prisma.activityLog.create({
                  data: {
                    businessId: lead.businessId,
                    agentType: 'CRM_AGENT',
                    actionSummary: `Inbound WhatsApp from ${lead.name || cleanPhone}`,
                    details: `Message: "${messageText}". Appended to lead notes.`,
                    status: 'SUCCESS',
                    traceId: `wa-${msgId || Date.now().toString(36)}`,
                  },
                });
              } else {
                console.log(`[WhatsAppWebhook] Inbound message received from unlinked phone: ${cleanPhone}`);
              }
            }
          }
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    console.error('[WhatsAppWebhook] Error processing incoming payload:', err.message);
    // Still return 200 to acknowledge receipt to Meta
    return res.status(200).json({ status: 'error_logged' });
  }
});

export default router;
