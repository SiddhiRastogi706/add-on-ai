import { getAIProvider } from '../factory';
import { SocialPost, SocialPlatform } from '../../../shared/types';
import { SafetyService } from '../../services/safety.service';

export type CommentIntent = 'lead' | 'question' | 'pricing' | 'complaint' | 'spam' | 'praise' | 'other';

export interface CommentTriageResult {
  classification: 'Lead' | 'Question' | 'Pricing' | 'Complaint' | 'Spam' | 'Praise' | 'Other';
  intent: CommentIntent;
  language: string;
  confidence: number;
  needs_human: boolean;
  route: 'auto_reply' | 'approval_queue' | 'ignore';
  isSensitive: boolean;
  suggestedResponse: string;
  reply: string;
  reason: string;
}

export interface BusinessContext {
  id?: string;
  name?: string;
  industry?: string;
  websiteUrl?: string;
  productsAndServices?: string[] | string;
  brandTone?: string;
  description?: string;
}

export function getDynamicCommentPrompt(business?: BusinessContext): {
  systemPrompt: string;
  bizName: string;
  cleanDomain: string;
  bizIndustry: string;
  bizTone: string;
} {
  const bizName = business?.name?.trim() || 'our company';
  const bizIndustry = business?.industry?.trim() || 'General Business';
  const bizTone = business?.brandTone?.trim() || 'Professional, Courteous & Helpful';

  let rawUrl = business?.websiteUrl?.trim() || '';
  let cleanDomain = '';
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      cleanDomain = parsed.hostname.replace(/^www\./i, '');
    } catch {
      cleanDomain = rawUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    }
  }

  let productsList = '';
  if (Array.isArray(business?.productsAndServices)) {
    productsList = business.productsAndServices.filter(Boolean).join(', ');
  } else if (typeof business?.productsAndServices === 'string') {
    try {
      const parsed = JSON.parse(business.productsAndServices);
      if (Array.isArray(parsed)) {
        productsList = parsed.join(', ');
      } else {
        productsList = business.productsAndServices;
      }
    } catch {
      productsList = business.productsAndServices;
    }
  }

  const websiteGuidance = cleanDomain
    ? `If referencing a website, ONLY use our official domain: "${cleanDomain}". Do NOT output any other external or foreign URLs.`
    : `Direct the customer to visit our official website or app, or to send a direct message. Do NOT invent fake URLs.`;

  const systemPrompt = `You are the official social media reply assistant for "${bizName}" (${cleanDomain ? 'website: ' + cleanDomain : 'our business'}), operating in the "${bizIndustry}" sector.
${business?.description ? `Business Overview: ${business.description}` : ''}
Key Offerings & Solutions: ${productsList || 'Core business products and solutions'}.
Brand Tone: ${bizTone}.

The user's comment, query, or message can be in Hindi (Devanagari), Hinglish (Roman Hindi), or English.

Classify the intent strictly as one of:
- "lead": The user wants to buy, book, hire, order, inquire about purchasing, sign up, or become a customer/client/partner of "${bizName}".
- "pricing": The user asks for price, cost, rate, charges, package fees, or discount. (CRITICAL RULE: NEVER invent or quote exact prices, rupee amounts, or unauthorized discounts. Inform them that transparent pricing or quotes can be checked on our official website or provided based on their exact requirements).
- "complaint": Any service issue, delay, refund request, payment problem, order issue, fraud allegation, anger, or dissatisfaction.
- "spam": Promotional links, suspicious URLs, crypto schemes, earn-money scams, telegram handles, irrelevant gibberish, or spam bot comments.
- "praise": Compliments, gratitude, appreciation, or positive reviews about "${bizName}".
- "question": General informational questions about how "${bizName}" works, operating hours, features, services, or how to get started.
- "other": Ambiguous, unrelated, or unclear queries. If not sure, classify as "other" with low confidence and set needs_human: true.

Safety & Brand Guardrails:
1. Reply in the EXACT same language and style as the user's comment (e.g. courteous Hinglish for Hinglish; Hindi for Hindi; English for English).
2. Keep the reply under 40 words.
3. NEVER make false guarantees, 100% refund promises, or promise unrealistic delivery times. NEVER invent phone numbers or specific rupee amounts.
4. ${websiteGuidance}
5. If intent is "spam", reply must be empty string "".

Return JSON strictly matching this schema:
{
  "intent": "lead" | "question" | "pricing" | "complaint" | "spam" | "praise" | "other",
  "language": "Hinglish" | "Hindi" | "English" | "Unknown",
  "confidence": 0.0 to 1.0,
  "needs_human": boolean,
  "reply": string,
  "reason": string
}`;

  return { systemPrompt, bizName, cleanDomain, bizIndustry, bizTone };
}

