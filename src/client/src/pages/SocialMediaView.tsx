import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { useAuth } from '../store/AuthContext';
import {
  Share2,
  Calendar as CalendarIcon,
  Sparkles,
  Send,
  MessageSquare,
  Clock,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Tag,
  Plus,
  X as CloseIcon,
  Link2,
  Unlink,
  Lock,
  User,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCheck,
  Smartphone,
} from 'lucide-react';

export const SocialMediaView: React.FC = () => {
  const { business } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<
    Record<string, { type: 'success' | 'error'; message: string }>
  >({});
  const [commentInput, setCommentInput] = useState('');
  const [commentResult, setCommentResult] = useState<any>(null);
  const [classifying, setClassifying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    hasAnyConnectedAccount: boolean;
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
    x: boolean;
    youtube: boolean;
    accounts: Array<{ id: string; platform: string; handle: string; name: string }>;
  }>({
    hasAnyConnectedAccount: false,
    facebook: false,
    instagram: false,
    linkedin: false,
    x: false,
    youtube: false,
    accounts: [],
  });

  // Modal & Connect state
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('linkedin');
  const [handleInput, setHandleInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [customWebhookInput, setCustomWebhookInput] = useState('');
  const [customTokenInput, setCustomTokenInput] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [triggerCycleOnConnect, setTriggerCycleOnConnect] = useState(true);
  const [connectingChannel, setConnectingChannel] = useState(false);
  const [connectSuccessMessage, setConnectSuccessMessage] = useState<string | null>(null);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [markingLiveId, setMarkingLiveId] = useState<string | null>(null);

  const getFullPostText = (post: any) => {
    const tags = (post.hashtags || []).map((t: string) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
    return tags ? `${post.caption}\n\n${tags}` : post.caption;
  };

  const handleCopyPost = (post: any) => {
    const full = getFullPostText(post);
    navigator.clipboard.writeText(full);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareFacebook = (post: any) => {
    const fullText = getFullPostText(post);
    navigator.clipboard.writeText(fullText);
    const bizUrl = business?.websiteUrl || window.location.origin;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bizUrl)}&quote=${encodeURIComponent(fullText)}`;
    window.open(shareUrl, '_blank', 'width=620,height=580');
    setActionFeedback((prev) => ({
      ...prev,
      [post.id]: {
        type: 'success',
        message: '📋 Caption copied to clipboard! Opening Facebook... Simply paste (Ctrl+V) and click Post.',
      },
    }));
  };

  const handleShareTwitter = (post: any) => {
    const fullText = getFullPostText(post);
    navigator.clipboard.writeText(fullText);
    const tweetText = fullText.length > 275 ? fullText.slice(0, 272) + '...' : fullText;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank', 'width=600,height=480');
    setActionFeedback((prev) => ({
      ...prev,
      [post.id]: {
        type: 'success',
        message: '🚀 X (Twitter) composer opened with your caption pre-filled! Just click Post.',
      },
    }));
  };

  const handleShareLinkedIn = (post: any) => {
    const fullText = getFullPostText(post);
    navigator.clipboard.writeText(fullText);
    const bizUrl = business?.websiteUrl || window.location.origin;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(bizUrl)}`;
    window.open(shareUrl, '_blank', 'width=650,height=600');
    setActionFeedback((prev) => ({
      ...prev,
      [post.id]: {
        type: 'success',
        message: '📋 Caption copied! Opening LinkedIn share dialog... Paste and publish.',
      },
    }));
  };

  const handleShareWhatsApp = (post: any) => {
    const fullText = getFullPostText(post);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async (post: any) => {
    const fullText = getFullPostText(post);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: post.topic,
          text: fullText,
          url: business?.websiteUrl || undefined,
        });
      } catch (e) {
        // User cancelled or unsupported
      }
    } else {
      handleCopyPost(post);
    }
  };

  const handleMarkAsPublished = async (post: any) => {
    setMarkingLiveId(post.id);
    try {
      const res = await ApiClient.markPostPublished(post.id);
      if (res.success) {
        setActionFeedback((prev) => ({
          ...prev,
          [post.id]: { type: 'success', message: '✅ Marked as published live!' },
        }));
        await loadPosts();
      }
    } catch (e: any) {
      console.error('Failed marking post published:', e);
    } finally {
      setMarkingLiveId(null);
    }
  };

  const loadPosts = async () => {
    try {
      const data = await ApiClient.getSocialPosts(business?.id);
      setPosts(data);
    } catch (e) {
      console.error('Failed loading social posts:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadConnectionStatus = async () => {
    try {
      const status = await ApiClient.getSocialConnectionStatus(business?.id);
      if (status) {
        setConnectionStatus({
          hasAnyConnectedAccount: status.hasAnyConnectedAccount ?? false,
          facebook: status.facebook ?? false,
          instagram: status.instagram ?? false,
          linkedin: status.linkedin ?? false,
          x: status.x ?? false,
          youtube: status.youtube ?? false,
          accounts: status.accounts ?? [],
        });
      }
    } catch (e) {
      console.warn('Failed loading social connection status:', e);
    }
  };

  useEffect(() => {
    loadPosts();
    loadConnectionStatus();
  }, [business?.id]);

  const isPlatformConnected = (platform: string): boolean => {
    const p = platform.toLowerCase();
    if (p === 'linkedin' && connectionStatus.linkedin) return true;
    if (p === 'instagram' && connectionStatus.instagram) return true;
    if (p === 'facebook' && connectionStatus.facebook) return true;
    if ((p === 'x' || p === 'twitter') && connectionStatus.x) return true;
    if (p === 'youtube' && connectionStatus.youtube) return true;
    if (connectionStatus.accounts?.some((a) => a.platform.toLowerCase() === p || (p === 'twitter' && a.platform.toLowerCase() === 'x'))) {
      return true;
    }
    return false;
  };

  const getAccountForPlatform = (platform: string) => {
    const p = platform.toLowerCase();
    return connectionStatus.accounts?.find(
      (a) => a.platform.toLowerCase() === p || (p === 'twitter' && a.platform.toLowerCase() === 'x')
    );
  };

  const openConnectModal = (platform?: string) => {
    if (platform) {
      const p = platform.toLowerCase() === 'twitter' ? 'x' : platform.toLowerCase();
      setSelectedPlatform(p);
    }
    if (!handleInput && business?.name) {
      const slug = business.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      setHandleInput(`@${slug}`);
    }
    setPasswordInput('');
    setCustomWebhookInput('');
    setCustomTokenInput('');
    setShowAdvancedSettings(false);
    setShowPassword(false);
    setConnectSuccessMessage(null);
    setConnectModalOpen(true);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim()) return;
    setConnectingChannel(true);
    try {
      const creds: any = {};
      if (passwordInput.trim()) creds.password = passwordInput.trim();
      if (customWebhookInput.trim()) creds.webhookUrl = customWebhookInput.trim();
      if (customTokenInput.trim()) creds.pageAccessToken = customTokenInput.trim();

      const res = await ApiClient.connectSocialAccount({
        businessId: business?.id,
        platform: selectedPlatform,
        accountHandle: handleInput.trim(),
        displayName: business?.name || handleInput.trim(),
        credentials: Object.keys(creds).length ? creds : undefined,
        triggerCycle: triggerCycleOnConnect,
      });
      setConnectSuccessMessage(
        res.message || `${selectedPlatform.toUpperCase()} connected successfully! 7-day content schedule queued.`
      );
      await loadConnectionStatus();
      await loadPosts();
      setTimeout(() => {
        setConnectModalOpen(false);
        setConnectSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      console.error('Failed connecting channel:', err);
      alert('Failed connecting channel: ' + (err.message || 'Unknown error'));
    } finally {
      setConnectingChannel(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform.toUpperCase()}?`)) return;
    setDisconnectingPlatform(platform);
    try {
      await ApiClient.disconnectSocialAccount({
        businessId: business?.id,
        platform,
      });
      await loadConnectionStatus();
      await loadPosts();
    } catch (err: any) {
      console.error('Failed disconnecting channel:', err);
    } finally {
      setDisconnectingPlatform(null);
    }
  };

  const handleGenerateCalendar = async () => {
    setGenerating(true);
    try {
      await ApiClient.generateSocialCalendar(business?.id);
      await loadPosts();
    } catch (e) {
      console.error('Calendar generation error:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      const res = await ApiClient.publishSocialPost(id);
      if (res.success) {
        setActionFeedback((prev) => ({
          ...prev,
          [id]: { type: 'success', message: res.message || 'Post published successfully!' },
        }));
      } else {
        setActionFeedback((prev) => ({
          ...prev,
          [id]: { type: 'error', message: res.message || 'Publishing failed. Please connect your account first.' },
        }));
      }
      await loadPosts();
    } catch (e: any) {
      console.error('Publish error:', e);
      setActionFeedback((prev) => ({
        ...prev,
        [id]: { type: 'error', message: e.message || 'Error occurred while publishing.' },
      }));
    } finally {
      setPublishingId(null);
    }
  };

  const runClassification = async (text: string) => {
    if (!text.trim()) return;
    setClassifying(true);
    try {
      const res = await ApiClient.classifyComment(text, business?.id, {
        name: business?.name,
        industry: business?.industry,
        websiteUrl: business?.websiteUrl,
        productsAndServices: business?.productsAndServices,
        brandTone: business?.brandTone,
        description: business?.description,
      });
      setCommentResult(res);
    } catch (e) {
      console.error('Classification error:', e);
    } finally {
      setClassifying(false);
    }
  };

  const handleTestComment = async (e: React.FormEvent) => {
    e.preventDefault();
    await runClassification(commentInput);
  };

  const handleQuickTest = async (sampleText: string) => {
    setCommentInput(sampleText);
    await runClassification(sampleText);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-sky-600" />;
      case 'x':
      case 'twitter':
        return <Twitter className="w-4 h-4 text-slate-800" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-rose-600" />;
      default:
        return <Share2 className="w-4 h-4 text-brand-600" />;
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Social Media & Multi-Channel Calendar</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              {business?.name || 'Active Business'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous post generation, cross-platform scheduling, 1-Click universal sharing, and live verified publishing.
          </p>
        </div>

        <button
          onClick={handleGenerateCalendar}
          disabled={generating}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 transition-all shadow-soft flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Scheduling 7-Day Cycle...' : 'Generate 7-Day Content Cycle'}
        </button>
      </div>

      {/* 1-Click Sharing Info Banner for Any User */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-pink-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white shadow-2xs text-brand-600">
            <Zap className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <strong className="text-slate-900 font-bold block">
              Universal Multi-Platform Publishing (For Any Business):
            </strong>
            <span className="text-slate-600 text-[11.5px]">
              Instantly share to Facebook, X (Twitter), LinkedIn, and WhatsApp using the <strong>"1-Click Direct Share"</strong> buttons below each post with zero developer setup required.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-xl bg-white border border-indigo-200/80 text-[11px] font-bold text-indigo-700 shadow-2xs">
            100% Zero-Setup Ready
          </span>
        </div>
      </div>

      {/* Connected Channels & Autonomous Distribution Hub */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-soft bg-white/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-brand-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Connected Channels & Live Distribution Targets
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {connectionStatus.accounts?.length || 0} / 5 Linked
            </span>
          </div>

          <button
            onClick={() => openConnectModal()}
            className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200/60 transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Connect Social Channel
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
            { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
            { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            { id: 'x', name: 'X / Twitter', icon: Twitter, color: 'text-slate-800', bg: 'bg-slate-100', border: 'border-slate-300' },
            { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
          ].map((channel) => {
            const Icon = channel.icon;
            const isConn = isPlatformConnected(channel.id);
            const acct = getAccountForPlatform(channel.id);

            return (
              <div
                key={channel.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  isConn
                    ? 'bg-white border-emerald-200 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1.5 rounded-lg ${channel.bg} ${channel.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{channel.name}</span>
                  </div>
                  {isConn ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Connected & Active" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" title="Not connected" />
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between gap-1 text-[11px]">
                  {isConn ? (
                    <>
                      <div className="truncate">
                        <span className="font-mono text-[10px] text-emerald-700 font-semibold block truncate">
                          {acct?.handle || 'Connected'}
                        </span>
                        <span className="text-[9px] text-slate-400">Ready to publish</span>
                      </div>
                      <button
                        onClick={() => handleDisconnect(channel.id)}
                        disabled={disconnectingPlatform === channel.id}
                        title="Disconnect Channel"
                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        {disconnectingPlatform === channel.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                        ) : (
                          <Unlink className="w-3 h-3" />
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-400 font-medium">Not Linked</span>
                      <button
                        onClick={() => openConnectModal(channel.id)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 text-[10px] font-bold text-slate-600 transition-all flex items-center gap-1"
                      >
                        <Link2 className="w-2.5 h-2.5" /> Connect
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar Grid View */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-soft">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Scheduled Social Distribution Queue ({posts.length} Posts)
            </h3>
          </div>
          {connectionStatus.hasAnyConnectedAccount ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Autonomous Publisher Active
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Draft Mode (No Social Channels Connected)
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <span className="text-xs">Loading social queue...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No scheduled posts yet. Click "Generate 7-Day Content Cycle" above to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => {
              const feedback = actionFeedback[post.id];
              const isLive = !post.isSandboxMode && post.status === 'PUBLISHED';

              return (
                <div
                  key={post.id}
                  className="p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(post.platform)}
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{post.platform}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {post.contentType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isLive ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            LIVE
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            DRAFT
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            post.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : post.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                    </div>

                    <div className="font-bold text-xs text-slate-900 mb-1">{post.topic}</div>
                    <p className="text-xs text-slate-600 line-clamp-4 whitespace-pre-line leading-relaxed mb-3">
                      {post.caption}
                    </p>

                    {/* Creative Concept Note */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 mb-3">
                      <strong className="text-slate-700">Art Concept:</strong> {post.creativeConcept}
                    </div>

                    {/* Hashtags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(post.hashtags || []).map((tag: string, ti: number) => (
                        <span key={ti} className="text-[10px] text-brand-600 font-semibold">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* 1-Click Universal Share Bar (Works for Any User / Business with Zero Setup) */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Share2 className="w-3 h-3 text-brand-500" /> 1-Click Direct Share:
                        </span>
                        <span className="text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                          Zero Setup Needed
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Primary Platform Share */}
                        {post.platform.toLowerCase() === 'x' || post.platform.toLowerCase() === 'twitter' ? (
                          <button
                            type="button"
                            onClick={() => handleShareTwitter(post)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 hover:text-black bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-xl border border-slate-300 shadow-2xs transition-all active:scale-95"
                            title="Open X / Twitter composer with caption & hashtags pre-filled"
                          >
                            <Twitter className="w-3.5 h-3.5 text-slate-900" />
                            <span>Post to X</span>
                          </button>
                        ) : post.platform.toLowerCase() === 'facebook' ? (
                          <button
                            type="button"
                            onClick={() => handleShareFacebook(post)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl border border-blue-200 shadow-2xs transition-all active:scale-95"
                            title="Copy caption and open Facebook share dialog"
                          >
                            <Facebook className="w-3.5 h-3.5 text-blue-600" />
                            <span>Share to Facebook</span>
                          </button>
                        ) : post.platform.toLowerCase() === 'linkedin' ? (
                          <button
                            type="button"
                            onClick={() => handleShareLinkedIn(post)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-xl border border-sky-200 shadow-2xs transition-all active:scale-95"
                            title="Copy caption and open LinkedIn share dialog"
                          >
                            <Linkedin className="w-3.5 h-3.5 text-sky-600" />
                            <span>Share to LinkedIn</span>
                          </button>
                        ) : post.platform.toLowerCase() === 'instagram' ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleCopyPost(post);
                              window.open('https://www.instagram.com/', '_blank');
                              setActionFeedback((prev) => ({
                                ...prev,
                                [post.id]: {
                                  type: 'success',
                                  message: '📋 Caption copied! Opening Instagram... Paste caption with your media post!',
                                },
                              }));
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-700 hover:text-pink-900 bg-pink-50 hover:bg-pink-100 px-3 py-1 rounded-xl border border-pink-200 shadow-2xs transition-all active:scale-95"
                            title="Copy caption and open Instagram"
                          >
                            <Instagram className="w-3.5 h-3.5 text-pink-600" />
                            <span>Copy & Open Instagram</span>
                          </button>
                        ) : post.platform.toLowerCase() === 'youtube' ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleCopyPost(post);
                              window.open('https://studio.youtube.com/', '_blank');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-xl border border-rose-200 shadow-2xs transition-all active:scale-95"
                            title="Copy caption and open YouTube Studio"
                          >
                            <Youtube className="w-3.5 h-3.5 text-rose-600" />
                            <span>YouTube Community</span>
                          </button>
                        ) : null}

                        {/* WhatsApp Fast Share */}
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(post)}
                          className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs transition-all active:scale-95"
                          title="Share to WhatsApp chat, group, or status"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Native Device Share (Mobile & Supported Desktops) */}
                        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                          <button
                            type="button"
                            onClick={() => handleNativeShare(post)}
                            className="inline-flex items-center gap-1 text-[10.5px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs transition-all active:scale-95"
                            title="Share via device apps (Instagram, Telegram, Messages, etc.)"
                          >
                            <Smartphone className="w-3 h-3 text-purple-600" />
                            <span>Share App</span>
                          </button>
                        )}

                        {/* Copy Full Post Caption & Tags */}
                        <button
                          type="button"
                          onClick={() => handleCopyPost(post)}
                          className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-700 hover:text-brand-600 transition-colors bg-white hover:bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs"
                          title="Copy complete post text and hashtags to clipboard"
                        >
                          {copiedId === post.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                          {copiedId === post.id ? 'Copied!' : 'Copy Text'}
                        </button>
                      </div>
                    </div>

                    {/* Live Permalink if available */}
                    {post.publishedUrl && (
                      <div className="mt-2 mb-1">
                        <a
                          href={post.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> View Published Post
                        </a>
                      </div>
                    )}

                    {/* Feedback Alert Banner */}
                    {feedback && (
                      <div
                        className={`mt-2 p-2 rounded-xl text-[11px] flex items-start gap-1.5 leading-snug ${
                          feedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {feedback.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-rose-600" />
                        )}
                        <span>{feedback.message}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(post.scheduledTime).toLocaleDateString()} {new Date(post.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {post.status !== 'PUBLISHED' ? (
                        <>
                          {isPlatformConnected(post.platform) ? (
                            <button
                              onClick={() => handlePublish(post.id)}
                              disabled={publishingId === post.id}
                              className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[11px] transition-colors disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                              title="Auto-publish post via background integration"
                            >
                              {publishingId === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-brand-600" />}
                              {publishingId === post.id ? 'Publishing...' : 'Auto-Publish'}
                            </button>
                          ) : (
                            <button
                              onClick={() => openConnectModal(post.platform)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-[10.5px] border border-slate-200 transition-all flex items-center gap-1 shadow-2xs"
                              title={`Connect ${post.platform} account for automated background publishing`}
                            >
                              <Link2 className="w-3 h-3 text-slate-500" /> Connect Channel
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleMarkAsPublished(post)}
                            disabled={markingLiveId === post.id}
                            className="px-2 py-1.5 rounded-xl text-[10.5px] font-semibold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-200"
                            title="Mark this post as live manually if you shared it via 1-click share"
                          >
                            {markingLiveId === post.id ? <Loader2 className="w-3 h-3 animate-spin text-emerald-600" /> : 'Mark Live'}
                          </button>
                        </>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Published
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Social Engagement & Multilingual Sentiment Triage */}
      {(() => {
        const currentBizName = business?.name || 'Active Company';
        const cleanDomain = business?.websiteUrl
          ? business.websiteUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]
          : '';
        const isLogisticsBiz =
          (business?.industry || '').toLowerCase().includes('logistics') ||
          (business?.industry || '').toLowerCase().includes('truck') ||
          (business?.industry || '').toLowerCase().includes('transport') ||
          currentBizName.toLowerCase().includes('truck');

        const quickScenarios = [
          {
            label: isLogisticsBiz ? '🚛 Book Freight / Truck (Lead)' : `💼 Customer Lead Inquiry`,
            text: isLogisticsBiz
              ? 'Need a 20-tonne commercial truck from Delhi to Mumbai for industrial freight dispatch. How can I book immediately?'
              : `Interested in ${currentBizName} services, how do I get started or book?`,
            badge: 'Lead -> Auto-Reply',
          },
          {
            label: `💰 Pricing / Rate Inquiry`,
            text: isLogisticsBiz
              ? 'What is the estimated freight rate for a 32ft container truck from Delhi to Jaipur?'
              : `What is the estimated pricing and subscription plan for your services?`,
            badge: 'Pricing -> Approval Queue',
          },
          {
            label: `🚨 Payment Issue (Support)`,
            text: 'Our invoice payment has been pending for 5 days with no status update. Can customer support assist?',
            badge: 'Complaint -> Approval Queue',
          },
          {
            label: '🛑 Spam Link (Promo Filter)',
            text: 'Earn 50000 daily! bit.ly/xyz',
            badge: 'Spam -> Ignored / Filtered',
          },
          {
            label: '❓ Gibberish / Unknown',
            text: 'asdfgh',
            badge: 'Other -> Approval Queue',
          },
          {
            label: isLogisticsBiz ? '📦 Book Truck (English Lead)' : `🚀 Customer Inquiry (English Lead)`,
            text: isLogisticsBiz
              ? 'I need a truck from Delhi to Mumbai, how do I book?'
              : `I want to get started with ${currentBizName}, how can I sign up?`,
            badge: 'Lead -> Auto-Reply',
          },
        ];

        return (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  AI Social Engagement & Sentiment Triage
                </h3>
                <span className="text-[10.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <Tag className="w-3 h-3 text-indigo-500" /> {currentBizName} Intelligent Router
                </span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 self-start sm:self-auto">
                <Globe className="w-3 h-3" /> Hindi • Hinglish • English
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Autonomous comment classifier and safety router for <strong>{currentBizName}</strong>. Analyzes customer intent across any industry, adheres to strict brand guardrails (never quotes unauthorized rates or false promises), and enforces the <strong>Approval Queue</strong> for complaints, pricing questions, and sensitive topics.
            </p>

            {/* Quick Test Scenarios */}
            <div className="mb-5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-2">
                <Tag className="w-3.5 h-3.5 text-indigo-500" /> 1-Click Test Scenarios (Evaluate Intent & Safety Routing for {currentBizName}):
              </div>
              <div className="flex flex-wrap gap-2">
                {quickScenarios.map((scenario, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickTest(scenario.text)}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-900 transition-all text-left shadow-2xs flex flex-col gap-0.5"
                  >
                    <span className="font-semibold">{scenario.label}</span>
                    <span className="text-[9.5px] text-slate-400 font-mono">{scenario.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleTestComment} className="space-y-3">
                <label className="block text-[11px] font-bold text-slate-700">
                  Customer Comment / Direct Message Text:
                </label>
                <textarea
                  rows={3}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder={
                    isLogisticsBiz
                      ? "e.g. 'Need a 32ft commercial truck from Delhi to Mumbai, how do I book?'"
                      : `e.g. 'I would like to inquire about plans and pricing for ${currentBizName}'`
                  }
                  className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-400 shadow-2xs"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={classifying || !commentInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    {classifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Classifying & Validating...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Analyze & Route Comment
                      </>
                    )}
                  </button>
                  {commentInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCommentInput('');
                        setCommentResult(null);
                      }}
                      className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>

              {commentResult ? (
                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-sm text-xs space-y-3">
                  {/* Header: Classification + Route Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                          commentResult.intent === 'lead'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : commentResult.intent === 'pricing'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : commentResult.intent === 'complaint'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : commentResult.intent === 'spam'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : commentResult.intent === 'praise'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        Intent: {commentResult.classification}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                        🌐 {commentResult.language || 'Hinglish'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                        🎯 {Math.round((commentResult.confidence || 0.9) * 100)}% Match
                      </span>
                    </div>

                    {commentResult.route === 'auto_reply' ? (
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Safe for Auto-Reply
                      </span>
                    ) : commentResult.route === 'ignore' ? (
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 shadow-2xs">
                        <ShieldAlert className="w-3 h-3 text-slate-500" /> Filtered & Ignored
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-2xs">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> Sent to Approval Queue
                      </span>
                    )}
                  </div>

                  {/* Rationale explanation */}
                  {commentResult.reason && (
                    <div className="text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <strong className="text-slate-800">Triage Decision:</strong> {commentResult.reason}
                    </div>
                  )}

                  {/* Prepared Response Body */}
                  {commentResult.route === 'ignore' ? (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 italic text-[11px]">
                      No public reply prepared. Spam schemes, links, or bot messages are automatically dropped without cluttering the page.
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <strong className="text-slate-900">
                          Prepared Response ({commentResult.language || 'Hinglish'}):
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {(commentResult.suggestedResponse || commentResult.reply || '').split(/\s+/).filter(Boolean).length} words
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium italic">
                        "{commentResult.suggestedResponse || commentResult.reply}"
                      </p>
                    </div>
                  )}

                  {/* Guardrail Status Footer */}
                  <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 pt-1">
                    {commentResult.route === 'auto_reply' ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Safe: {currentBizName} brand tone matched. Only official domain ({cleanDomain || 'verified website'}) referenced. No arbitrary pricing or false commitments made.
                      </span>
                    ) : commentResult.route === 'ignore' ? (
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> Auto-quarantined to protect brand reputation and prevent spam link propagation.
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Guardrail Active: Fixed price promises, customer complaints, and ambiguous messages must be reviewed by an authorized human operator.
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                  <span>Select any test scenario chip above or type your own comment to evaluate intelligent classification for {currentBizName}.</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Channel Connection Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Connect Social Media Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Link your client or business profile for autonomous 7-day cycles & live publishing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {connectSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{connectSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleConnectSubmit} className="space-y-4">
                {/* Platform Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Select Social Platform:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-sky-600' },
                      { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
                      { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                      { id: 'x', label: 'X', icon: Twitter, color: 'text-slate-800' },
                      { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-rose-600' },
                    ].map((p) => {
                      const Icon = p.icon;
                      const isSelected = selectedPlatform === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlatform(p.id)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-bold transition-all ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50/50 text-brand-700 ring-2 ring-brand-500/20 shadow-2xs'
                              : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${p.color}`} />
                          <span className="text-[10px]">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Username / Email ID */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Username / Profile Handle <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder={
                      business?.name
                        ? `e.g. @${business.name.toLowerCase().replace(/[^a-z0-9]/g, '')} ya username`
                        : 'e.g. @mybusiness ya username'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white shadow-2xs transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Apna official social media account ka username ya handle dalein.
                  </p>
                </div>

                {/* Password / App Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      Account Password / Credential <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[9.5px] text-slate-400 font-medium">Encrypted & Secure</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Account password dalein"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white shadow-2xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Multi-channel integration aur live auto-publishing verification ke liye.
                  </p>
                </div>

                {/* Advanced Automation Integration (Optional Accordion) */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-[11px] font-bold text-slate-700 hover:bg-slate-100/60 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Advanced: Custom Webhook or Meta API Token (Optional)
                    </span>
                    {showAdvancedSettings ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {showAdvancedSettings && (
                    <div className="p-3.5 pt-2 border-t border-slate-200/80 space-y-3 bg-white">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                          Custom Webhook URL (Make.com / Zapier / Buffer / Pabbly):
                        </label>
                        <input
                          type="url"
                          value={customWebhookInput}
                          onChange={(e) => setCustomWebhookInput(e.target.value)}
                          placeholder="https://hook.eu1.make.com/your-unique-hook"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-800 focus:outline-none focus:border-brand-500"
                        />
                        <p className="text-[9.5px] text-slate-400 mt-1">
                          Is business ke liye automatic background publishing webhook.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                          Platform Page Access Token (Optional):
                        </label>
                        <input
                          type="password"
                          value={customTokenInput}
                          onChange={(e) => setCustomTokenInput(e.target.value)}
                          placeholder="EAAd..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-800 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Helpful Zero-Setup Note */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-800 space-y-0.5">
                  <div className="font-bold flex items-center gap-1 text-emerald-900">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Ready for All Businesses
                  </div>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    Even without custom API tokens or webhooks, publish instantly to Facebook, Twitter (X), LinkedIn, and WhatsApp via the <strong>1-Click Direct Share</strong> buttons on each post!
                  </p>
                </div>

                {/* Trigger 7-Day Cycle Checkbox */}
                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
                  <input
                    id="triggerCycle"
                    type="checkbox"
                    checked={triggerCycleOnConnect}
                    onChange={(e) => setTriggerCycleOnConnect(e.target.checked)}
                    className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="triggerCycle" className="text-[11px] text-slate-700 leading-snug cursor-pointer select-none">
                    <strong className="text-indigo-900 block font-bold mb-0.5">
                      Account connect hote hi 7-day content cycle chalao
                    </strong>
                    Auto-analyzes your business industry & creates a 7-day scheduled calendar queue ready to publish.
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConnectModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={connectingChannel || !handleInput.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {connectingChannel && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {connectingChannel ? 'Connecting & Scheduling...' : 'Connect & Activate Channel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
