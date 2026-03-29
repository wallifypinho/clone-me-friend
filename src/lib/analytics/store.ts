import { supabase } from '@/integrations/supabase/client';
import { getSessionId, getVisitorId } from './session';
import { getAttributionData } from './attribution';
import { getBuyerScore } from './buyerScore';
import { STORAGE_KEYS } from './constants';

let sessionSaved = false;

export async function saveSessionToDb(): Promise<void> {
  if (sessionSaved) return;
  sessionSaved = true;

  const attr = getAttributionData();
  if (!attr) return;

  const { score, stage } = getBuyerScore();

  try {
    await (supabase.from('visitor_sessions' as any) as any).insert({
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      first_visit_at: attr.first_visit_at,
      last_interaction_at: attr.last_interaction_at,
      landing_page: attr.landing_page,
      referrer: attr.referrer,
      utm_source: attr.utm_source || null,
      utm_medium: attr.utm_medium || null,
      utm_campaign: attr.utm_campaign || null,
      utm_content: attr.utm_content || null,
      utm_term: attr.utm_term || null,
      campaign_name: attr.campaign_name || null,
      campaign_id: attr.campaign_id || null,
      adset_name: attr.adset_name || null,
      adset_id: attr.adset_id || null,
      ad_name: attr.ad_name || null,
      ad_id: attr.ad_id || null,
      placement: attr.placement || null,
      fbclid: attr.fbclid || null,
      gclid: attr.gclid || null,
      fbc: attr.fbc || null,
      fbp: attr.fbp || null,
      device_type: attr.device_type || null,
      browser: attr.browser || null,
      os: attr.os || null,
      language: attr.language || null,
      timezone: attr.timezone || null,
      buyer_score: score,
      buyer_stage: stage,
      screen_resolution: attr.screen_resolution || null,
    });
  } catch (e) {
    console.warn('[analytics] session save failed', e);
  }
}

export async function saveEventToDb(
  eventName: string,
  eventId: string,
  params: Record<string, any> = {}
): Promise<void> {
  try {
    const { score, stage } = getBuyerScore();
    let leadId = params.lead_id || null;
    let reservationCode = params.reservation_code || null;

    if (!leadId || !reservationCode) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.LEAD_DATA);
        if (raw) {
          const ld = JSON.parse(raw);
          if (!leadId) leadId = ld.lead_id || null;
          if (!reservationCode) reservationCode = ld.reservation_code || null;
        }
      } catch {}
    }

    await (supabase.from('visitor_events' as any) as any).insert({
      event_id: eventId,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      lead_id: leadId,
      reservation_code: reservationCode,
      event_name: eventName,
      page_url: window.location.pathname,
      payload_json: params,
      buyer_score: score,
      buyer_stage: stage,
    });
  } catch (e) {
    console.warn('[analytics] event save failed', e);
  }
}

export async function saveOrderAttribution(orderData: {
  order_id: string;
  reservation_code: string;
  lead_id?: string;
  purchase_value: number;
}): Promise<void> {
  const attr = getAttributionData();
  if (!attr) return;

  let leadId = orderData.lead_id || null;
  if (!leadId) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LEAD_DATA);
      if (raw) {
        const ld = JSON.parse(raw);
        leadId = ld.lead_id || null;
      }
    } catch {}
  }

  const { score } = getBuyerScore();

  try {
    await (supabase.from('orders_attribution' as any) as any).insert({
      order_id: orderData.order_id,
      session_id: getSessionId(),
      lead_id: leadId,
      reservation_code: orderData.reservation_code,
      first_touch_source: attr.utm_source || attr.referrer || 'direct',
      last_touch_source: attr.utm_source || 'direct',
      campaign_name: attr.campaign_name || null,
      campaign_id: attr.campaign_id || null,
      adset_name: attr.adset_name || null,
      adset_id: attr.adset_id || null,
      ad_name: attr.ad_name || null,
      ad_id: attr.ad_id || null,
      placement: attr.placement || null,
      purchase_value: orderData.purchase_value,
      buyer_score: score,
      utm_source: attr.utm_source || null,
      utm_medium: attr.utm_medium || null,
      utm_campaign: attr.utm_campaign || null,
      utm_content: attr.utm_content || null,
      utm_term: attr.utm_term || null,
      fbclid: attr.fbclid || null,
      gclid: attr.gclid || null,
      fbc: attr.fbc || null,
      fbp: attr.fbp || null,
      landing_page: attr.landing_page || null,
      referrer: attr.referrer || null,
      first_visit_at: attr.first_visit_at || null,
    });
  } catch (e) {
    console.warn('[analytics] order attribution save failed', e);
  }
}