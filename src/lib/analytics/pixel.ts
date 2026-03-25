import { FB_PIXEL_ID } from './constants';
import { generateEventId, getSessionId } from './session';
import { getAttributionData } from './attribution';
import { getBuyerScore } from './buyerScore';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

let pixelInitialized = false;

export function initPixel(): void {
  if (pixelInitialized) return;
  pixelInitialized = true;

  // Remove old pixel if any and re-init with new ID
  if (!window.fbq) {
    const n: any = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = document.createElement('script');
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const s = document.getElementsByTagName('script')[0];
    s.parentNode?.insertBefore(t, s);
  }

  window.fbq('init', FB_PIXEL_ID);
}

function getCommonParams(): Record<string, any> {
  const attr = getAttributionData();
  const { score, stage } = getBuyerScore();
  return {
    session_id: getSessionId(),
    buyer_score: score,
    buyer_stage: stage,
    traffic_source: attr?.utm_source || '',
    campaign_name: attr?.campaign_name || '',
    campaign_id: attr?.campaign_id || '',
    adset_name: attr?.adset_name || '',
    adset_id: attr?.adset_id || '',
    ad_name: attr?.ad_name || '',
    ad_id: attr?.ad_id || '',
    placement: attr?.placement || '',
    device_type: attr?.device_type || '',
  };
}

export function sendToMetaPixel(
  eventName: string,
  params: Record<string, any> = {},
  isStandard = false
): string {
  const eventId = params.event_id || generateEventId();
  const merged = { ...getCommonParams(), ...params, event_id: eventId };

  if (window.fbq) {
    if (isStandard) {
      window.fbq('track', eventName, merged, { eventID: eventId });
    } else {
      window.fbq('trackCustom', eventName, merged, { eventID: eventId });
    }
  }

  return eventId;
}
