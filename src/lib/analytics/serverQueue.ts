import { STORAGE_KEYS } from './constants';

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
}

export function getQueuedEvents(): ServerEvent[] {
  return getQueue();
}

export function clearQueuedEvents(): void {
  localStorage.removeItem(STORAGE_KEYS.EVENT_QUEUE);
}
