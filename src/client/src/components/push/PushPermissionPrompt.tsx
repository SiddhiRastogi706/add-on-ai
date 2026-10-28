import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import {
  getPermission,
  isPushConfigured,
  isPushSupported,
  requestPushPermission,
  shouldAskForPermission,
  snoozePrompt,
  syncPushToken,
} from '../../services/push';

// Login ke baad friendly popup; Allow ke baad hi browser ka asli Allow/Block popup aata hai
export const PushPermissionPrompt: React.FC = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(false);

  // Har login par in-app congratulation message (push block ho tab bhi dikhta hai)
  useEffect(() => {
    if (!user?.id) return;
    try {
      if (sessionStorage.getItem('login_toast_shown') === user.id) return;
      sessionStorage.setItem('login_toast_shown', user.id);
    } catch {
      // storage block ho to bhi dikha do
    }
    setToast(true);
    const timer = window.setTimeout(() => setToast(false), 5000);
    return () => window.clearTimeout(timer);
  }, [user?.id]);
  useEffect(() => {
    if (!user?.id || !isPushConfigured()) return;
    let cancelled = false;

    isPushSupported().then((supported) => {
      if (cancelled || !supported) return;
      if (getPermission() === 'granted') {
        // Permission pehle se hai: chupchap token refresh karo
        void syncPushToken({ adminAlerts: user.role === 'SUPER_ADMIN' });
      } else if (shouldAskForPermission(user.id)) {
        setVisible(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  if (!user) return null;

  const toastNode = toast ? (
    <div className="fixed left-1/2 top-4 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-2xl">
      🎉 Congratulations! You are logged in to Addon AI.
    </div>
  ) : null;

  if (!visible) return toastNode;

  const handleAllow = async () => {
    setBusy(true);
    // Admin ka token admin-alert ke liye bhi save hota hai
    await requestPushPermission({ adminAlerts: user.role === 'SUPER_ADMIN' });
    setBusy(false);
    // Block hua to browser "denied" yaad rakhta hai, isliye dobara nahi poochhenge
    setVisible(false);
  };

  const handleNotNow = () => {
    snoozePrompt(user.id);
    setVisible(false);
  };

  return (
    <>
    {toastNode}
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Bell className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-900">Stay in the loop</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Naye offers aur features ki update paane ke liye notifications allow karein 🔔
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleNotNow}
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleAllow}
            disabled={busy}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? 'Please wait...' : 'Allow'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
