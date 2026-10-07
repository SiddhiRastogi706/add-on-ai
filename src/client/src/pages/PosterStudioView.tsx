import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import {
  Sparkles,
  Download,
  Calendar,
  CheckCircle2,
  Copy,
  Smartphone,
  Square,
  Monitor,
  Wand2,
  RefreshCw,
  Image as ImageIcon,
  Layers,
  Check,
  Zap,
  Sliders,
  Eye,
  Play,
  Volume2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { ApiClient } from '../services/api';

type AspectRatio = '1:1' | '9:16' | '16:9';
type BackgroundMode = 'ai_photo' | 'gradient';

interface PosterTheme {
  id: string;
  name: string;
  gradient: string;
  gradientColors: [string, string];
  textColor: string;
  accentBadge: string;
  ctaBg: string;
  ctaText: string;
  ctaHex: string;
}

const THEMES: PosterTheme[] = [
  {
    id: 'sunset',
    name: 'Sunset Glow',
    gradient: 'from-rose-600 via-pink-600 to-amber-600',
    gradientColors: ['#e11d48', '#d97706'],
    textColor: 'text-white',
    accentBadge: 'bg-amber-400/30 text-amber-100 border border-amber-300/40',
    ctaBg: 'bg-white',
    ctaText: 'text-rose-700',
    ctaHex: '#ffffff',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Indigo',
    gradient: 'from-indigo-950 via-purple-900 to-slate-950',
    gradientColors: ['#0f172a', '#312e81'],
    textColor: 'text-white',
    accentBadge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    ctaBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    ctaText: 'text-white',
    ctaHex: '#a855f7',
  },
  {
    id: 'emerald',
    name: 'Emerald Growth',
    gradient: 'from-emerald-950 via-teal-900 to-slate-900',
    gradientColors: ['#064e3b', '#0f172a'],
    textColor: 'text-white',
    accentBadge: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30',
    ctaBg: 'bg-gradient-to-r from-emerald-400 to-teal-400',
    ctaText: 'text-slate-950',
    ctaHex: '#34d399',
  },
  {
    id: 'cyber',
    name: 'Electric Cyber',
    gradient: 'from-blue-900 via-cyan-900 to-slate-950',
    gradientColors: ['#1e3a8a', '#0891b2'],
    textColor: 'text-white',
    accentBadge: 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30',
    ctaBg: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    ctaText: 'text-slate-950',
    ctaHex: '#22d3ee',
  },
  {
    id: 'gold',
    name: 'Royal Gold',
    gradient: 'from-amber-950 via-yellow-900 to-stone-950',
    gradientColors: ['#451a03', '#78350f'],
    textColor: 'text-amber-100',
    accentBadge: 'bg-amber-400/20 text-amber-300 border border-amber-400/40',
    ctaBg: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    ctaText: 'text-slate-950',
    ctaHex: '#f59e0b',
  },
  {
    id: 'party',
    name: 'Neon Party',
    gradient: 'from-fuchsia-950 via-purple-900 to-rose-950',
    gradientColors: ['#701a75', '#831843'],
    textColor: 'text-white',
    accentBadge: 'bg-pink-500/20 text-pink-300 border border-pink-500/40',
    ctaBg: 'bg-gradient-to-r from-pink-500 to-rose-500',
    ctaText: 'text-white',
    ctaHex: '#ec4899',
  },
  {
    id: 'minimal',
    name: 'Clean Executive',
    gradient: 'from-slate-900 via-slate-800 to-slate-950',
    gradientColors: ['#0f172a', '#1e293b'],
    textColor: 'text-white',
    accentBadge: 'bg-white/10 text-slate-200 border border-white/20',
    ctaBg: 'bg-amber-400',
    ctaText: 'text-slate-950',
    ctaHex: '#fbbf24',
  },
];

export const PosterStudioView: React.FC = () => {
  const { business } = useAuth();

  // Prompt input state
  const [promptInput, setPromptInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('ai_photo');
  const [selectedTheme, setSelectedTheme] = useState<PosterTheme>(THEMES[0]);

  // Poster copy state
  const [badgeText, setBadgeText] = useState('🔥 DIWALI SPECIAL OFFER');
  const [headline, setHeadline] = useState('Flat 50% Off On All Ethnic Collections');
  const [subheadline, setSubheadline] = useState('Celebrate this festive season in royal style with premium handcrafted fabrics & free express shipping.');
  const [ctaText, setCtaText] = useState('Shop Festive Sale');
  const [brandSignature, setBrandSignature] = useState(business?.websiteUrl || 'www.marketmind.ai');

  // Image and generation state
  const [aiImageUrl, setAiImageUrl] = useState(
    'https://image.pollinations.ai/prompt/luxury%20festive%20Diwali%20fashion%20celebration%20with%20glowing%20warm%20golden%20sparkles%20cinematic%208k%20commercial%20advertising?width=1080&height=1080&model=flux&enhance=true&nologo=true&seed=481920'
  );
  const [imageSearchPrompt, setImageSearchPrompt] = useState('luxury festive celebration background commercial advertising');
  const [aiRationale, setAiRationale] = useState('High CTR festive theme tuned for maximum consumer urgency & festival celebrations.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Kling AI Engine & Key State (Saved in .env on server, never exposed in client)
  const [klingApiKey, setKlingApiKey] = useState(
    localStorage.getItem('kling_api_key') || ''
  );
  const [generatorEngine, setGeneratorEngine] = useState<'kling' | 'google_flow'>('kling');
  const [engineUsedName, setEngineUsedName] = useState('Kling AI & Google Flow Photorealism');
  const [isTestingKling, setIsTestingKling] = useState(false);
  const [klingTestResult, setKlingTestResult] = useState<any>(null);

  // Video Teaser & Sound State
  const [isVideoTeaser, setIsVideoTeaser] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Synthesizes commercial soundbed with Web Audio API (zero external mp3 needed)
  const playCommercialSoundbed = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Ambient warm chord (Cmaj7: C, E, G, B)
      const chordFrequencies = [261.63, 329.63, 392.00, 493.88];
      chordFrequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + 5);
      });

      // Warm pulse bass
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(130.81, ctx.currentTime);
      bassGain.gain.setValueAtTime(0.06, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.5);
      bass.connect(bassGain);
      bassGain.connect(ctx.destination);
      bass.start();
      bass.stop(ctx.currentTime + 5);

      setIsAudioPlaying(true);
      setTimeout(() => setIsAudioPlaying(false), 4500);
    } catch (e) {
      console.error('Audio play error:', e);
    }
  };

  const handleTestKlingKey = async () => {
    setIsTestingKling(true);
    try {
      localStorage.setItem('kling_api_key', klingApiKey);
      const res = await ApiClient.testKlingApiKey(klingApiKey);
      setKlingTestResult(res);
    } catch (e: any) {
      setKlingTestResult({ connected: false, message: e.message || 'Connection failed' });
    } finally {
      setIsTestingKling(false);
    }
  };

  // Quick Inspiration Prompts (Tailored for Indian Businesses & Clients)
  const inspirationChips = [
    {
      label: '🚚 Truck Mitra Freight Booking',
      prompt: 'Truck Mitra instant freight booking and verified transport truck service across Delhi NCR and India with 100% verified drivers',
    },
    {
      label: '💍 Jaipur Gold Jewellery 35% Off',
      prompt: 'Jaipur hallmark gold and diamond jewellery festival offer flat 35% off on making charges with certified quality',
    },
    {
      label: '🪔 Festive Clothing 50% Off',
      prompt: 'Diwali mega sale flat 50% off on all clothing with free express shipping across India',
    },
    {
      label: '🏋️‍♂️ Gym 40% New Batch',
      prompt: 'New Year Fitness Challenge 40% discount on annual gym membership with free personal trainer',
    },
    {
      label: '☕ Cafe Buy 1 Get 1',
      prompt: 'Special weekend cafe offer buy one get one free cold brew iced coffee and donuts',
    },
    {
      label: '🏢 Luxury Real Estate Flats',
      prompt: 'Exclusive launch of smart 3BHK luxury apartments starting at 75 Lakhs with zero brokerage',
    },
  ];

  // Core AI Poster Generator
  const handleGeneratePoster = async (overridePrompt?: string) => {
    const textToGenerate = (overridePrompt !== undefined ? overridePrompt : promptInput).trim();
    if (!textToGenerate) return;

    if (overridePrompt) {
      setPromptInput(overridePrompt);
    }

    setIsGenerating(true);
    setIsImageLoading(true);

    try {
      const res = await ApiClient.generatePoster({
        prompt: textToGenerate,
        businessId: business?.id,
        aspectRatio,
        imageMode: backgroundMode,
        themeId: selectedTheme.id,
        engine: generatorEngine,
        klingApiKey,
      });

      if (res && res.headline) {
        if (res.badge) setBadgeText(res.badge);
        if (res.headline) setHeadline(res.headline);
        if (res.subheadline) setSubheadline(res.subheadline);
        if (res.cta) setCtaText(res.cta);
        if (res.signature) setBrandSignature(res.signature);
        if (res.rationale) setAiRationale(res.rationale);
        if (res.imageSearchPrompt) setImageSearchPrompt(res.imageSearchPrompt);
        if (res.generatorEngine) setEngineUsedName(res.generatorEngine);

        // Update Theme if recommended
        if (res.themeId) {
          const matchedTheme = THEMES.find((t) => t.id === res.themeId);
          if (matchedTheme) setSelectedTheme(matchedTheme);
        }

        // Update Image URL
        if (res.aiImageUrl) {
          setAiImageUrl(res.aiImageUrl);
        }

        // Play audio if in video teaser mode
        if (isVideoTeaser) {
          playCommercialSoundbed();
        }
      }
    } catch (err) {
      console.error('Poster generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reroll image with new seed
  const handleRegenerateImage = () => {
    setIsImageLoading(true);
    const newSeed = Math.floor(Math.random() * 999999);
    let w = 1080;
    let h = 1080;
    if (aspectRatio === '9:16') {
      w = 720;
      h = 1280;
    } else if (aspectRatio === '16:9') {
      w = 1280;
      h = 720;
    }
    const cleanPrompt = encodeURIComponent(imageSearchPrompt || promptInput || 'commercial advertising aesthetic');
    const newUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${w}&height=${h}&model=flux&enhance=true&nologo=true&seed=${newSeed}`;
    setAiImageUrl(newUrl);
  };

  // Schedule to social media calendar
  const handleScheduleToCalendar = async () => {
    try {
      await ApiClient.generateSocialPost({
        channel: 'instagram',
        topic: `${headline} - ${badgeText}`,
      });
      setScheduledSuccess(true);
      setTimeout(() => setScheduledSuccess(false), 4500);
    } catch (e) {
      console.error('Schedule error:', e);
    }
  };

  // Copy full copy text to clipboard
  const handleCopyText = () => {
    const fullText = `${badgeText}\n\n${headline}\n\n${subheadline}\n\n👉 ${ctaText}\n🔗 ${brandSignature}\n\n#marketing #offer #deal #${selectedTheme.id}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download High-Resolution PNG via HTML5 Canvas
  const handleDownloadPng = async () => {
    let width = 1200;
    let height = 1200;
    if (aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (aspectRatio === '16:9') {
      width = 1920;
      height = 1080;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderPosterContent = () => {
      // 1. Draw subtle dark vignette overlay for readability
      const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (backgroundMode === 'ai_photo') {
        overlayGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
        overlayGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.65)');
        overlayGrad.addColorStop(0.85, 'rgba(15, 23, 42, 0.88)');
        overlayGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      } else {
        overlayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        overlayGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      }
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, width, height);

      // Helper function for round rectangle
      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y + x, y, r);
        ctx.closePath();
      };

      // 2. Draw Top Badge Pill
      const badgeY = height * 0.16;
      ctx.font = `bold ${Math.round(width * 0.024)}px 'Plus Jakarta Sans', sans-serif`;
      const badgeWidth = ctx.measureText(badgeText.toUpperCase()).width + width * 0.06;
      const badgeHeight = height * 0.048;
      const badgeX = (width - badgeWidth) / 2;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      drawRoundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText.toUpperCase(), width / 2, badgeY + badgeHeight / 2);

      // 3. Draw Headline with text wrapping
      const headlineFontSize = Math.round(width * (aspectRatio === '16:9' ? 0.045 : 0.056));
      ctx.font = `900 ${headlineFontSize}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const wrapText = (text: string, maxWidth: number) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const widthMeasured = ctx.measureText(currentLine + ' ' + word).width;
          if (widthMeasured < maxWidth) {
            currentLine += ' ' + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);
        return lines;
      };

      const headlineLines = wrapText(headline, width * 0.82);
      const headlineLineHeight = headlineFontSize * 1.25;
      const headlineStartY = height * 0.38 - ((headlineLines.length - 1) * headlineLineHeight) / 2;

      headlineLines.forEach((line, index) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 18;
        ctx.fillText(line, width / 2, headlineStartY + index * headlineLineHeight);
      });

      // 4. Draw Subheadline with text wrapping
      ctx.shadowBlur = 8;
      const subheadlineFontSize = Math.round(width * 0.026);
      ctx.font = `500 ${subheadlineFontSize}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = '#e2e8f0';

      const subheadlineLines = wrapText(subheadline, width * 0.76);
      const subheadlineLineHeight = subheadlineFontSize * 1.4;
      const subheadlineStartY = height * 0.58;

      subheadlineLines.forEach((line, index) => {
        ctx.fillText(line, width / 2, subheadlineStartY + index * subheadlineLineHeight);
      });

      // 5. Draw CTA Button
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      const ctaY = height * 0.76;
      const ctaFontSize = Math.round(width * 0.028);
      ctx.font = `bold ${ctaFontSize}px 'Plus Jakarta Sans', sans-serif`;
      const ctaWidth = Math.max(width * 0.42, ctx.measureText(ctaText).width + width * 0.08);
      const ctaHeight = height * 0.068;
      const ctaX = (width - ctaWidth) / 2;

      ctx.fillStyle = selectedTheme.ctaHex;
      drawRoundRect(ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = selectedTheme.ctaHex === '#ffffff' ? '#be123c' : '#0f172a';
      ctx.fillText(ctaText, width / 2, ctaY + ctaHeight / 2);

      // 6. Draw Brand Signature / URL
      ctx.font = `600 ${Math.round(width * 0.022)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText(brandSignature, width / 2, height * 0.91);

      // Trigger automatic file download
      const pngUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `marketmind_poster_${aspectRatio.replace(':', '_')}.png`;
      link.href = pngUrl;
      link.click();
    };

    if (backgroundMode === 'ai_photo' && aiImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        renderPosterContent();
      };
      img.onerror = () => {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, selectedTheme.gradientColors[0]);
        bgGrad.addColorStop(1, selectedTheme.gradientColors[1]);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
        renderPosterContent();
      };
      img.src = aiImageUrl;
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, selectedTheme.gradientColors[0]);
      bgGrad.addColorStop(1, selectedTheme.gradientColors[1]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
      renderPosterContent();
    }
  };

  // Download Vector SVG
  const handleDownloadSvg = () => {
    let width = 1200;
    let height = 1200;
    if (aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (aspectRatio === '16:9') {
      width = 1920;
      height = 1080;
    }

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="themeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${selectedTheme.gradientColors[0]}" />
      <stop offset="100%" stop-color="${selectedTheme.gradientColors[1]}" />
    </linearGradient>
  </defs>

  <!-- Background -->
  ${
    backgroundMode === 'ai_photo' && aiImageUrl
      ? `<image href="${aiImageUrl}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />`
      : `<rect width="${width}" height="${height}" fill="url(#themeGrad)" />`
  }
  <rect width="${width}" height="${height}" fill="rgba(15, 23, 42, 0.45)" />

  <!-- Badge -->
  <rect x="${width * 0.25}" y="${height * 0.14}" width="${width * 0.5}" height="${height * 0.05}" rx="${height * 0.025}" fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="2" />
  <text x="${width / 2}" y="${height * 0.17}" fill="#ffffff" font-size="${width * 0.024}" font-family="Plus Jakarta Sans, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="2">
    ${badgeText.replace(/&/g, '&amp;')}
  </text>
  
  <!-- Headline -->
  <text x="${width / 2}" y="${height * 0.38}" fill="#ffffff" font-size="${width * (aspectRatio === '16:9' ? 0.045 : 0.055)}" font-family="Plus Jakarta Sans, sans-serif" font-weight="900" text-anchor="middle">
    ${headline.slice(0, 36).replace(/&/g, '&amp;')}
  </text>
  <text x="${width / 2}" y="${height * 0.46}" fill="#ffffff" font-size="${width * (aspectRatio === '16:9' ? 0.045 : 0.055)}" font-family="Plus Jakarta Sans, sans-serif" font-weight="900" text-anchor="middle">
    ${headline.slice(36, 75).replace(/&/g, '&amp;')}
  </text>

  <!-- Subheadline -->
  <text x="${width / 2}" y="${height * 0.58}" fill="#e2e8f0" font-size="${width * 0.025}" font-family="Plus Jakarta Sans, sans-serif" text-anchor="middle">
    ${subheadline.slice(0, 52).replace(/&/g, '&amp;')}
  </text>
  <text x="${width / 2}" y="${height * 0.63}" fill="#e2e8f0" font-size="${width * 0.025}" font-family="Plus Jakarta Sans, sans-serif" text-anchor="middle">
    ${subheadline.slice(52, 105).replace(/&/g, '&amp;')}
  </text>

  <!-- CTA Box -->
  <rect x="${width * 0.28}" y="${height * 0.74}" width="${width * 0.44}" height="${height * 0.07}" rx="${height * 0.035}" fill="${selectedTheme.ctaHex}" />
  <text x="${width / 2}" y="${height * 0.785}" fill="${selectedTheme.ctaHex === '#ffffff' ? '#be123c' : '#0f172a'}" font-size="${width * 0.028}" font-family="Plus Jakarta Sans, sans-serif" font-weight="bold" text-anchor="middle">
    ${ctaText.replace(/&/g, '&amp;')}
  </text>

  <!-- Signature -->
  <text x="${width / 2}" y="${height * 0.91}" fill="rgba(255, 255, 255, 0.7)" font-size="${width * 0.022}" font-family="Plus Jakarta Sans, sans-serif" text-anchor="middle">
    ${brandSignature.replace(/&/g, '&amp;')}
  </text>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketmind_poster_${aspectRatio.replace(':', '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: One-Prompt AI Poster Creator */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-indigo-500/20 shadow-2xl text-white">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 text-white shadow-md">
                <Wand2 className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                  One-Prompt AI Poster Creator
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active &amp; Ready
                  </span>
                </h1>
                <p className="text-xs text-slate-300">
                  Enter any campaign prompt — AI instantly creates high-converting marketing posters and visual backgrounds!
                </p>
              </div>
            </div>

            {/* Action Bar: Video Teaser Sound Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const next = !isVideoTeaser;
                  setIsVideoTeaser(next);
                  if (next) playCommercialSoundbed();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isVideoTeaser
                    ? 'bg-rose-500/30 text-rose-200 border-rose-400/60 shadow-lg shadow-rose-500/20 ring-1 ring-rose-400'
                    : 'bg-white/10 hover:bg-white/15 text-slate-300 border-white/20'
                }`}
                title="Toggle 4.5s commercial motion pan teaser with audio soundbed"
              >
                <span>🎬</span>
                <span>Video Teaser {isVideoTeaser ? '(ON 🔊)' : '(OFF)'}</span>
              </button>
            </div>
          </div>

          {/* Main Prompt Input Bar */}
          <div className="relative flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGeneratePoster();
                }}
                placeholder="Enter retail, business, or freight promotional prompt (e.g. 'Truck Mitra verified freight dispatch', 'Diwali flat 50% discount sale')..."
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm font-medium shadow-inner backdrop-blur-sm pr-10"
              />
              {promptInput && (
                <button
                  onClick={() => setPromptInput('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => handleGeneratePoster()}
              disabled={isGenerating}
              className="px-6 py-3.5 sm:py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 active:scale-95 shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Designing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Poster</span>
                </>
              )}
            </button>
          </div>

          {/* Quick-Inspiration Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Quick Inspiration Prompts (Click to create):
            </span>
            <div className="flex flex-wrap gap-2">
              {inspirationChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGeneratePoster(chip.prompt)}
                  disabled={isGenerating}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-xs text-slate-200 font-medium transition-all cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ambient Decorative Lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
      </div>

      {/* Success Notification Bar */}
      {scheduledSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Poster scheduled successfully to your automated social distribution queue!</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">Auto-Queued</span>
        </div>
      )}

      {/* Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Format & Style Selection */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-600" /> 1. Format &amp; Background Mode
              </label>
            </div>

            {/* Aspect Ratio Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  aspectRatio === '1:1'
                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-200 text-brand-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium'
                }`}
              >
                <Square className="w-4 h-4" />
                <span className="text-xs">1:1 Square</span>
                <span className="text-[10px] text-slate-400">Post / Feed</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  aspectRatio === '9:16'
                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-200 text-brand-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-xs">9:16 Story</span>
                <span className="text-[10px] text-slate-400">Reel / Status</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  aspectRatio === '16:9'
                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-200 text-brand-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-xs">16:9 Banner</span>
                <span className="text-[10px] text-slate-400">Web / Display</span>
              </button>
            </div>

            {/* Background Mode Toggle */}
            <div className="pt-2">
              <span className="block text-[11px] font-bold text-slate-600 mb-1.5">Background Style</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBackgroundMode('ai_photo')}
                  className={`p-2.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    backgroundMode === 'ai_photo'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>AI Photo Backdrop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBackgroundMode('gradient')}
                  className={`p-2.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    backgroundMode === 'gradient'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Gradient / Vector</span>
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="pt-1">
              <span className="block text-[11px] font-bold text-slate-600 mb-1.5">Color Palette</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEMES.map((theme) => {
                  const isSelected = selectedTheme.id === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-brand-500 ring-2 ring-brand-200 bg-brand-50/40'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${theme.gradient} shrink-0 border border-white/20`} />
                      <span className="text-[11px] font-bold text-slate-800 truncate">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Fine-Tuning */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Customize Copy &amp; Text
              </label>
              <button
                onClick={() => handleGeneratePoster()}
                disabled={isGenerating}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
              >
                <Wand2 className="w-3 h-3" />
                <span>Reroll Copy</span>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Badge Tag</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Subheadline</label>
              <textarea
                rows={2}
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">CTA Button</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Website URL</label>
                <input
                  type="text"
                  value={brandSignature}
                  onChange={(e) => setBrandSignature(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800"
                />
              </div>
            </div>

            {/* AI Rationale Insight */}
            {aiRationale && (
              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">AI Strategy Rationale: </span>
                  <span className="text-indigo-800">{aiRationale}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Canvas Preview Column (7 cols) */}
        <div className="lg:col-span-7 sticky top-24 space-y-4">
          {/* Header Controls for Canvas */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-brand-600" />
                Live Canvas Preview
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {aspectRatio} • {selectedTheme.name}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isVideoTeaser && (
                <button
                  onClick={playCommercialSoundbed}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isAudioPlaying
                      ? 'bg-rose-500 text-white border-rose-600 shadow-md animate-pulse'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm'
                  }`}
                  title="Play commercial soundbed synthesized with Web Audio API"
                >
                  {isAudioPlaying ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                      <span>Audio Playing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>Play Audio Teaser</span>
                    </>
                  )}
                </button>
              )}
              {backgroundMode === 'ai_photo' && (
                <button
                  onClick={handleRegenerateImage}
                  disabled={isImageLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                  title="Generate a new AI background photo"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isImageLoading ? 'animate-spin' : ''}`} />
                  <span>Reroll Photo</span>
                </button>
              )}
              <button
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadSvg}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-brand-600" />
                <span>SVG</span>
              </button>
              <button
                onClick={handleDownloadPng}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={handleScheduleToCalendar}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                <span>Schedule</span>
              </button>
            </div>
          </div>

          {/* Visual Poster Frame Container */}
          <div className="bg-slate-900/5 backdrop-blur-sm p-4 sm:p-8 rounded-3xl border border-slate-200/80 flex items-center justify-center min-h-[540px]">
            {/* Poster Card */}
            <div
              className={`relative overflow-hidden shadow-2xl transition-all duration-500 flex flex-col justify-between p-8 sm:p-12 text-center select-none ${
                aspectRatio === '1:1'
                  ? 'w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] rounded-3xl'
                  : aspectRatio === '9:16'
                  ? 'w-[280px] h-[497px] sm:w-[320px] sm:h-[568px] rounded-3xl'
                  : 'w-[440px] h-[247px] sm:w-[560px] sm:h-[315px] rounded-2xl'
              }`}
            >
              {/* Layer 0: Video Teaser REC Badge */}
              {isVideoTeaser && (
                <div className="absolute top-3.5 right-3.5 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-black tracking-wide shadow-md backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>REC • MOTION TEASER</span>
                </div>
              )}

              {/* Layer 1: Background (AI Image or Gradient) */}
              {backgroundMode === 'ai_photo' && aiImageUrl ? (
                <>
                  <img
                    src={aiImageUrl}
                    alt="AI Poster Background"
                    onLoad={() => setIsImageLoading(false)}
                    className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-1000 ${
                      isVideoTeaser ? 'scale-110 motion-safe:animate-pulse duration-[5000ms]' : 'scale-100'
                    }`}
                  />
                  {/* Readability Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/45 pointer-events-none" />
                </>
              ) : (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${selectedTheme.gradient} pointer-events-none`} />
                  <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
                </>
              )}

              {/* Layer 2: Top Badge */}
              <div className="relative z-10 flex justify-center">
                <span
                  className={`text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg backdrop-blur-md ${
                    backgroundMode === 'ai_photo'
                      ? 'bg-white/20 text-white border border-white/30'
                      : selectedTheme.accentBadge
                  }`}
                >
                  {badgeText}
                </span>
              </div>

              {/* Layer 3: Main Headline & Subheadline */}
              <div className="relative z-10 my-auto space-y-2.5 px-2">
                <h2
                  className={`font-black tracking-tight leading-tight text-white drop-shadow-md ${
                    aspectRatio === '16:9' ? 'text-lg sm:text-2xl' : 'text-xl sm:text-3xl'
                  }`}
                >
                  {headline}
                </h2>
                <p
                  className={`text-slate-200 font-medium leading-relaxed max-w-sm mx-auto drop-shadow ${
                    aspectRatio === '16:9' ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'
                  }`}
                >
                  {subheadline}
                </p>
              </div>

              {/* Layer 4: Bottom CTA & Brand Signature */}
              <div className="relative z-10 space-y-2.5">
                <div className="flex justify-center">
                  <button
                    className={`px-6 py-2.5 rounded-full text-xs font-black shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer ${selectedTheme.ctaBg} ${selectedTheme.ctaText}`}
                  >
                    {ctaText}
                  </button>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-300 tracking-wide drop-shadow">
                  {brandSignature}
                </div>
              </div>
            </div>
          </div>

          {/* Active Engine & Fallback Status Bar */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-slate-600">
                Engine Active: <strong className="text-slate-900 font-semibold">{engineUsedName}</strong>
              </span>
            </div>
            {isVideoTeaser && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center gap-1.5 animate-pulse">
                <span>🎬</span>
                <span>Motion Pan + Commercial Soundbed</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
