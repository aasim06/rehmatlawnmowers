/**
 * Platform Detection Utility
 * Detects whether the current environment is running inside a Tauri desktop window
 * or inside a regular web browser (e.g., hosted on Vercel).
 */

export const isTauriApp = () => {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);
};

export const isWebApp = () => {
  return !isTauriApp();
};
