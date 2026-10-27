import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ImagePlus,
  Loader2,
  Maximize2,
  Pencil,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { ApiClient, PhotoPoster, PosterTemplate } from '../services/api';

type Step = 1 | 2 | 3 | 4;

const ACTIVE_POSTER_KEY = 'addonaix_active_photo_poster';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const STEP_LABELS = ['Add item', 'Template', 'Generating', 'Ready'];

const gradientBtn =
  'bg-gradient-to-r from-violet-600 via-indigo-600 to-orange-500 text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 transition-all';

const Stepper: React.FC<{ step: Step }> = ({ step }) => (
  <ol className="flex items-center justify-center gap-1.5 sm:gap-2">
    {STEP_LABELS.map((label, index) => {
      const number = (index + 1) as Step;
      const done = number < step;
      const active = number === step;
      return (
        <li key={label} className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
              done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}
          >
            {done ? <Check className="h-3.5 w-3.5" /> : <span>{number}</span>}
          </span>
          <span className={`hidden text-[11px] font-semibold sm:inline ${active ? 'text-indigo-700' : 'text-slate-400'}`}>{label}</span>
          {number < 4 && <span className="h-px w-4 bg-slate-200 sm:w-8" />}
        </li>
      );
    })}
  </ol>
);

export const PhotoPosterFlow: React.FC = () => {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2
  const [templates, setTemplates] = useState<PosterTemplate[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const templateRequestId = useRef(0);
  const loadingRef = useRef(false);

  // Steps 3 & 4
  const [poster, setPoster] = useState<PhotoPoster | null>(null);
  const [notifyRequested, setNotifyRequested] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const applyPoster = useCallback((next: PhotoPoster) => {
    setPoster(next);
    if (next.status === 'PENDING' || next.status === 'FAILED') setStep(3);
    else if (next.status === 'READY' || next.status === 'APPROVED') setStep(4);
    if (next.status === 'APPROVED') setApproved(true);
  }, []);

  // Page chhodkar wapas aane par chal rahi generation resume karo
  useEffect(() => {
    const savedId = localStorage.getItem(ACTIVE_POSTER_KEY);
    if (!savedId) return;
    ApiClient.getPhotoPoster(savedId)
      .then((saved) => {
        if (saved.status === 'REJECTED') {
          localStorage.removeItem(ACTIVE_POSTER_KEY);
          return;
        }
        setItemName(saved.itemName);
        setSelectedTemplateId(saved.templateId);
        applyPoster(saved);
      })
      .catch(() => localStorage.removeItem(ACTIVE_POSTER_KEY));
  }, [applyPoster]);

  /* ----------------------------- Step 1 helpers ----------------------------- */
  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setFileError('Please choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFileError('Image must be 10 MB or smaller.');
      return;
    }
    setFileError(null);
    setPhotoFile(file);
  };

  const canContinue = Boolean(photoFile) && itemName.trim().length > 0;

  /* ----------------------------- Step 2 helpers ----------------------------- */
  const loadTemplates = useCallback(
    async (cursor: string | null, reset: boolean) => {
      if (loadingRef.current && !reset) return;
      const requestId = ++templateRequestId.current;
      loadingRef.current = true;
      setLoadingTemplates(true);
      setTemplatesError(null);
      try {
        const page = await ApiClient.getTemplates(cursor);
        if (requestId !== templateRequestId.current) return;
        setTemplates((prev) => (reset ? page.items : [...prev, ...page.items]));
        setNextCursor(page.nextCursor);
      } catch (err: any) {
        if (requestId === templateRequestId.current) setTemplatesError(err?.message || 'Could not load templates.');
      } finally {
        if (requestId === templateRequestId.current) {
          loadingRef.current = false;
          setLoadingTemplates(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (step !== 2) return;
    setTemplates([]);
    setNextCursor(null);
    void loadTemplates(null, true);
  }, [step, loadTemplates]);

  useEffect(() => {
    if (step !== 2 || !nextCursor) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadTemplates(nextCursor, false);
      },
      { rootMargin: '300px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [step, nextCursor, loadTemplates, templates.length]);

  const handleGenerate = async () => {
    if (!photoFile || !selectedTemplateId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const form = new FormData();
      form.append('itemImage', photoFile);
      form.append('itemName', itemName.trim());
      form.append('description', description.trim());
      form.append('price', price.trim());
      form.append('templateId', selectedTemplateId);
      const created = await ApiClient.createPhotoPoster(form);
      localStorage.setItem(ACTIVE_POSTER_KEY, created.id);
      setNotifyRequested(false);
      setApproved(false);
      setScheduled(false);
      setActionError(null);
      setPoster(created);
      setStep(3);
    } catch (err: any) {
      setSubmitError(err?.message || 'Could not start generation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------ Step 3 polling ----------------------------- */
  useEffect(() => {
    if (step !== 3 || !poster || poster.status !== 'PENDING') return;
    let cancelled = false;
    let inFlight = false;
    const timer = window.setInterval(async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const latest = await ApiClient.getPhotoPoster(poster.id);
        if (!cancelled && latest.status !== 'PENDING') applyPoster(latest);
      } catch {
        // network hiccup: agli poll par dobara try hoga
      } finally {
        inFlight = false;
      }
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [step, poster, applyPoster]);

  const handleNotify = async () => {
    if (!poster) return;
    try {
      await ApiClient.notifyPhotoPoster(poster.id);
      setNotifyRequested(true);
    } catch (err: any) {
      setActionError(err?.message || 'Could not set the notification.');
    }
  };

  /* ------------------------------ Step 4 actions ----------------------------- */
  const runAction = async (name: string, task: () => Promise<void>) => {
    setActionBusy(name);
    setActionError(null);
    try {
      await task();
    } catch (err: any) {
      setActionError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setActionBusy(null);
    }
  };

  const handleReject = () =>
    runAction('reject', async () => {
      if (!poster) return;
      const next = await ApiClient.rejectPhotoPoster(poster.id);
      if (next.status === 'REJECTED') {
        localStorage.removeItem(ACTIVE_POSTER_KEY);
        setPoster(null);
        setStep(2);
        return;
      }
      setCaptionOpen(false);
      setNotifyRequested(false);
      setPoster(next);
      setStep(3);
    });

  const handleApprove = () =>
    runAction('approve', async () => {
      if (!poster) return;
      const next = await ApiClient.approvePhotoPoster(poster.id);
      localStorage.removeItem(ACTIVE_POSTER_KEY);
      setPoster(next);
      setApproved(true);
    });

  const handleDownload = () =>
    runAction('download', async () => {
      if (!poster) return;
      const blob = await ApiClient.downloadPhotoPoster(poster.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${poster.itemName.replace(/[^\w-]+/g, '_') || 'poster'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

  const handleSchedule = () =>
    runAction('schedule', async () => {
      if (!poster?.resultUrl) return;
      await ApiClient.generateSocialPost({
        channel: 'instagram',
        topic: poster.itemName,
        caption: poster.caption || undefined,
        imageUrl: poster.resultUrl,
      });
      setScheduled(true);
    });

  const handleCopyCaption = async () => {
    if (!poster?.caption) return;
    await navigator.clipboard.writeText(poster.caption).catch(() => undefined);
    setCaptionCopied(true);
    window.setTimeout(() => setCaptionCopied(false), 1800);
  };

  const startOver = () => {
    localStorage.removeItem(ACTIVE_POSTER_KEY);
    setPoster(null);
    setPhotoFile(null);
    setItemName('');
    setDescription('');
    setPrice('');
    setSelectedTemplateId(null);
    setApproved(false);
    setScheduled(false);
    setActionError(null);
    setSubmitError(null);
    setStep(1);
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3 && poster?.status === 'FAILED') setStep(2);
  };

  const showBack = step === 2 || (step === 3 && poster?.status === 'FAILED');

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9">
          {showBack && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex-1">
          <Stepper step={step} />
        </div>
        <div className="w-9" />
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <section className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">
              <span>Add New Item</span>
            </h2>
            <p className="text-xs text-slate-500">
              <span>Upload a real photo of your product or place. AI turns it into a ready poster.</span>
            </p>
          </div>

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
          {photoPreview ? (
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              <img src={photoPreview} alt="Selected item" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Replace photo"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-indigo-700 shadow-lg hover:bg-white"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto flex aspect-[4/3] w-full max-w-sm flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 text-indigo-700 transition hover:bg-indigo-50"
            >
              <ImagePlus className="h-9 w-9" />
              <span className="text-sm font-bold">Choose from gallery</span>
              <span className="text-[11px] text-slate-500">JPEG, PNG or WebP · up to 10 MB</span>
            </button>
          )}
          {fileError && (
            <p role="alert" className="text-center text-xs font-semibold text-rose-600">
              <span>{fileError}</span>
            </p>
          )}

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Item Name *</span>
              <input
                value={itemName}
                maxLength={120}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Samsung Galaxy S24"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Description (optional)</span>
              <textarea
                value={description}
                maxLength={500}
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key features, offer details..."
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Price (optional)</span>
              <input
                value={price}
                maxLength={40}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. ₹49,999"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>

          <button type="button" disabled={!canContinue} onClick={() => setStep(2)} className={`w-full rounded-2xl py-3.5 text-sm font-bold ${gradientBtn}`}>
            <span>Save &amp; Continue</span>
          </button>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">
              <span>Select Template</span>
            </h2>
            <p className="text-xs text-slate-500">
              <span>Pick the poster style you like. AI copies the look with your photo.</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3 lg:grid-cols-4">
            {templates.map((template) => {
              const selected = template.id === selectedTemplateId;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  aria-pressed={selected}
                  className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-slate-100 transition ${
                    selected ? 'border-indigo-600 ring-4 ring-indigo-100' : 'border-transparent hover:border-indigo-200'
                  }`}
                >
                  <img src={template.imageUrl} alt={`${template.category} template`} loading="lazy" className="h-full w-full object-cover" />
                  {selected && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              );
            })}
            {loadingTemplates &&
              Array.from({ length: templates.length === 0 ? 6 : 2 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="aspect-square animate-pulse rounded-2xl bg-slate-200" />
              ))}
          </div>

          {!loadingTemplates && templates.length === 0 && !templatesError && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              <span>No templates available yet. Please check back soon.</span>
            </p>
          )}
          {templatesError && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <span>{templatesError}</span>
              <button type="button" onClick={() => void loadTemplates(nextCursor, templates.length === 0)} className="font-bold underline">
                <span>Retry</span>
              </button>
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />

          <div className="sticky bottom-3 z-10 space-y-2">
            {submitError && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700">
                <span>{submitError}</span>
              </p>
            )}
            <button type="button" disabled={!selectedTemplateId || submitting} onClick={handleGenerate} className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold ${gradientBtn}`}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{submitting ? 'Starting...' : 'Generate Now'}</span>
            </button>
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && poster && (
        <section className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 text-center shadow-sm sm:p-7">
          {poster.status === 'FAILED' ? (
            <div role="alert" className="space-y-4 py-6">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-7 w-7" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                <span>Poster generation failed</span>
              </h2>
              <p className="mx-auto max-w-sm text-sm text-slate-600">
                <span>{poster.error || 'Something went wrong.'}</span>
              </p>
              <p className="text-xs text-emerald-700">
                <span>Your wallet charge was refunded.</span>
              </p>
              {actionError && (
                <p className="text-xs font-semibold text-rose-600">
                  <span>{actionError}</span>
                </p>
              )}
              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                {poster.retriesLeft > 0 && (
                  <button type="button" onClick={handleReject} disabled={actionBusy !== null} className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold ${gradientBtn}`}>
                    {actionBusy === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span>Try again</span>
                  </button>
                )}
                <button type="button" onClick={startOver} className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  <span>Start over</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-slate-200">
                {photoPreview && <img src={photoPreview} alt="" className="h-full w-full scale-105 object-cover opacity-40 blur-md" />}
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-violet-200/60 via-indigo-100/40 to-orange-200/60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
                  <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-indigo-700 shadow">Peeking at your photo...</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="mx-auto h-3 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="mx-auto h-3 w-1/2 animate-pulse rounded-full bg-slate-200" />
              </div>
              <p className="text-xs text-slate-500">
                <span>Creating your poster. This usually takes under a minute.</span>
              </p>
              {actionError && (
                <p className="text-xs font-semibold text-rose-600">
                  <span>{actionError}</span>
                </p>
              )}
              <button
                type="button"
                onClick={handleNotify}
                disabled={notifyRequested || poster.notifyUser}
                className="mx-auto flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-70"
              >
                {notifyRequested || poster.notifyUser ? <CheckCircle2 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                <span>{notifyRequested || poster.notifyUser ? "We'll notify you" : "Notify me when it's ready"}</span>
              </button>
            </>
          )}
        </section>
      )}

      {/* STEP 4 */}
      {step === 4 && poster && (
        <section className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">
              <span>{approved ? 'Poster Approved' : 'Poster Ready'}</span>
            </h2>
            {approved && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Saved</span>
              </span>
            )}
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-md">
            {poster.resultUrl && <img src={poster.resultUrl} alt={`${poster.itemName} poster`} className="h-full w-full object-cover" />}
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              aria-label="View fullscreen"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {poster.caption && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Caption</span>
                <button type="button" onClick={handleCopyCaption} className="text-[11px] font-bold text-indigo-600 hover:underline">
                  <span>{captionCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className={`whitespace-pre-line text-sm text-slate-700 ${captionOpen ? '' : 'line-clamp-3'}`}>{poster.caption}</p>
              <button type="button" onClick={() => setCaptionOpen((open) => !open)} className="mt-1 flex items-center gap-1 text-xs font-bold text-indigo-600">
                {captionOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <span>{captionOpen ? 'Show less' : 'Show more'}</span>
              </button>
            </div>
          )}

          {actionError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700">
              <span>{actionError}</span>
            </p>
          )}

          {!approved ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleReject}
                disabled={actionBusy !== null || poster.retriesLeft === 0}
                className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3.5 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
              >
                {actionBusy === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                <span>{poster.retriesLeft === 0 ? 'No retries left' : `Reject Post (${poster.retriesLeft} left)`}</span>
              </button>
              <button type="button" onClick={handleApprove} disabled={actionBusy !== null} className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold ${gradientBtn}`}>
                {actionBusy === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                <span>Approve Post</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={handleDownload} disabled={actionBusy !== null} className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold ${gradientBtn}`}>
                  {actionBusy === 'download' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span>Download PNG</span>
                </button>
                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={actionBusy !== null || scheduled}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 py-3.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-70"
                >
                  {actionBusy === 'schedule' ? <Loader2 className="h-4 w-4 animate-spin" /> : scheduled ? <CheckCircle2 className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                  <span>{scheduled ? 'Scheduled' : 'Schedule'}</span>
                </button>
              </div>
              <button type="button" onClick={startOver} className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                <span>Create another poster</span>
              </button>
            </div>
          )}
        </section>
      )}

      {fullscreen && poster?.resultUrl && (
        <div role="dialog" aria-modal="true" aria-label="Poster preview" className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 p-4" onClick={() => setFullscreen(false)}>
          <button type="button" aria-label="Close preview" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <X className="h-5 w-5" />
          </button>
          <img src={poster.resultUrl} alt={`${poster.itemName} poster`} className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};
