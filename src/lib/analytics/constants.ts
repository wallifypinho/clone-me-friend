export const FB_PIXEL_ID = '951061374089610';

export const STORAGE_KEYS = {
  ATTRIBUTION: 'cb_attribution',
  SESSION: 'cb_session',
  BUYER_SCORE: 'cb_buyer_score',
  VISITOR_ID: 'cb_visitor_id',
  EVENT_QUEUE: 'cb_event_queue',
  LEAD_DATA: 'cb_lead_data',
} as const;

export const BUYER_STAGES = {
  COLD: { label: 'frio', min: 0 },
  CURIOUS: { label: 'curioso', min: 10 },
  INTERESTED: { label: 'interessado', min: 25 },
  LEAD: { label: 'lead', min: 50 },
  ALMOST_BUYER: { label: 'quase comprador', min: 80 },
  CHECKOUT_ABANDON: { label: 'abandono de checkout', min: -1 },
  BUYER: { label: 'comprador', min: 150 },
} as const;

export const SCORE_VALUES = {
  PAGE_VIEW_HOME: 2,
  VIEW_OFFER: 5,
  TIME_ON_PAGE: 5,
  CLICK_DETAILS: 8,
  ROUTE_SELECTED: 10,
  PASSENGER_INFO_STARTED: 12,
  PASSENGER_INFO_COMPLETED: 18,
  PAYMENT_SCREEN_VIEWED: 20,
  PAYMENT_LINK_GENERATED: 25,
  PIX_VIEWED: 30,
  PIX_COPIED: 40,
  WHATSAPP_CLICKED: 15,
  CHECKOUT_RESUMED: 20,
  PURCHASE_COMPLETED: 100,
} as const;
