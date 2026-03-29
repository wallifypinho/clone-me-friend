/**
 * Central Analytics Manager
 * All tracking is invisible — no visual changes.
 * Every event is auto-enriched with the full chain:
 * session_id → lead_id → reservation_code → order_id + attribution
 */

import { persistAttribution, getAttributionData, updateLastInteraction } from './attribution';
import { getSessionId, getVisitorId, generateEventId } from './session';
import { updateBuyerScore, getBuyerScore, markCheckoutAbandoned, markCheckoutResumed, type BuyerStage } from './buyerScore';
import { initPixel, sendToMetaPixel } from './pixel';
import { queueServerEvent } from './serverQueue';
import { saveSessionToDb, saveEventToDb, saveOrderAttribution } from './store';
import { STORAGE_KEYS } from './constants';
import type { SCORE_VALUES } from './constants';

// Standard FB events that use 'track' instead of 'trackCustom'
const STANDARD_FB_EVENTS = new Set([
  'PageView', 'ViewContent', 'Search', 'Lead',
  'AddToCart', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase',
]);

// Custom events that should be sent to Meta pixel as trackCustom (for audiences/analysis)
const META_CUSTOM_EVENTS = new Set([
  'PixViewed', 'PixCopied', 'ReservationViewed',
  'PaymentScreenViewed', 'PaymentGenerated', 'PaymentPending',
  'CheckoutAbandoned', 'CheckoutResumed',
]);

// Internal-only events: saved to DB but NOT sent to Meta pixel
// (OrderCreated, ReservationCreated, PaymentLinkGenerated, OrderPaid,
//  RouteSelected, SeatConfirmed, PassengerInfoStarted, PassengerInfoCompleted,
//  TicketDownloaded, PurchaseConfirmed)

// Critical events to queue for server-side CAPI
const CAPI_EVENTS = new Set([
  'Purchase', 'Lead', 'InitiateCheckout', 'AddPaymentInfo', 'AddToCart',
]);

let initialized = false;
const firedEvents = new Set<string>();

/**
 * Get the full journey chain from localStorage.
 * This auto-enriches every event with connected IDs.
 */
function getJourneyChain(): Record<string, any> {
  const attr = getAttributionData();
  const leadData = getLeadDataInternal();
  const { score, stage } = getBuyerScore();

  return {
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
    lead_id: leadData?.lead_id || null,
    reservation_code: leadData?.reservation_code || null,
    order_id: leadData?.order_id || null,
    buyer_score: score,
    buyer_stage: stage,
    // Attribution
    utm_source: attr?.utm_source || null,
    utm_medium: attr?.utm_medium || null,
    utm_campaign: attr?.utm_campaign || null,
    utm_content: attr?.utm_content || null,
    utm_term: attr?.utm_term || null,
    fbclid: attr?.fbclid || null,
    gclid: attr?.gclid || null,
    fbc: attr?.fbc || null,
    fbp: attr?.fbp || null,
    campaign_name: attr?.campaign_name || null,
    campaign_id: attr?.campaign_id || null,
    adset_name: attr?.adset_name || null,
    adset_id: attr?.adset_id || null,
    ad_name: attr?.ad_name || null,
    ad_id: attr?.ad_id || null,
    placement: attr?.placement || null,
  };
}

function getLeadDataInternal(): Record<string, any> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAD_DATA);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const analytics = {
  init() {
    if (initialized) return;
    initialized = true;
    initPixel();
    persistAttribution();
    saveSessionToDb();
    // Track initial PageView
    this.trackEvent('PageView');
  },

  trackEvent(eventName: string, params: Record<string, any> = {}) {
    // Dedup: same event+page combo within session
    const dedupKey = `${eventName}:${window.location.pathname}:${params.reservation_code || ''}`;
    if (firedEvents.has(dedupKey) && eventName !== 'PageView') return;
    firedEvents.add(dedupKey);

    updateLastInteraction();

    const eventId = params.event_id || generateEventId();
    const isStandard = STANDARD_FB_EVENTS.has(eventName);
    const isMetaCustom = META_CUSTOM_EVENTS.has(eventName);

    // Auto-enrich with journey chain — explicit params override auto values
    const chain = getJourneyChain();
    const enriched = { ...chain, ...params, event_id: eventId };

    // Fire pixel ONLY for standard events and approved custom events
    // Internal events (OrderCreated, ReservationCreated, etc.) are DB-only
    if (isStandard || isMetaCustom) {
      sendToMetaPixel(eventName, enriched, isStandard);
    }

    // Save to internal DB (fire and forget) — all events
    saveEventToDb(eventName, eventId, enriched);

    // Queue for CAPI if critical (standard conversion events only)
    if (CAPI_EVENTS.has(eventName)) {
      const leadData = this.getLeadData();
      const fbc = (enriched as any).fbc || null;
      const fbp = (enriched as any).fbp || null;
      queueServerEvent(eventName, eventId, { ...leadData, fbc, fbp }, enriched);
    }
  },

  updateScore(action: keyof typeof SCORE_VALUES) {
    const result = updateBuyerScore(action);
    // Sync score to session in DB (fire and forget)
    import('@/lib/entities').then(({ updateSessionScore }) => {
      updateSessionScore(getSessionId(), result.score);
    }).catch(() => {});
    return result;
  },

  identifyLead(data: { nome?: string; email?: string; cpf?: string; whatsapp?: string; reservation_code?: string; order_id?: string }) {
    try {
      const existing = this.getLeadData();
      const merged = { ...existing, ...data };
      localStorage.setItem(STORAGE_KEYS.LEAD_DATA, JSON.stringify(merged));
    } catch {}
  },

  getLeadData(): Record<string, any> {
    return getLeadDataInternal();
  },

  markCheckoutAbandoned() {
    markCheckoutAbandoned();
    this.trackEvent('CheckoutAbandoned');
  },

  markCheckoutResumed() {
    markCheckoutResumed();
    this.trackEvent('CheckoutResumed');
  },

  saveOrderAttribution: saveOrderAttribution,
  getAttributionData,
  getSessionId,
  getVisitorId,
  getBuyerScore,
};

export type { BuyerStage };
export { getAttributionData, getSessionId, getVisitorId };