export class SocialAgent {
  static async generateWeeklyCalendar(business: {
    id: string;
    name: string;
    industry: string;
    productsAndServices: string[];
    brandTone: string;
  }): Promise<SocialPost[]> {
    const ai = getAIProvider();

    const prompt = `Generate a 7-day multi-platform social media strategy calendar for:
Business: ${business.name}
Industry: ${business.industry}
Key Services: ${business.productsAndServices.join(', ')}
Tone: ${business.brandTone}

Platforms to cover: linkedin, instagram, facebook, x, youtube.
Provide a 7-day schedule with diverse content types (Educational post, Carousel breakdown, Reel script, Industry insight, Case study highlight, Problem-solution post, Behind-the-scenes).

Return JSON array with this schema:
[
  {
    "platform": "linkedin"|"instagram"|"facebook"|"x"|"youtube",
    "contentType": "post"|"reel_script"|"carousel"|"story"|"poll",
    "topic": "Strategic topic name",
    "caption": "Full, ready-to-publish social caption with emojis and spacing",
    "creativeConcept": "Visual art direction / imagery concept for the designer or creator",
    "hashtags": ["tag1", "tag2", "tag3"],
    "cta": "Clear call to action",
    "dayOffset": 0 to 6
  }
]`;

    let items: any[] = [];
    try {
      items = await ai.generateJson<any[]>(prompt, 'You are a Head of Social Media and Content Syndication.');
    } catch (e) {
      console.warn('Social Agent calendar generation fallback:', e);
    }

    if (!Array.isArray(items) || items.length === 0) {
      items = [
        {
          platform: 'linkedin',
          contentType: 'post',
          topic: 'The Future of Automation in ' + business.industry,
          caption: `Most founders spend 15+ hours weekly on repetitive distribution routines.\n\nHere is how leading organizations in ${business.industry} are leveraging autonomous intelligence to 10x output while cutting overhead in half.\n\n1. Real-time keyword discovery\n2. Programmatic ad optimization\n3. Consistent multi-channel authority\n\nWhat is your biggest bottleneck in scaling marketing right now? Let's discuss in the comments below! 👇`,
          creativeConcept: 'Clean data graphic showing 10x ROI curve vs manual labor hours.',
          hashtags: ['Automation', business.industry.replace(/\s+/g, ''), 'BusinessGrowth', 'Productivity'],
          cta: 'Comment your thoughts or visit our link to audit your growth pipeline.',
          dayOffset: 0,
        },
        {
          platform: 'instagram',
          contentType: 'carousel',
          topic: '5 Costly Marketing Mistakes to Avoid',
          caption: `Stop burning ad spend without clear conversion intent! Swipe through to discover the 5 traps keeping your CAC high 👉\n\nSave this post for your next campaign planning session! 📌`,
          creativeConcept: 'Pastel glassmorphic slide deck with bold typography and high-contrast callouts.',
          hashtags: ['MarketingTips', 'GrowthStrategy', 'SmartBusiness', 'Entrepreneurship'],
          cta: 'Save and share with a founder who needs this.',
          dayOffset: 1,
        },
        {
          platform: 'x',
          contentType: 'post',
          topic: '3 Unconventional Growth Rules',
          caption: `The best marketing does not feel like an interruption.\n\nIt feels like an answered question.\n\nOptimize for search intent and customer velocity, not vanity follower counts. 🧵👇`,
          creativeConcept: 'Minimalist quote graphic with brand typography on soft gradient background.',
          hashtags: ['BuildInPublic', 'GrowthRules', 'MarketingOps'],
          cta: 'Retweet if you agree.',
          dayOffset: 2,
        },
        {
          platform: 'facebook',
          contentType: 'post',
          topic: 'Client Transformation Story',
          caption: `From manual chaos to a predictable lead machine.\n\nDiscover how simple workflow automation helped scale inquiries by 44% in under 30 days without increasing ad budget.\n\nReady to elevate your results? Tap the link below.`,
          creativeConcept: 'Side-by-side before and after metric screenshot on soft backdrop.',
          hashtags: ['SuccessStory', 'DigitalMarketing', 'ResultsDriven'],
          cta: 'Read the full case study on our website.',
          dayOffset: 3,
        },
        {
          platform: 'youtube',
          contentType: 'reel_script',
          topic: '60-Second Growth Breakdown',
          caption: `How to 2x your inbound qualified leads without hiring an expensive agency. #shorts`,
          creativeConcept: 'Dynamic vertical split screen with text hooks and metric highlight overlays.',
          hashtags: ['Shorts', 'MarketingHacks', 'SaaS', 'AI'],
          cta: 'Subscribe for weekly marketing tear-downs.',
          dayOffset: 4,
        },
      ];
    }

    const posts: SocialPost[] = [];
    const now = new Date();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const scheduledDate = new Date(now.getTime() + (item.dayOffset ?? i) * 86400000 + 36000000); // 10:00 AM local time
      const safety = SafetyService.validateContent(item.caption, business.brandTone);

      posts.push({
        id: `post-${Date.now()}-${i}`,
        businessId: business.id,
        platform: (item.platform as SocialPlatform) || 'linkedin',
        contentType: item.contentType || 'post',
        topic: item.topic || 'Industry Insight',
        caption: item.caption,
        creativeConcept: item.creativeConcept || 'Brand visual graphic',
        hashtags: item.hashtags || ['Marketing'],
        cta: item.cta || 'Learn more at our website',
        scheduledTime: scheduledDate.toISOString(),
        status: 'DRAFT',
        isSandboxMode: true,
        engagementStats: {
          likes: 0,
          shares: 0,
          comments: 0,
          clicks: 0,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return posts;
  }

  /**
   * Classify incoming social media comments or customer messages dynamically for ANY business.
   * Utilizes the active business's name, domain, industry, and offerings with multilingual
   * Hinglish/Hindi/English detection, strict safety guardrails, and deterministic routing.
   */
  static async classifyInteraction(
    message: string,
    business?: BusinessContext
  ): Promise<CommentTriageResult> {
    const trimmed = (message || '').trim();
    const { systemPrompt, bizName, cleanDomain } = getDynamicCommentPrompt(business);

    if (!trimmed) {
      return this.applyRoutingAndSafety(
        {
          intent: 'other',
          language: 'Unknown',
          confidence: 0,
          needs_human: true,
          reply: 'Please provide a comment to evaluate.',
          reason: 'Empty message received.',
        },
        '',
        cleanDomain,
        bizName
      );
    }

    const ai = getAIProvider();
    let rawResult: any = null;

    // 1. Attempt LLM classification with dynamic business prompt
    try {
      const prompt = `Classify this customer comment and prepare a safe reply for "${bizName}":\n"${trimmed}"`;
      const aiResponse = await ai.generateJson<any>(prompt, systemPrompt);
      if (aiResponse && aiResponse.intent && typeof aiResponse.intent === 'string') {
        const lowerIntent = aiResponse.intent.toLowerCase();
        if (['lead', 'question', 'pricing', 'complaint', 'spam', 'praise', 'other'].includes(lowerIntent)) {
          rawResult = aiResponse;
        }
      }
    } catch (err) {
      console.warn(`[SocialAgent] LLM classification error for ${bizName}, falling back to heuristic engine:`, err);
    }

    // 2. If LLM unavailable or returned invalid schema, run high-precision heuristic fallback
    if (!rawResult) {
      rawResult = this.heuristicClassifier(trimmed, bizName, cleanDomain);
    }

    // 3. Apply safety checks, blocked words, and deterministic routing
    return this.applyRoutingAndSafety(rawResult, trimmed, cleanDomain, bizName);
  }

  /**
   * High-precision fallback heuristic classifier for Indian logistics / Hinglish / English.
   * Dynamically adapts to the active business context.
   */
  private static heuristicClassifier(
    message: string,
    bizName: string,
    cleanDomain: string
  ): {
    intent: CommentIntent;
    language: string;
    confidence: number;
    needs_human: boolean;
    reply: string;
    reason: string;
  } {
    const raw = message.trim();
    const lower = raw.toLowerCase();
    const isTruckBiz =
      bizName.toLowerCase().includes('truck') ||
      cleanDomain.toLowerCase().includes('truck') ||
      lower.includes('truck') ||
      lower.includes('maal bhejna');

    // 1. Language Detection
    const hasDevanagari = /[\u0900-\u097F]/.test(raw);
    const hinglishMarkers = [
      'chahiye', 'kaise', 'karo', 'mera', 'meri', 'mere', 'hai', 'hain', 'bhejna', 'maal', 'mal',
      'atka', 'atki', 'kitna', 'kitne', 'kahan', 'kaha', 'kripya', 'dhanyawad', 'batao', 'bataiye',
      'kya', 'nahi', 'de raha', 'raha hai', 'paise', 'gaadi', 'gadi', 'bhada', 'bhaada', 'kiraya',
      'mujhe', 'humko', 'karna', 'apna', 'lagta', 'lagega'
    ];
    const isHinglish = !hasDevanagari && hinglishMarkers.some((word) => lower.includes(word));
    const language = hasDevanagari ? 'Hindi' : isHinglish ? 'Hinglish' : 'English';

    // 2. Check Spam
    const spamRegex = /(https?:\/\/|bit\.ly|t\.me|tinyurl|goo\.gl|earn\s+\d+|crypto|telegram|whatsapp\s+(\+?91)?\d|followers|subscribers|casino|betting|win\s+money|fast\s+cash)/i;
    if (spamRegex.test(lower)) {
      return {
        intent: 'spam',
        language,
        confidence: 0.96,
        needs_human: false,
        reply: '',
        reason: 'Detected promotional link or suspicious spam pattern.',
      };
    }

    // 3. Check Gibberish / Unrecognized
    const isGibberish =
      lower.length < 3 ||
      (/^[^aeiouy0-9\s]{4,}$/i.test(lower)) ||
      /^(.)\1{3,}$/.test(lower) ||
      /^(asdf|qwerty|zxcv|1234)/i.test(lower);

    if (isGibberish) {
      return {
        intent: 'other',
        language: 'Unknown',
        confidence: 0.2,
        needs_human: true,
        reply: isHinglish || hasDevanagari
          ? `Namaste! Kripya apna sawal vistaar se batayein taaki ${bizName} team aapki madad kar sake.`
          : `Hello! Please share your requirement with more details so our team at ${bizName} can assist you.`,
        reason: 'Input appears ambiguous or gibberish.',
      };
    }

    // 4. Check Complaint (HIGHEST SENSITIVITY: payments, stuck, fraud, scam, delay)
    const complaintRegex = /(atka|atki|stuck|delay|deri|late|refund|fraud|scam|dhoka|ghotala|chor|cheated|loot|bakwas|kharab|bekar|reply nahi|koi javab nahi|no response|terrible|worst|cheat|lawyer|court|police|fir)/i;
    if (complaintRegex.test(lower)) {
      return {
        intent: 'complaint',
        language,
        confidence: 0.95,
        needs_human: true,
        reply: isHinglish
          ? `Hum asuvidha ke liye kshama chahte hain. ${bizName} senior support desk par aapka mamla escalate kar diya gaya hai. Kripya apna contact details DM karein.`
          : hasDevanagari
          ? `असुविधा के लिए खेद है। ${bizName} की वरिष्ठ सहायता टीम को आपका मामला प्राथमिकता पर भेज दिया गया है। कृपया विवरण साझा करें।`
          : `We sincerely apologize for the inconvenience. Your issue has been escalated to the senior support desk at ${bizName}. Please DM your contact info for urgent assistance.`,
        reason: 'Detected complaint regarding delay, stuck payment, or service dissatisfaction.',
      };
    }

    // 5. Check Pricing (Strict: never quote fixed arbitrary rates!)
    const pricingRegex = /(rate|pricing|price|cost|bhada|bhaada|kiraya|how much|charges|kitna lagega|kitne lagenge|discount|quote|fees|package)/i;
    if (pricingRegex.test(lower)) {
      let pricingReplyHinglish = '';
      let pricingReplyHindi = '';
      let pricingReplyEnglish = '';

      if (isTruckBiz) {
        pricingReplyHinglish = `Namaste! ${bizName} par fixed rate nahi hote. Apna load post karein aur verified truck owners se direct transparent live bids paayein${cleanDomain ? ': ' + cleanDomain : ''}`;
        pricingReplyHindi = `नमस्ते! ${bizName} पर निश्चित दरें नहीं होतीं। अपना लोड पोस्ट करें और सत्यापित ट्रक मालिकों से लाइव बोलियां प्राप्त करें${cleanDomain ? ': ' + cleanDomain : ''}`;
        pricingReplyEnglish = `Hello! We don't quote fixed rates. Post your freight requirements on ${bizName} to receive competitive live bids from verified truck owners${cleanDomain ? ': ' + cleanDomain : ''}`;
      } else {
        pricingReplyHinglish = `Namaste! ${bizName} par transparent pricing aur custom quotes ke liye kripya hamari website visit karein${cleanDomain ? ': ' + cleanDomain : ''} ya apni requirements share karein.`;
        pricingReplyHindi = `नमस्ते! ${bizName} की पारदर्शी दरों और कस्टम कोट्स के लिए कृपया हमारी वेबसाइट देखें${cleanDomain ? ': ' + cleanDomain : ''} या अपनी आवश्यकता साझा करें।`;
        pricingReplyEnglish = `Hello! For transparent pricing options and custom quotes for ${bizName}, please visit our website${cleanDomain ? ': ' + cleanDomain : ''} or share your specific requirements.`;
      }

      return {
        intent: 'pricing',
        language,
        confidence: 0.92,
        needs_human: true,
        reply: isHinglish ? pricingReplyHinglish : hasDevanagari ? pricingReplyHindi : pricingReplyEnglish,
        reason: 'Pricing or service cost inquiry. Fixed rate quotes are prevented.',
      };
    }

    // 6. Check Lead (Wants to book, buy, sign up, post load, order)
    const leadRegex = /(chahiye|kaise book|kaise buy|kaise purchase|kharidna|service chahiye|book karna|need a|want to book|want to buy|hire|order|start with|join as|signup|register|appointment|consultation|quote chahiye|demo chahiye|truck chahiye|gaadi chahiye|gadi chahiye|maal bhejna|mal bhejna|load hai|book truck|lorry chahiye|transport chahiye|load post|post a load)/i;
    if (leadRegex.test(lower)) {
      let leadReplyHinglish = '';
      let leadReplyHindi = '';
      let leadReplyEnglish = '';

      if (isTruckBiz) {
        leadReplyHinglish = `Namaste! Truck book karna behad aasaan hai. ${bizName} par free register karein aur apna load post karke verified truck owners se direct bids paayein${cleanDomain ? ': ' + cleanDomain : ''}`;
        leadReplyHindi = `नमस्ते! ट्रक बुक करना बहुत आसान है। ${bizName} पर निःशुल्क रजिस्टर करें और सत्यापित ट्रक मालिकों से बोलियां प्राप्त करें${cleanDomain ? ': ' + cleanDomain : ''}`;
        leadReplyEnglish = `Hello! Booking a truck is easy on ${bizName}. Register for free, post your freight details, and receive instant bids from verified fleet owners${cleanDomain ? ': ' + cleanDomain : ''}`;
      } else {
        leadReplyHinglish = `Namaste! ${bizName} ke saath judna behad aasaan hai. Hamari services explore karne aur direct register/order karne ke liye website visit karein${cleanDomain ? ': ' + cleanDomain : ''}.`;
        leadReplyHindi = `नमस्ते! ${bizName} के साथ शुरुआत करना बहुत आसान है। हमारी सेवाओं को एक्सप्लोर करने के लिए हमारी वेबसाइट पर जाएं${cleanDomain ? ': ' + cleanDomain : ''}।`;
        leadReplyEnglish = `Hello! Getting started with ${bizName} is simple and fast. Visit our website to explore our services and get started today${cleanDomain ? ': ' + cleanDomain : ''}.`;
      }

      return {
        intent: 'lead',
        language,
        confidence: 0.94,
        needs_human: false,
        reply: isHinglish ? leadReplyHinglish : hasDevanagari ? leadReplyHindi : leadReplyEnglish,
        reason: `High-intent customer inquiry looking to engage or purchase services from ${bizName}.`,
      };
    }

    // 7. Check Question
    const questionRegex = /(kaise|kya|how|where|when|can i|kahan|kyun|why|process|feature|download|app|support|timing|hours)/i;
    if (questionRegex.test(lower) || lower.includes('?')) {
      return {
        intent: 'question',
        language,
        confidence: 0.86,
        needs_human: false,
        reply: isHinglish
          ? `Namaste! ${bizName} aapko behtareen suvidha pradan karne ke liye tatpar hai. Vistaar se jaankari ke liye hamari website visit karein${cleanDomain ? ': ' + cleanDomain : ''}.`
          : hasDevanagari
          ? `नमस्ते! ${bizName} आपको बेहतरीन सेवाएं प्रदान करने के लिए तत्पर है। अधिक जानकारी के लिए हमारी वेबसाइट देखें${cleanDomain ? ': ' + cleanDomain : ''}।`
          : `Hello! ${bizName} is dedicated to delivering top-tier solutions. For comprehensive details and support, visit our official website${cleanDomain ? ': ' + cleanDomain : ''}.`,
        reason: `Informational inquiry regarding ${bizName} services.`,
      };
    }

    // 8. Check Praise
    const praiseRegex = /(good|great|awesome|best|shandar|badiya|badhiya|dhanyawad|thanks|thank you|mast|superb|love)/i;
    if (praiseRegex.test(lower)) {
      return {
        intent: 'praise',
        language,
        confidence: 0.88,
        needs_human: true,
        reply: isHinglish
          ? `Bahut bahut dhanyawad! ${bizName} par vishwas jatane aur support karne ke liye aabhar.`
          : hasDevanagari
          ? `बहुत-बहुत धन्यवाद! ${bizName} का समर्थन करने के लिए आभार।`
          : `Thank you so much for your kind words and support for ${bizName}! We appreciate having you with us.`,
        reason: 'User expressed positive feedback or appreciation.',
      };
    }

    // 9. Default to Other
    return {
      intent: 'other',
      language,
      confidence: 0.45,
      needs_human: true,
      reply: isHinglish
        ? `Namaste! Kripya batayein ki hum ${bizName} ki taraf se aapki kya sahayata kar sakte hain? Website: ${cleanDomain || 'visit us online'}`
        : `Hello! How can we assist you with ${bizName} today? Please share more details or visit ${cleanDomain || 'our website'}.`,
      reason: 'Intent could not be determined with high certainty. Routed to approval queue.',
    };
  }

  /**
   * Deterministic safety and routing engine
   */
  private static applyRoutingAndSafety(
    raw: {
      intent: string;
      language: string;
      confidence: number;
      needs_human: boolean;
      reply: string;
      reason: string;
    },
    originalMessage: string,
    cleanDomain?: string,
    bizName?: string
  ): CommentTriageResult {
    const ALLOWED_AUTO: CommentIntent[] = ['lead', 'question'];
    const BLOCKED_WORDS = /guarantee|guaranteed|refund|100%|discount|₹\s?\d|rs\.?\s?\d|rupees|free money|cashback|call\s+(me|us)\s+at|\+91\d{10}/i;

    const validIntents: CommentIntent[] = ['lead', 'question', 'pricing', 'complaint', 'spam', 'praise', 'other'];
    const intent: CommentIntent = validIntents.includes(raw.intent?.toLowerCase() as any)
      ? (raw.intent.toLowerCase() as CommentIntent)
      : 'other';

    const confidence = typeof raw.confidence === 'number' ? Math.min(Math.max(raw.confidence, 0), 1) : 0.5;
    const language = raw.language || 'Hinglish';
    const reason = raw.reason || `Classified via ${bizName || 'brand'} triage rules.`;
    let reply = (raw.reply || '').trim();

    // Guardrail validation on generated reply
    let isReplySafe = true;
    if (reply.length > 300) {
      isReplySafe = false;
    }
    if (BLOCKED_WORDS.test(reply)) {
      isReplySafe = false;
    }

    // URL guardrail: only allow the business's own domain if a URL is present
    const urlMatches = reply.match(/https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*/gi);
    if (urlMatches) {
      for (const url of urlMatches) {
        const lowerUrl = url.toLowerCase();
        if (cleanDomain && lowerUrl.includes(cleanDomain.toLowerCase())) {
          continue;
        }
        // If domain doesn't match the configured business domain, mark reply unsafe
        isReplySafe = false;
      }
    }

    // Routing determination
    let route: 'auto_reply' | 'approval_queue' | 'ignore' = 'approval_queue';
    let isSensitive = true;

    if (intent === 'spam') {
      route = 'ignore';
      isSensitive = false;
      reply = '';
    } else if (
      ALLOWED_AUTO.includes(intent) &&
      confidence >= 0.8 &&
      !raw.needs_human &&
      isReplySafe &&
      reply.length > 0
    ) {
      route = 'auto_reply';
      isSensitive = false;
    } else {
      route = 'approval_queue';
      isSensitive = true;
    }

    const classificationMap: Record<CommentIntent, 'Lead' | 'Question' | 'Pricing' | 'Complaint' | 'Spam' | 'Praise' | 'Other'> = {
      lead: 'Lead',
      question: 'Question',
      pricing: 'Pricing',
      complaint: 'Complaint',
      spam: 'Spam',
      praise: 'Praise',
      other: 'Other',
    };

    return {
      classification: classificationMap[intent] || 'Other',
      intent,
      language,
      confidence: Math.round(confidence * 100) / 100,
      needs_human: raw.needs_human || isSensitive,
      route,
      isSensitive,
      suggestedResponse: reply,
      reply,
      reason,
    };
  }
}
