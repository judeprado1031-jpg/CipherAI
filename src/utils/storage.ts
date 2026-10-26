import { ChatSession, ReviewItem, UserProfile, UserUsage } from '../types';
import { INITIAL_FORMULAS, INITIAL_SESSIONS } from './defaultData';
import { getOrCreateDeviceId } from './deviceFingerprint';

export const getDeviceId = getOrCreateDeviceId;

const STORAGE_KEYS = {
  SESSIONS: 'cipher_sessions_v1',
  ACTIVE_SESSION: 'cipher_active_session_id',
  REVIEWS: 'cipher_review_items_v1',
  PROFILE: 'cipher_user_profile_v1',
  USAGE: 'cipher_user_usage_v1',
  THEME: 'cipher_theme_preference',
};

export const defaultProfile: UserProfile = {
  id: 'user_gmail_judeprado',
  email: 'judeprado1031@gmail.com',
  name: 'Jude Prado',
  role: 'Financial Analyst',
  currency: '$',
  isPro: false,
  isGuest: false,
  theme: 'navy', // Default matches official logo!
  authProvider: 'google',
  lastSyncedAt: Date.now(),
};

export const guestProfile: UserProfile = {
  id: 'guest_' + Math.random().toString(36).substring(2, 9),
  email: '',
  name: 'Guest User',
  role: 'Guest / Trial',
  currency: '$',
  isPro: false,
  isGuest: true,
  theme: 'navy',
  authProvider: 'guest',
  lastSyncedAt: undefined,
};

export const defaultUsage: UserUsage = {
  isPro: false,
  remainingUses: 15,
  totalLimit: 15,
  usedInLast24h: 0,
  resetInMs: 0,
  nextResetTime: null,
};

export function createNewGuestSession(): ChatSession {
  return {
    id: 'guest_session_' + Date.now(),
    title: 'New Guest Problem',
    messages: [],
    assistantMode: 'fabm',
    defaultTeachingMode: 'teach',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function loadSessions(isGuest: boolean = false, userId?: string): ChatSession[] {
  // If guest, do NOT load previous conversations!
  if (isGuest) {
    return [createNewGuestSession()];
  }

  try {
    // Try account-specific key first
    if (userId && !userId.startsWith('guest_')) {
      const accountRaw = localStorage.getItem(`cipher_sessions_${userId}`);
      if (accountRaw) {
        const parsed = JSON.parse(accountRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return INITIAL_SESSIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SESSIONS;
  } catch {
    return INITIAL_SESSIONS;
  }
}

export function saveSessions(sessions: ChatSession[], isGuest: boolean = false, userId?: string) {
  // If guest, do NOT save conversations to storage!
  if (isGuest) {
    return;
  }

  try {
    if (userId && !userId.startsWith('guest_')) {
      localStorage.setItem(`cipher_sessions_${userId}`, JSON.stringify(sessions));
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Error saving sessions:', e);
  }
}

export function clearGuestData() {
  // Ensures zero trace of guest conversations
  sessionStorage.removeItem('cipher_guest_transient');
}

export function loadActiveSessionId(isGuest: boolean = false): string {
  if (isGuest) return '';
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || INITIAL_SESSIONS[0].id;
}

export function saveActiveSessionId(id: string, isGuest: boolean = false) {
  if (isGuest) return;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, id);
}

export function loadReviewItems(isGuest: boolean = false): ReviewItem[] {
  if (isGuest) return INITIAL_FORMULAS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (!raw) return INITIAL_FORMULAS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FORMULAS;
  } catch {
    return INITIAL_FORMULAS;
  }
}

export function saveReviewItems(items: ReviewItem[], isGuest: boolean = false) {
  if (isGuest) return;
  try {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving review items:', e);
  }
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw);
    return {
      ...defaultProfile,
      ...parsed,
      theme: parsed.theme || 'navy',
    };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

export function loadUsage(): UserUsage {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USAGE);
    if (!raw) return defaultUsage;
    return JSON.parse(raw);
  } catch {
    return defaultUsage;
  }
}

export function saveUsage(usage: UserUsage) {
  try {
    localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(usage));
  } catch (e) {
    console.error('Error saving usage:', e);
  }
}

// Cloud synchronization helper - only called for non-guests!
export async function syncWithCloud(
  userId: string,
  payload: {
    sessions: ChatSession[];
    reviewItems: ReviewItem[];
    profile: UserProfile;
  }
): Promise<{ success: boolean; lastSyncedAt: number; remoteUsage?: UserUsage }> {
  if (payload.profile.isGuest) {
    return { success: false, lastSyncedAt: Date.now() };
  }

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        data: payload,
      }),
    });

    if (!res.ok) {
      throw new Error('Sync failed with status ' + res.status);
    }

    const data = await res.json();
    return {
      success: true,
      lastSyncedAt: data.lastSyncedAt || Date.now(),
    };
  } catch (err) {
    console.warn('Sync with cloud offline/deferred:', err);
    return {
      success: false,
      lastSyncedAt: Date.now(),
    };
  }
}

export async function fetchServerUsage(userId: string): Promise<UserUsage | null> {
  try {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch(
      `/api/user/usage?userId=${encodeURIComponent(userId)}&deviceId=${encodeURIComponent(deviceId)}`,
      {
        headers: {
          'X-Device-Id': deviceId,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('Could not fetch server usage:', e);
  }
  return null;
}
