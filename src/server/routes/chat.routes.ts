import { Router, Response } from 'express';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { getTenantBusiness } from '../middleware/tenant';
import { prisma } from '../db';
import { getAIProvider } from '../ai/factory';

const router = Router();

router.post('/message', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { message, history, businessId } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    let biz: any = null;
    if (req.user) {
      biz = await getTenantBusiness(req, businessId);
    }
    if (!biz) {
      biz = await prisma.business.findFirst({
        orderBy: { createdAt: 'desc' },
      });
    }

    let businessContext = 'Business: Truck Mitra (Online Truck Transport & Logistics India)';

    if (biz) {
      const recentCampaigns = await prisma.adCampaign.findMany({
        where: { businessId: biz.id },
        take: 3,
        orderBy: { createdAt: 'desc' },
      });
      const recentPosts = await prisma.socialPost.findMany({
        where: { businessId: biz.id },
        take: 3,
        orderBy: { createdAt: 'desc' },
      });
      const leadsCount = await prisma.lead.count({
        where: { businessId: biz.id },
      });

      businessContext = `
Business Name: ${biz.name}
Industry: ${biz.industry || 'Logistics & Fleet Transport'}
Website: ${biz.websiteUrl || 'https://truckmitra.com'}
Target Audience: ${biz.targetAudience || 'B2B & Growth Marketers'}
Daily Safety Ad Budget: $${biz.dailyBudgetLimit || 2000}/day
Recent Campaigns: ${recentCampaigns.map((c: any) => `${c.campaignName} (${c.platform}, ${c.status})`).join(', ') || 'None active'}
Recent Posts: ${recentPosts.map((p: any) => `${p.topic} (${p.platform})`).join(', ') || 'None queued'}
Total Inbound Leads: ${leadsCount}
`;
    }

    const systemPrompt = `You are MarketMind Copilot — an agile, elite AI Marketing Copilot for:
${businessContext}

Core Behavioral Guidelines (Behave like ChatGPT):
1. **Direct & Crisp**: Answer strictly and concisely what the user asks ("jitna poocha jaye utna hi batayein"). Do not write unsolicited long essays, generic lectures, or repeating intros.
2. **Instant Actionability**:
   - If asked for hooks, headlines, or ideas: give the exact ready-to-use hooks/headlines directly in bullet points.
   - If asked how-to, SEO, or ad questions: provide 3 to 5 compact, high-impact bullet points or 2 to 4 crisp sentences.
3. **Language Matching**: If the user asks in Hindi or Hinglish (e.g. "ads kaise chalayein", "leads kaise layein", "budget batao"), answer directly in natural, friendly Hinglish with clean bullets!
4. **Clean Markdown**: Use bold highlights and compact bullet lists. Never output filler boilerplate.`;

    // Construct prompt including conversation history
    let fullPrompt = '';
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history
        .slice(-6)
        .map((h: any) => `${h.role === 'user' ? 'User' : 'Copilot'}: ${h.content}`)
        .join('\n');
      fullPrompt = `${recentHistory}\nUser: ${message}\nCopilot:`;
    } else {
      fullPrompt = `User question: ${message}`;
    }

    const ai = getAIProvider();
    console.log(`🤖 Chat Copilot querying AI Provider (${ai.name}) with message: "${message.slice(0, 50)}..."`);
    const reply = await ai.generateText(fullPrompt, systemPrompt, {
      temperature: 0.7,
      maxTokens: 400,
      timeout: 10000,
    });

    res.json({
      success: true,
      reply: reply || 'Here is what I recommend for your campaign growth. Let me know what you would like to tackle next!',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Chat copilot error:', err);
    res.status(500).json({
      error: 'Failed to process chat message',
      details: err.message,
      reply: "I'm having a brief connection delay with the AI service. Please ask your question again or explore the Poster Studio!",
    });
  }
});

export default router;
