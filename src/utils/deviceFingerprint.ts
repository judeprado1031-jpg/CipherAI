/**
 * Cipher Client Device Fingerprinting Utility
 * Generates and persists a stable, low-friction device identity
 * to enforce fair rate limiting and prevent multi-account abuse.
 */

const DEVICE_STORAGE_KEY = 'cipher_device_hardware_id_v2';
const COOKIE_NAME = 'cipher_device_token';

// Simple FNV-1a 32-bit hash function
function fnv1aHash(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

// Extract WebGL graphics driver signature
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return `${vendor}~${renderer}`;
  } catch {
    return 'gl-error';
  }
}

// Extract 2D Canvas rendering differences
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-2d';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Plus Jakarta Sans', 'Segoe UI', Arial";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 1, 62, 20);
    ctx.fillStyle = '#06b6d4';
    ctx.fillText('CipherAI:15#', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Math&FABM', 4, 17);

    return fnv1aHash(canvas.toDataURL());
  } catch {
    return 'canvas-error';
  }
}

// Cookie helper
function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

function setCookie(name: string, value: string, days: number = 365) {
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
  } catch {}
}

/**
 * Returns a persistent, unique client device identifier.
 * Stored across localStorage and cookies to withstand simple cache clears.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_render';

  // 1. Check localStorage first
  try {
    const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (stored && stored.length >= 10) {
      setCookie(COOKIE_NAME, stored);
      return stored;
    }
  } catch {}

  // 2. Check Cookie backup
  const cookieVal = getCookie(COOKIE_NAME);
  if (cookieVal && cookieVal.length >= 10) {
    try {
      localStorage.setItem(DEVICE_STORAGE_KEY, cookieVal);
    } catch {}
    return cookieVal;
  }

  // 3. Synthesize hardware attributes
  const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}@${window.devicePixelRatio || 1}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const lang = navigator.language || '';
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  const webgl = getWebGLFingerprint();
  const canvasHash = getCanvasFingerprint();

  const rawAttributes = [
    screenInfo,
    timeZone,
    lang,
    cores,
    memory,
    webgl,
    canvasHash,
  ].join('||');

  const hardwareHash = fnv1aHash(rawAttributes);
  const randomSalt = Math.random().toString(36).substring(2, 8);
  const finalDeviceId = `dev_${hardwareHash}_${randomSalt}`;

  // Persist across storage boundaries
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, finalDeviceId);
  } catch {}
  setCookie(COOKIE_NAME, finalDeviceId);

  return finalDeviceId;
}
