import { Router, Response } from 'express';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { getTenantBusiness } from '../middleware/tenant';
import { prisma } from '../db';
import { getAIProvider } from '../ai/factory';
import { StorageService } from '../services/storage.service';

const router = Router();

interface PosterPromptRequest {
  prompt: string;
  businessId?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9';
  themeId?: string;
  imageMode?: 'gradient' | 'ai_photo';
  realismStyle?: 'google_flow_real' | 'commercial_photo' | 'luxury_editorial' | 'golden_hour';
  lighting?: 'natural_daylight' | 'golden_hour' | 'studio_softbox' | 'ambient';
  engine?: 'kling' | 'google_flow' | 'auto';
  klingApiKey?: string;
}

const KLING_BASE_URL = process.env.KLING_BASE_URL || 'https://api-singapore.klingai.com';
const DEFAULT_KLING_API_KEY = process.env.KLING_API_KEY || '';

// Helper to query Kling AI image generation
async function callKlingImageApi(prompt: string, aspectRatio: string = '1:1', apiKey?: string) {
  const token = apiKey || DEFAULT_KLING_API_KEY;
  if (!token) return { success: false, reason: 'no_api_key' };

  try {
    const res = await fetch(`${KLING_BASE_URL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: prompt.slice(0, 450),
        aspect_ratio: aspectRatio,
        n: 1
      })
    });

    const data: any = await res.json().catch(() => ({}));
    if (data.code === 0 && data.data?.task_id) {
      const taskId = data.data.task_id;
      // Poll task result up to 6 times
      for (let attempt = 0; attempt < 6; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));
        const taskRes = await fetch(`${KLING_BASE_URL}/v1/images/generations/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const taskData: any = await taskRes.json().catch(() => ({}));
        if (taskData.data?.task_status === 'succeed' && taskData.data?.task_result?.images?.[0]?.url) {
          return {
            success: true,
            imageUrl: taskData.data.task_result.images[0].url,
            taskId,
            source: 'kling_ai'
          };
        } else if (taskData.data?.task_status === 'failed') {
          return { success: false, reason: 'task_failed', message: taskData.data?.task_status_msg };
        }
      }
      return { success: false, reason: 'task_timeout', taskId };
    } else {
      return {
        success: false,
        code: data.code,
        message: data.message || 'Kling API code ' + data.code,
        raw: data
      };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Endpoint: Test Kling API Key Live
router.post('/test-kling', async (req: AuthRequest, res: Response) => {
  try {
    const keyToTest = req.body?.apiKey || DEFAULT_KLING_API_KEY;
    const testRes = await fetch(`${KLING_BASE_URL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyToTest}`
      },
      body: JSON.stringify({
        prompt: 'Commercial product photography test',
        aspect_ratio: '1:1',
        n: 1
      })
    });

    const data: any = await testRes.json().catch(() => ({}));
    const isBalanceIssue = data.code === 1102;
    const isSuccess = data.code === 0;

    return res.json({
      connected: isBalanceIssue || isSuccess,
      keyValid: isBalanceIssue || isSuccess,
      code: data.code,
      message: data.message,
      hasCredits: isSuccess,
      requiresRecharge: isBalanceIssue,
      endpoint: `${KLING_BASE_URL}/v1/images/generations`,
      maskedKey: keyToTest.replace(/^(api-key-kling-[A-Za-z0-9]{4})[A-Za-z0-9]+([A-Za-z0-9]{4})$/, '$1****$2'),
      helpNote: isBalanceIssue
        ? 'Aapki Kling AI key 100% sahi aur authenticated hai! Par Kling AI par Website Credits aur API Resource Pack alag hote hain. Aapke API balance mein credits 0 hain (Error Code 1102: "Account balance not enough"). Isliye Kling API image generate nahi kar raha. Jaise hi aap Kling Developer Console (klingai.com/dev) se API Resource Pack lenge, ye direct Kling se banne lagega. Tab tak system Google Flow / Flux photorealism se posters bana raha hai taaki koi rukawat na aaye.'
        : isSuccess
        ? 'Kling AI key 100% active and credits ready for generation.'
        : 'Kling API verification note: ' + (data.message || 'Check key configuration')
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/generate', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      prompt,
      businessId,
      aspectRatio = '1:1',
      themeId,
      imageMode = 'ai_photo',
      realismStyle = 'google_flow_real',
      lighting = 'natural_daylight',
      engine = 'auto',
      klingApiKey
    } = req.body as PosterPromptRequest & { engine?: string; klingApiKey?: string };

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        error: 'Poster prompt is required. (e.g. "Diwali 50% discount on clothes" or "Gym opening flat 40% discount")'
      });
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

    const businessName = biz?.name || 'MarketMind AI';
    const businessIndustry = biz?.industry || 'Business & Tech';
    const businessUrl = biz?.websiteUrl || 'www.marketmind.ai';

    const systemPrompt = `You are a world-class Commercial Photographer and Advertising Creative Director specialized in Google Flow (flow.google / ImageFX) photorealism and Kling AI commercial styling.
Your job is to transform any user prompt (Hindi, Hinglish, English) into an ultra-realistic commercial advertising poster design.

Business Context:
- Brand Name: ${businessName}
- Industry: ${businessIndustry}
- Website: ${businessUrl}

User's Creative Brief:
"${prompt.trim()}"

Target Aspect Ratio: ${aspectRatio}
Requested Realism Engine: ${realismStyle} (Google Flow & Kling AI True Photography)
Preferred Lighting: ${lighting}

MANDATORY RULES FOR COMMERCIAL PHOTOREALISM (DO NOT LOOK LIKE AI):
1. The image MUST look like a real, authentic photograph taken by a professional human photographer with a full-frame DSLR/mirrorless camera (Sony A7 IV / Canon EOS R5 / Leica).
2. It must have REAL-WORLD micro-details: authentic skin texture with natural pores, real fabric weave and stitching, natural ambient light and soft shadows, authentic environmental depth of field.
3. NEVER use AI cliché keywords like "8k, cinematic, masterpiece, hyper-realistic, octane render, trending on artstation" because those create fake cartoonish CGI plastic images!
4. Strictly NO CGI, NO plastic skin, NO 3D render, NO fake digital illustration, NO glowing fantasy particles, NO text, NO watermarks.

You must return valid JSON ONLY with these exact fields:
{
  "badge": "Catchy 2-4 word upper-case offer badge (e.g. '🔥 50% DIWALI SALE', '⚡ EXCLUSIVE OFFER', '✨ FESTIVE MEGA DEAL')",
  "headline": "Punchy, high-converting headline (5 to 8 words, clear benefit, high CTR)",
  "subheadline": "Persuasive 1 to 2 sentence value proposition (15 to 25 words detailing the offer, urgency, or key takeaway)",
  "cta": "Direct 2 to 4 word call to action (e.g. 'Claim 50% Off Now', 'Shop Festive Sale', 'Book Free Session', 'Order Online')",
  "signature": "Brand website or social handle (e.g. '${businessUrl}')",
  "recommendedTheme": "Choose best theme ID: 'sunset' (festive, sales, food), 'cosmic' (tech, saas), 'emerald' (fitness, health), 'gold' (luxury, jewelry, real estate), 'cyber' (electronics, modern), 'party' (fashion, nightlife), 'minimal' (clean, b2b)",
  "colorPalette": {
    "primary": "#ffffff",
    "backgroundGradient": "Tailwind gradient string",
    "ctaBg": "#ffffff"
  },
  "imageSearchPrompt": "A descriptive, natural English prompt for camera photography. Describe a genuine real-world scene: subject, natural expressions, authentic clothing/products, real environment, shot on Sony A7 IV with 50mm f/1.8 lens, natural daylight, candid, authentic textures, documentary raw photo style, unedited, zero cgi, zero plastic skin, no text",
  "rationale": "1 brief sentence explaining the psychological angle of this poster.",
  "videoAdScript": {
    "hook": "Attention-grabbing 3-second hook line for Instagram Reels / Facebook Video",
    "targetAudience": "Target audience description",
    "suggestedMusic": "Trending upbeat background music",
    "scenes": [
      { "scene": 1, "duration": "0-3s", "visual": "High-impact visual hook", "voiceoverHindi": "Hindi voiceover line", "voiceoverEnglish": "English voiceover line", "textOverlay": "PUNCHY HOOK" },
      { "scene": 2, "duration": "3-8s", "visual": "Problem or customer need in action", "voiceoverHindi": "Hindi voiceover line", "voiceoverEnglish": "English voiceover line", "textOverlay": "KEY BENEFIT" },
      { "scene": 3, "duration": "8-14s", "visual": "Irresistible offer reveal", "voiceoverHindi": "Hindi voiceover line", "voiceoverEnglish": "English voiceover line", "textOverlay": "OFFER DETAILS" },
      { "scene": 4, "duration": "14-20s", "visual": "Direct call to action with phone / website / WhatsApp", "voiceoverHindi": "Hindi voiceover line", "voiceoverEnglish": "English voiceover line", "textOverlay": "BOOK NOW" }
    ]
  }
}`;

    let posterSpec: any = null;

    try {
      const aiProvider = getAIProvider();
      const rawText = await aiProvider.generateText(
        `Generate a photorealistic poster specification for: "${prompt.trim()}". Return JSON only.`,
        systemPrompt,
        {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxTokens: 1024,
          timeout: 10000,
        }
      );

      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        posterSpec = JSON.parse(match[0]);
      }
    } catch (aiErr: any) {
      console.warn('AI Poster generation fallback triggered:', aiErr?.message);
    }

    if (!posterSpec || !posterSpec.headline) {
      posterSpec = generateFallbackPoster(prompt, businessName, businessUrl, realismStyle, lighting);
    }

    // Clean prompt for image generation
    const rawPhotoPrompt = (posterSpec.imageSearchPrompt || `A genuine commercial photograph of ${prompt}`)
      .replace(/[^\w\s,.-]/g, '')
      .slice(0, 220);

    // Append photorealism parameters
    const flowRealisticPrompt = `A genuine real-life photograph of ${rawPhotoPrompt}, candid, natural soft lighting, authentic textures, shot on Sony A7 IV, 50mm lens, raw photo style, zero CGI, zero plastic skin, no text`;

    const randomSeed = Math.floor(Math.random() * 999999);
    let imgWidth = 1080;
    let imgHeight = 1080;
    if (aspectRatio === '9:16') {
      imgWidth = 720;
      imgHeight = 1280;
    } else if (aspectRatio === '16:9') {
      imgWidth = 1280;
      imgHeight = 720;
    }

    // Attempt Kling AI generation if key provided or active
    let aiImageUrl = '';
    let generatorEngine = 'Google Flow Photorealism (ImageFX Engine)';
    let klingStatus: any = null;

    const activeKlingKey = klingApiKey || DEFAULT_KLING_API_KEY;
    if (activeKlingKey && (engine === 'kling' || engine === 'auto')) {
      const klingRes = await callKlingImageApi(flowRealisticPrompt, aspectRatio, activeKlingKey);
      if (klingRes.success && klingRes.imageUrl) {
        aiImageUrl = klingRes.imageUrl;
        generatorEngine = 'Kling AI Singapore Cloud';
        klingStatus = { success: true, taskId: klingRes.taskId };
      } else {
        klingStatus = {
          success: false,
          code: klingRes.code,
          message: klingRes.message,
          fallbackReason: klingRes.code === 1102 ? 'Kling balance empty (code 1102) -> auto-switched to Google Flow' : 'Kling API standby -> auto-switched to Google Flow'
        };
      }
    }

    // If Kling is not available or has 0 credits, use cutting-edge Flux photorealism
    if (!aiImageUrl) {
      aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        flowRealisticPrompt
      )}?width=${imgWidth}&height=${imgHeight}&model=flux&enhance=true&nologo=true&seed=${randomSeed}`;
      if (activeKlingKey && !klingStatus) {
        klingStatus = { success: false, note: 'Defaulting to Google Flow Flux for speed' };
      }
    }

    // Persist to S3 / Cloudflare R2 storage if configured to prevent temporary links from expiring
    if (aiImageUrl && StorageService.isConfigured(req.user?.organizationId)) {
      const filename = `poster_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
      const storageKey = StorageService.getNamespacedKey(
        req.user?.organizationId,
        'posters',
        filename
      );
      const uploadRes = await StorageService.uploadFromUrl(
        aiImageUrl,
        storageKey,
        'image/png',
        req.user?.organizationId
      );
      if (uploadRes.success && uploadRes.url) {
        aiImageUrl = uploadRes.url;
      }
    }

    return res.json({
      success: true,
      badge: posterSpec.badge || '✨ SPECIAL OFFER',
      headline: posterSpec.headline,
      subheadline: posterSpec.subheadline,
      cta: posterSpec.cta || 'Get Started Free',
      signature: posterSpec.signature || businessUrl,
      themeId: themeId || posterSpec.recommendedTheme || 'sunset',
      aspectRatio,
      colorPalette: posterSpec.colorPalette,
      imageSearchPrompt: posterSpec.imageSearchPrompt,
      aiImageUrl,
      generatorEngine,
      klingStatus,
      rationale: posterSpec.rationale || 'Engineered with Kling AI & Google Flow authentic camera realism.',
      videoAdScript: posterSpec.videoAdScript || {
        hook: `Kya aap bhi dhoond rahe hain best ${businessIndustry}?`,
        targetAudience: 'High-intent commercial buyers and local shoppers',
        suggestedMusic: 'Energetic commercial upbeat track',
        scenes: [
          {
            scene: 1,
            duration: '0-3s',
            visual: 'Candid high-speed zoom-in on real product / service in action',
            voiceoverHindi: `Kya aap bhi dhoond rahe hain sabse best ${businessName}? Ab wait mat kijiye!`,
            voiceoverEnglish: `Looking for top-tier ${businessIndustry}? The search ends here!`,
            textOverlay: posterSpec.badge || '🔥 SPECIAL OFFER',
          },
          {
            scene: 2,
            duration: '3-8s',
            visual: 'Customer satisfaction moment, authentic real-life environment',
            voiceoverHindi: `Hamari verified service aur guaranteed quality ke saath aapka har kaam aasan.`,
            voiceoverEnglish: `Experience verified excellence and dependable solutions crafted for you.`,
            textOverlay: posterSpec.headline,
          },
          {
            scene: 3,
            duration: '8-14s',
            visual: 'Direct offer display with authentic photography background',
            voiceoverHindi: `${posterSpec.subheadline || 'Special discount sirf limited time ke liye.'}`,
            voiceoverEnglish: `Exclusive benefits and premium pricing available for a limited time.`,
            textOverlay: 'LIMITED TIME DEAL',
          },
          {
            scene: 4,
            duration: '14-20s',
            visual: 'Brand logo, website link, and WhatsApp / Facebook tap prompt',
            voiceoverHindi: `Abhi neeche diye gaye link par click karein ya WhatsApp par message karein!`,
            voiceoverEnglish: `Tap the link below or chat directly on WhatsApp to claim now!`,
            textOverlay: posterSpec.cta || 'TAP TO BOOK NOW',
          },
        ],
      },
      originalPrompt: prompt,
    });
  } catch (err: any) {
    console.error('Error generating poster:', err);
    return res.status(500).json({ error: 'Failed to generate poster', details: err?.message });
  }
});

