import { useAnalyticsInit } from '@/hooks/useAnalytics';

/**
 * Invisible analytics provider — renders nothing.
 * Must be placed inside BrowserRouter.
 */
const AnalyticsProvider = () => {
  useAnalyticsInit();
  return null;
};

export default AnalyticsProvider;
