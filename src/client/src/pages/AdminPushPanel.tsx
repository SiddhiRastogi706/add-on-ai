import React, { useCallback, useEffect, useState } from 'react';
import { BellRing, Send, RefreshCw, Smartphone, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ApiClient } from '../services/api';
import { isPushConfigured, requestPushPermission, syncPushToken, getPermission } from '../services/push';

const TITLE_MAX = 65;
const BODY_MAX = 240;

// Admin panel ka push tab: apna device enable karo + sab users ko notification bhejo
export const AdminPushPanel: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const [adminStatus, setAdminStatus] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [mode, setMode] = useState<'tokens' | 'topic'>('tokens');
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [sendError, setSendError] = useState('');

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await ApiClient.getPushOverview());
      setLoadError('');
    } catch (error: any) {
      setLoadError(error.message || 'Could not load notification stats.');
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    // Permission pehle se mili ho to admin token chupchap refresh karo
    if (isPushConfigured() && getPermission() === 'granted') {
      void syncPushToken({ adminAlerts: true }).then(loadOverview);
    }
  }, [loadOverview]);

  const handleEnable = async () => {
    setAdminStatus('Requesting permission...');
    const result = await requestPushPermission({ adminAlerts: true });
    const messages: Record<string, string> = {
      enabled: 'Notifications enabled on this device. You will get an alert on every user login.',
      denied: 'Notifications are blocked in this browser. Allow them from the site settings (lock icon) and try again.',
      dismissed: 'Permission popup was dismissed. Click the button again to retry.',
      unsupported: 'This browser does not support push notifications.',
      'not-configured': 'Firebase keys are missing in the client .env (VITE_FIREBASE_*).',
      error: 'Could not enable notifications. Check the browser console.',
    };
    setAdminStatus(messages[result]);
    await loadOverview();
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    setSendError('');
    setReport(null);
    if (!window.confirm(`Send this notification to ALL users (${mode === 'topic' ? 'topic: all-users' : `${overview?.devices ?? 0} devices`})?`)) return;

    setSending(true);
    try {
      const result = await ApiClient.sendPushBroadcast({ title, body, link: link.trim() || undefined, mode });
      setReport(result);
      await loadOverview();
    } catch (error: any) {
      setSendError(error.message || 'Could not send notification.');
    } finally {
      setSending(false);
    }
  };

  const limitReached = overview ? overview.usedToday >= overview.dailyLimit : false;

  return (
    <div className="space-y-6">
      {loadError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</p>}
      {overview && !overview.configured && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Firebase service account is not configured on the server, so notifications cannot be sent yet.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Smartphone className="h-4 w-4" /> Devices</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{overview?.devices ?? '-'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Users className="h-4 w-4" /> Subscribed users</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{overview?.users ?? '-'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Send className="h-4 w-4" /> Sent today</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{overview ? `${overview.usedToday}/${overview.dailyLimit}` : '-'}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Admin login alerts</h3>
        <p className="mt-1 text-xs text-slate-500">
          Enable notifications on this device to get an alert whenever a user logs in. ({overview?.adminDevices ?? 0} admin device(s) enabled)
        </p>
        <button
          type="button"
          onClick={handleEnable}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
        >
          <BellRing className="h-4 w-4" /> Enable Notifications
        </button>
        {adminStatus && <p className="mt-3 text-xs font-medium text-slate-600">{adminStatus}</p>}
      </div>

      <form onSubmit={handleSend} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Send to all users</h3>

        <label className="block text-xs font-semibold text-slate-600">
          Title <span className="font-normal text-slate-400">({title.length}/{TITLE_MAX})</span>
          <input
            required
            maxLength={TITLE_MAX}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="New feature launched"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-600">
          Message <span className="font-normal text-slate-400">({body.length}/{BODY_MAX})</span>
          <textarea
            required
            rows={3}
            maxLength={BODY_MAX}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Check out what's new in your dashboard."
          />
        </label>

        <label className="block text-xs font-semibold text-slate-600">
          Link <span className="font-normal text-slate-400">(optional, https://... or /path)</span>
          <input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="https://addonaix.com/offers"
          />
        </label>

        <fieldset className="space-y-2 text-xs text-slate-600">
          <legend className="mb-1 font-semibold">Delivery method</legend>
          <label className="flex items-start gap-2">
            <input type="radio" checked={mode === 'tokens'} onChange={() => setMode('tokens')} className="mt-0.5" />
            <span><strong>Saved tokens</strong> (recommended): sent in batches of 500, with a full success/fail report and automatic cleanup of expired tokens.</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" checked={mode === 'topic'} onChange={() => setMode('topic')} className="mt-0.5" />
            <span><strong>Topic "all-users"</strong>: one single call; FCM does not return a per-device report.</span>
          </label>
          {mode === 'topic' && (
            <button
              type="button"
              onClick={async () => {
                const result = await ApiClient.syncPushTopic().catch((error: any) => ({ error: error.message }));
                setAdminStatus(result.error ? result.error : `Topic synced: ${result.subscribed}/${result.total} devices subscribed.`);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-3 w-3" /> Sync existing devices to topic
            </button>
          )}
        </fieldset>

        {limitReached && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Daily limit reached ({overview.dailyLimit} promotional notifications per day). You can send again tomorrow.
          </p>
        )}
        {sendError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{sendError}</p>}

        <button
          type="submit"
          disabled={sending || limitReached || !overview?.configured}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Sending...' : 'Send to ALL users'}
        </button>
      </form>

      {report && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4" /> Notification sent</p>
          {report.mode === 'topic' ? (
            <p className="mt-2 text-xs">Sent to topic <strong>all-users</strong> (message id: {report.topicMessageId}). FCM does not provide per-device counts for topic sends.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs">
              <li>Targeted devices: <strong>{report.total}</strong></li>
              <li>Delivered: <strong>{report.success}</strong></li>
              <li>Failed: <strong>{report.failure}</strong></li>
              <li>Expired tokens removed: <strong>{report.removed}</strong></li>
            </ul>
          )}
        </div>
      )}

      {overview?.recent?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Recent broadcasts</h3>
          <div className="space-y-2">
            {overview.recent.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-xs last:border-0">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{item.title}</p>
                  <p className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <span className="shrink-0 font-bold text-slate-600">
                  {item.mode === 'topic' ? 'topic' : `${item.successCount}/${item.totalTokens}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