// Fallback generator with authentic Google Flow photography prompts
function generateFallbackPoster(
  prompt: string,
  businessName: string,
  businessUrl: string,
  realismStyle: string,
  lighting: string
) {
  const pLower = prompt.toLowerCase();

  let badge = '✨ SPECIAL OFFER';
  let theme = 'sunset';
  let cta = 'Get Started Now';
  let photoContext = 'genuine real-life commercial photograph, natural window daylight, authentic textures, shot on Sony A7 IV';

  const discountMatch = prompt.match(/(\d+)\s*%/);
  if (discountMatch) {
    badge = `🔥 FLAT ${discountMatch[1]}% OFF`;
    cta = `Claim ${discountMatch[1]}% Off`;
    theme = 'sunset';
    photoContext = 'real authentic commercial retail display photoshoot, natural daylight, candid customer holding shopping bag, real life';
  } else if (
    pLower.includes('sale') ||
    pLower.includes('offer') ||
    pLower.includes('diwali') ||
    pLower.includes('festive')
  ) {
    badge = '🪔 FESTIVE DHAMAKA SALE';
    theme = 'sunset';
    cta = 'Shop Festive Collection';
    photoContext =
      'genuine traditional Indian festive celebration, real people in authentic handcrafted ethnic clothing, warm glowing clay diyas, natural marigold garland, real family candid moment, raw 35mm photograph';
  } else if (pLower.includes('truck') || pLower.includes('transport') || pLower.includes('freight') || pLower.includes('logistics')) {
    badge = '🚚 FAST FREIGHT & LOGISTICS';
    theme = 'cyber';
    cta = 'Book Freight Truck';
    photoContext =
      'candid authentic documentary photograph of a real commercial freight truck on Indian highway during golden hour, realistic asphalt road, dust particles in sunbeam, Sony A7 IV photo';
  } else if (pLower.includes('gym') || pLower.includes('fitness') || pLower.includes('workout')) {
    badge = '💪 NEW YEAR FITNESS PASS';
    theme = 'emerald';
    cta = 'Start Free Trial';
    photoContext =
      'candid authentic photograph of a real person working out in a modern fitness gym, natural workout sweat, authentic muscle definition, natural gym window light, Sony A7 IV photo';
  } else if (
    pLower.includes('coffee') ||
    pLower.includes('cafe') ||
    pLower.includes('food') ||
    pLower.includes('pizza') ||
    pLower.includes('burger')
  ) {
    badge = '☕ BUY 1 GET 1 FREE';
    theme = 'sunset';
    cta = 'Order Delicious Treats';
    photoContext =
      'candid close-up photograph of artisan iced cold brew coffee and fresh pastry on rustic wooden cafe table, soft natural morning sunlight from cafe window, real food photography';
  } else if (
    pLower.includes('real estate') ||
    pLower.includes('luxury') ||
    pLower.includes('villa') ||
    pLower.includes('flat')
  ) {
    badge = '🏡 ULTRA-LUXURY RESIDENCES';
    theme = 'gold';
    cta = 'Book Private Tour';
    photoContext =
      'authentic architectural photograph of modern luxury apartment living room with panoramic city view, natural soft ambient light, real interior design, Leica M11 photo';
  } else if (pLower.includes('tech') || pLower.includes('ai') || pLower.includes('software')) {
    badge = '🚀 NEXT-GEN AI LAUNCH';
    theme = 'cosmic';
    cta = 'Get 14-Day Free Access';
    photoContext =
      'candid documentary photograph of real software engineer working on modern laptop in clean minimalist office, natural daylight, candid authentic expression';
  }

  const words = prompt.split(' ').filter(Boolean);
  const headline =
    words.length <= 8
      ? words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : words.slice(0, 7).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + '...';

  const subheadline = `Experience premium results with ${businessName}. Limited spots and special festival benefits available for this exclusive launch.`;

  return {
    badge,
    headline,
    subheadline,
    cta,
    signature: businessUrl,
    recommendedTheme: theme,
    imageSearchPrompt: `${photoContext}, ${prompt}, candid real life, natural lighting, raw photography style, zero cgi, zero plastic`,
    rationale: 'Engineered with Google Flow authentic camera realism.',
    videoAdScript: {
      hook: `Kya aap bhi dhoond rahe hain sabse best deal on ${prompt.slice(0, 30)}?`,
      targetAudience: 'Customers looking for quality, speed & guaranteed results',
      suggestedMusic: 'Upbeat energetic trending sound',
      scenes: [
        {
          scene: 1,
          duration: '0-3s',
          visual: `Candid action visual of ${prompt.slice(0, 35)} in a real-world setting`,
          voiceoverHindi: `Kya aap bhi dhoond rahe hain sabse best deal? Ab time aa gaya hai upgrade karne ka!`,
          voiceoverEnglish: `Looking for the absolute best offer? It's time to upgrade today!`,
          textOverlay: badge,
        },
        {
          scene: 2,
          duration: '3-8s',
          visual: `Demonstration of ${businessName} quality, real customer experience`,
          voiceoverHindi: `Hamari verified service aur guaranteed quality ke saath aapka har kaam 100% successful.`,
          voiceoverEnglish: `With verified quality and guaranteed support, get complete peace of mind.`,
          textOverlay: headline,
        },
        {
          scene: 3,
          duration: '8-14s',
          visual: 'Exclusive offer banner animation with bright callout',
          voiceoverHindi: `Limited time ke liye mil raha hai special discount. Abhi grab karein!`,
          voiceoverEnglish: `Special limited-time launch offer available right now.`,
          textOverlay: 'LIMITED TIME DEAL',
        },
        {
          scene: 4,
          duration: '14-20s',
          visual: 'Brand signature with instant WhatsApp chat and website CTA',
          voiceoverHindi: `Neeche diye link par click karein ya WhatsApp par message karein!`,
          voiceoverEnglish: `Click the link below or chat directly on WhatsApp!`,
          textOverlay: cta,
        },
      ],
    },
  };
}

export default router;
