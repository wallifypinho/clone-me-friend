import { STORAGE_KEYS } from './constants';
import { supabase } from '@/integrations/supabase/client';

interface ServerEvent {
  event_name: string;
  event_id: string;
  event_time: number;
  user_data: Record<string, any>;
  custom_data: Record<string, any>;
}

function getQueue(): ServerEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENT_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(q: ServerEvent[]): void {
  // Keep max 100 events
  localStorage.setItem(STORAGE_KEYS.EVENT_QUEUE, JSON.stringify(q.slice(-100)));
}

export function queueServerEvent(
  eventName: string,
  eventId: string,
  userData: Record<string, any> = {},
  customData: Record<string, any> = {}
): void {
  const q = getQueue();
  q.push({
    event_name: eventName,
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: userData,
    custom_data: customData,
  });
  saveQueue(q);

  // Auto-flush after queueing
  flushQueue();
}

export function getQueuedEvents(): ServerEvent[] {
  return getQueue();
}

export function clearQueuedEvents(): void {
  localStorage.removeItem(STORAGE_KEYS.EVENT_QUEUE);
}

let flushing = false;

/**
 * Flush queued CAPI events to the meta-capi edge function.
 * Uses the same event_id for browser/server deduplication.
 */
export async function flushQueue(): Promise<void> {
  if (flushing) return;
  const queue = getQueue();
  if (queue.length === 0) return;

  flushing = true;

  try {
    // Format events for meta-capi edge function
    const events = queue.map((evt) => {
      const { event_name, event_id, event_time, user_data, custom_data } = evt;

      // Build user_data for CAPI (hash happens server-side in meta-capi)
      const capiUserData: Record<string, any> = {};
      if (user_data.email) capiUserData.em = user_data.email;
      if (user_data.whatsapp || user_data.phone) {
        const phone = (user_data.whatsapp || user_data.phone || '').replace(/\D/g, '');
        if (phone) capiUserData.ph = phone.startsWith('55') ? phone : `55${phone}`;
      }
      if (user_data.nome || user_data.name) {
        const fullName = user_data.nome || user_data.name || '';
        const names = fullName.trim().split(/\s+/);
        if (names[0]) capiUserData.fn = names[0];
        if (names.length > 1) capiUserData.ln = names[names.length - 1];
      }

      // Add _fbc and _fbp if available
      if (user_data.fbc || custom_data.fbc) capiUserData.fbc = user_data.fbc || custom_data.fbc;
      if (user_data.fbp || custom_data.fbp) capiUserData.fbp = user_data.fbp || custom_data.fbp;

      // Client IP and UA will be added by the edge function
      capiUserData.client_user_agent = navigator.userAgent;

      return {
        event_name,
        event_id,
        event_time,
        event_source_url: window.location.href,
        user_data: capiUserData,
        custom_data: {
          value: custom_data.value || custom_data.amount || undefined,
          currency: custom_data.currency || 'BRL',
          content_name: custom_data.content_name || undefined,
          order_id: custom_data.order_id || undefined,
          reservation_code: custom_data.reservation_code || undefined,
        },
      };
    });

    const { error } = await supabase.functions.invoke('meta-capi', {
      body: { events },
    });

    if (error) {
      console.warn('[CAPI] Flush failed:', error);
      // Keep events in queue for retry
      return;
    }

    // Success — clear the queue
    clearQueuedEvents();
    console.log(`[CAPI] Flushed ${events.length} events`);
  } catch (err) {
    console.warn('[CAPI] Flush error:', err);
  } finally {
    flushing = false;
  }
}
