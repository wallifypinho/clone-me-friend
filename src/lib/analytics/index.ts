/**
 * Central Analytics Manager
 * All tracking is invisible — no visual changes.
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
  'InitiateCheckout', 'AddPaymentInfo', 'Purchase',
]);

// Critical events to queue for server-side CAPI
const CAPI_EVENTS = new Set([
  'Purchase', 'Lead', 'InitiateCheckout', 'AddPaymentInfo',
]);

let initialized = false;
const firedEvents = new Set<string>();

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

    const eventId = generateEventId();
    const isStandard = STANDARD_FB_EVENTS.has(eventName);

    // Fire pixel
    sendToMetaPixel(eventName, { ...params, event_id: eventId }, isStandard);

    // Save to internal DB (fire and forget)
    saveEventToDb(eventName, eventId, params);

    // Queue for CAPI if critical
    if (CAPI_EVENTS.has(eventName)) {
      const leadData = this.getLeadData();
      queueServerEvent(eventName, eventId, leadData, params);
    }
  },

  updateScore(action: keyof typeof SCORE_VALUES) {
    return updateBuyerScore(action);
  },

  identifyLead(data: { nome?: string; email?: string; cpf?: string; whatsapp?: string; reservation_code?: string }) {
    try {
      const existing = this.getLeadData();
      const merged = { ...existing, ...data };
      localStorage.setItem(STORAGE_KEYS.LEAD_DATA, JSON.stringify(merged));
    } catch {}
  },

  getLeadData(): Record<string, any> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LEAD_DATA);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
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
