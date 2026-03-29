import { STORAGE_KEYS } from './constants';
import { getSessionId, getDeviceInfo } from './session';

export interface AttributionData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
  gclid: string;
  fbc: string;
  fbp: string;
  referrer: string;
  landing_page: string;
  first_visit_at: string;
  last_interaction_at: string;
  session_id: string;
  // Parsed Facebook UTM fields
  campaign_name: string;
  campaign_id: string;
  adset_name: string;
  adset_id: string;
  ad_name: string;
  ad_id: string;
  placement: string;
  // Device
  device_type: string;
  browser: string;
  os: string;
  language: string;
  timezone: string;
  screen_resolution: string;
}

function parsePipeField(value: string): { name: string; id: string } {
  if (!value) return { name: '', id: '' };
  const idx = value.lastIndexOf('|');
  if (idx === -1) return { name: value, id: '' };
  return { name: value.substring(0, idx).trim(), id: value.substring(idx + 1).trim() };
}

/** Read a cookie value by name */
function getCookie(name: string): string {
  try {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  } catch {
    return '';
  }
}

/**
 * Build _fbc from fbclid if cookie not present.
 * Format: fb.1.<creation_time>.<fbclid>
 */
function buildFbc(fbclid: string): string {
  if (!fbclid) return '';
  return `fb.1.${Date.now()}.${fbclid}`;
}

export function captureAttribution(): AttributionData {
  const params = new URLSearchParams(window.location.search);
  const device = getDeviceInfo();

  const utmCampaign = params.get('utm_campaign') || '';
  const utmMedium = params.get('utm_medium') || '';
  const utmContent = params.get('utm_content') || '';
  const utmTerm = params.get('utm_term') || '';
  const fbclid = params.get('fbclid') || '';

  const campaign = parsePipeField(utmCampaign);
  const adset = parsePipeField(utmMedium);
  const ad = parsePipeField(utmContent);

  // Capture _fbc and _fbp from cookies
  const fbcCookie = getCookie('_fbc');
  const fbpCookie = getCookie('_fbp');
  const fbc = fbcCookie || (fbclid ? buildFbc(fbclid) : '');
  const fbp = fbpCookie || '';

  // utm_term contains {{placement}} from Facebook template
  const placement = utmTerm;

  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    fbclid,
    gclid: params.get('gclid') || '',
    fbc,
    fbp,
    referrer: document.referrer || '',
    landing_page: window.location.pathname + window.location.search,
    first_visit_at: new Date().toISOString(),
    last_interaction_at: new Date().toISOString(),
    session_id: getSessionId(),
    campaign_name: campaign.name,
    campaign_id: campaign.id,
    adset_name: adset.name,
    adset_id: adset.id,
    ad_name: ad.name,
    ad_id: ad.id,
    placement,
    ...device,
  };
}

export function persistAttribution(): AttributionData {
  const existing = getAttributionData();
  const current = captureAttribution();

  // Only overwrite if we have new UTM params or fbclid
  const hasNewUtm = current.utm_source || current.fbclid || current.gclid;

  if (existing && !hasNewUtm) {
    // Update last interaction, session, and cookies (may change between visits)
    existing.last_interaction_at = new Date().toISOString();
    existing.session_id = current.session_id;
    // Always refresh cookie values
    if (current.fbc) existing.fbc = current.fbc;
    if (current.fbp) existing.fbp = current.fbp;
    localStorage.setItem(STORAGE_KEYS.ATTRIBUTION, JSON.stringify(existing));
    return existing;
  }

  const merged: AttributionData = existing
    ? {
        ...existing,
        ...(hasNewUtm ? current : {}),
        first_visit_at: existing.first_visit_at,
        last_interaction_at: new Date().toISOString(),
        session_id: current.session_id,
        // Always use latest cookie values
        fbc: current.fbc || existing.fbc,
        fbp: current.fbp || existing.fbp,
      }
    : current;

  localStorage.setItem(STORAGE_KEYS.ATTRIBUTION, JSON.stringify(merged));
  return merged;
}

export function getAttributionData(): AttributionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTRIBUTION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function updateLastInteraction(): void {
  const data = getAttributionData();
  if (data) {
    data.last_interaction_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.ATTRIBUTION, JSON.stringify(data));
  }
}