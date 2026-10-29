/**
 * Platform Detection Utility
 * Detects whether the current environment is running inside a Tauri desktop window
 * or inside a regular web browser (e.g., hosted on Vercel).
 */

export const isTauriApp = () => {
  if (typeof window === 'undefined') return false;
  if (Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__)) return true;
  if (window.location.search.includes('platform=tauri') || window.location.search.includes('desktop=1')) {
    return true;
  }
  return false;
};

export const isWebApp = () => {
  return !isTauriApp();
};

export const isLiveCloudMode = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('vercel.app') || window.location.hostname.includes('web.app');
};
