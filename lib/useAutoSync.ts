'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoSyncOptions {
  /**
   * Interval in milliseconds for periodic background refresh.
   * Default: 30000 (30 seconds). Set to 0 or null to disable.
   */
  intervalMs?: number | null;
  /**
   * Whether to enable periodic polling. Default: true.
   */
  enableInterval?: boolean;
  /**
   * Whether to trigger refetch when window / tab regains focus. Default: true.
   */
  enableFocus?: boolean;
}

export function useAutoSync(
  fetchFn: (silent?: boolean) => Promise<unknown> | unknown,
  options: AutoSyncOptions = {}
) {
  const { intervalMs = 30000, enableInterval = true, enableFocus = true } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const triggerRefresh = useCallback(async (silent = true) => {
    try {
      setIsRefreshing(true);
      await fetchRef.current(silent);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('AutoSync refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 1. Refetch whenever the browser tab / window regains focus
  useEffect(() => {
    if (!enableFocus) return;

    let lastFocusTime = Date.now();

    const handleFocus = () => {
      // Debounce window focus events (avoid double trigger within 2 seconds)
      const now = Date.now();
      if (now - lastFocusTime > 2000) {
        lastFocusTime = now;
        triggerRefresh(true);
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastFocusTime > 2000) {
          lastFocusTime = now;
          triggerRefresh(true);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableFocus, triggerRefresh]);

  // 2. Periodic background polling interval (every 30 seconds by default)
  useEffect(() => {
    if (!enableInterval || !intervalMs || intervalMs <= 0) return;

    const interval = setInterval(() => {
      // Only poll when the tab is currently active/visible to be lightweight and battery-friendly
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        triggerRefresh(true);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enableInterval, intervalMs, triggerRefresh]);

  return { isRefreshing, lastUpdated, triggerRefresh };
}
