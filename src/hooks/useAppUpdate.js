import { useState, useEffect, useCallback } from 'react';

// Built-in build time timestamp injected at build time
const LOCAL_BUILD_TIME = typeof __APP_BUILD_TIME__ !== 'undefined' ? Number(__APP_BUILD_TIME__) : Date.now();

export function useAppUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [checking, setChecking] = useState(false);
  const [remoteInfo, setRemoteInfo] = useState(null);

  const checkForUpdate = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      setChecking(true);
      const url = `https://rehmatlawnmowers.vercel.app/version.json?_t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const remoteBuildTime = Number(data.buildTime);
        // If remote build is newer by at least 15 seconds
        if (remoteBuildTime && remoteBuildTime > LOCAL_BUILD_TIME + 15000) {
          setHasUpdate(true);
          setRemoteInfo(data);
        } else {
          setHasUpdate(false);
        }
      }
    } catch (err) {
      // Offline or network error - silent
    } finally {
      setChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    setChecking(true);
    try {
      // 1. Tell Service Worker to activate new version
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      // 2. Clear old browser caches to ensure 100% fresh assets
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}

    // 3. Force reload with cache-busting timestamp
    const ts = Date.now();
    window.location.href = `https://rehmatlawnmowers.vercel.app/?platform=tauri&_v=${ts}`;
  }, []);

  useEffect(() => {
    // Check 3 seconds after mount so startup is 100% instant
    const timer = setTimeout(() => {
      checkForUpdate();
    }, 3000);

    // Periodic check every 2 minutes
    const interval = setInterval(checkForUpdate, 120000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkForUpdate]);

  return {
    hasUpdate,
    checking,
    remoteInfo,
    checkForUpdate,
    applyUpdate
  };
}
