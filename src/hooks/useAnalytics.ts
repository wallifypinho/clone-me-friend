import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import type { SCORE_VALUES } from '@/lib/analytics/constants';

/**
 * Hook that initializes analytics and tracks page views on route change.
 * Also provides scroll depth and time-on-page tracking.
 */
export function useAnalyticsInit() {
  const location = useLocation();
  const lastPath = useRef('');
  const pageEntryTime = useRef(Date.now());
  const maxScroll = useRef(0);

  // Initialize once
  useEffect(() => {
    analytics.init();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      // Send time-on-page for previous page
      if (lastPath.current) {
        const timeSpent = Math.round((Date.now() - pageEntryTime.current) / 1000);
        if (timeSpent >= 5) {
          analytics.updateScore('TIME_ON_PAGE');
        }
      }

      lastPath.current = location.pathname;
      pageEntryTime.current = Date.now();
      maxScroll.current = 0;

      analytics.trackEvent('PageView', {
        page: location.pathname,
        search: location.search,
      });
    }
  }, [location]);

  // Scroll depth tracking (throttled)
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollPct = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        if (scrollPct > maxScroll.current) {
          maxScroll.current = scrollPct;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // PageExit removed — it generated noise in Meta without analytical value
}

/**
 * Hook for tracking specific events in components.
 */
export function useTrackEvent() {
  return useCallback((eventName: string, params: Record<string, any> = {}) => {
    analytics.trackEvent(eventName, params);
  }, []);
}

export function useUpdateScore() {
  return useCallback((action: keyof typeof SCORE_VALUES) => {
    analytics.updateScore(action);
  }, []);
}
