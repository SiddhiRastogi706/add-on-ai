import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging';
import { ApiClient } from './api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

const SNOOZE_DAYS = 3;
const TOKEN_KEY = 'push_fcm_token';

export type PushResult = 'enabled' | 'denied' | 'dismissed' | 'unsupported' | 'not-configured' | 'error';

export function isPushConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId && VAPID_KEY);
}

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return false;
  return isSupported().catch(() => false);
}

export function getPermission(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

// "Not now" ka snooze har user ke liye alag save hota hai
const snoozeKey = (userId: string) => `push_prompt_snooze_${userId}`;

export function snoozePrompt(userId: string) {
  try {
    localStorage.setItem(snoozeKey(userId), String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000));
  } catch {
    // Storage block ho to bas dobara poochhenge
  }
}

// Popup tab dikhao jab permission abhi tak "default" ho aur snooze khatam ho; "denied" par kabhi nahi
export function shouldAskForPermission(userId: string): boolean {
  if (getPermission() !== 'default') return false;
  try {
    const until = Number(localStorage.getItem(snoozeKey(userId)) || 0);
    return Date.now() >= until;
  } catch {
    return true;
  }
}

// Har login session mein welcome sirf ek baar (refresh par dobara nahi); logout par reset hota hai
const WELCOME_KEY = 'login_welcome_shown';

export function claimLoginWelcome(): boolean {
  try {
    if (sessionStorage.getItem(WELCOME_KEY)) return false;
    sessionStorage.setItem(WELCOME_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  return navigator.serviceWorker.ready;
}

// Permission mil chuki ho to token lo aur server par user ID ke saath save karo
export async function syncPushToken(options: { adminAlerts?: boolean } = {}): Promise<PushResult> {
  if (!isPushConfigured()) return 'not-configured';
  if (!(await isPushSupported())) return 'unsupported';
  if (Notification.permission !== 'granted') return 'denied';

  try {
    const app = getApps()[0] || initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    const registration = await registerServiceWorker();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return 'error';

    await ApiClient.savePushToken(token, options.adminAlerts, claimLoginWelcome());
    localStorage.setItem(TOKEN_KEY, token);
    return 'enabled';
  } catch (error) {
    console.warn('Push token sync failed:', error);
    return 'error';
  }
}

// Browser ka Allow/Block popup dikhao, phir token save karo
export async function requestPushPermission(options: { adminAlerts?: boolean } = {}): Promise<PushResult> {
  if (!isPushConfigured()) return 'not-configured';
  if (!(await isPushSupported())) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission === 'denied') return 'denied';
  if (permission !== 'granted') return 'dismissed';
  return syncPushToken(options);
}

// Logout par is device ka token hata do taaki purane user ko notification na jaye
export async function removePushToken(): Promise<void> {
  try {
    sessionStorage.removeItem(WELCOME_KEY);
    sessionStorage.removeItem('login_toast_shown');
  } catch {
    // ignore
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  try {
    await ApiClient.deletePushToken(token);
    if (await isPushSupported()) await deleteToken(getMessaging(getApps()[0] || initializeApp(firebaseConfig)));
  } catch (error) {
    console.warn('Push token removal failed:', error);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
  }
}
