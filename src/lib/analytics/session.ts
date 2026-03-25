import { STORAGE_KEYS } from './constants';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export function getVisitorId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
  if (!id) {
    id = 'v_' + generateId();
    localStorage.setItem(STORAGE_KEYS.VISITOR_ID, id);
  }
  return id;
}

export function getSessionId(): string {
  let id = sessionStorage.getItem(STORAGE_KEYS.SESSION);
  if (!id) {
    id = 's_' + generateId();
    sessionStorage.setItem(STORAGE_KEYS.SESSION, id);
  }
  return id;
}

export function generateEventId(): string {
  return 'evt_' + generateId();
}

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet';

  let browser = 'unknown';
  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Edge/i.test(ua)) browser = 'Edge';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';

  let os = 'unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';

  return {
    device_type: deviceType,
    browser,
    os,
    language: navigator.language || 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    screen_resolution: `${screen.width}x${screen.height}`,
  };
}
