import { STORAGE_KEYS, BUYER_STAGES, SCORE_VALUES } from './constants';

export type BuyerStage = 'frio' | 'curioso' | 'interessado' | 'lead' | 'quase comprador' | 'abandono de checkout' | 'comprador';

interface ScoreData {
  score: number;
  stage: BuyerStage;
  checkoutStarted: boolean;
  checkoutAbandoned: boolean;
  actions: string[];
}

function getScoreData(): ScoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUYER_SCORE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { score: 0, stage: 'frio', actions: [], checkoutStarted: false, checkoutAbandoned: false };
}

function calculateStage(data: ScoreData): BuyerStage {
  if (data.score >= BUYER_STAGES.BUYER.min) return 'comprador';
  if (data.checkoutAbandoned && !data.actions.includes('PURCHASE_COMPLETED')) return 'abandono de checkout';
  if (data.score >= BUYER_STAGES.ALMOST_BUYER.min) return 'quase comprador';
  if (data.score >= BUYER_STAGES.LEAD.min) return 'lead';
  if (data.score >= BUYER_STAGES.INTERESTED.min) return 'interessado';
  if (data.score >= BUYER_STAGES.CURIOUS.min) return 'curioso';
  return 'frio';
}

export function updateBuyerScore(action: keyof typeof SCORE_VALUES): { score: number; stage: BuyerStage } {
  const data = getScoreData();
  const points = SCORE_VALUES[action];
  data.score += points;
  data.actions.push(action);

  if (action === 'PAYMENT_SCREEN_VIEWED' || action === 'PASSENGER_INFO_STARTED') {
    data.checkoutStarted = true;
  }

  data.stage = calculateStage(data);
  localStorage.setItem(STORAGE_KEYS.BUYER_SCORE, JSON.stringify(data));
  return { score: data.score, stage: data.stage };
}

export function markCheckoutAbandoned(): void {
  const data = getScoreData();
  if (data.checkoutStarted) {
    data.checkoutAbandoned = true;
    data.stage = calculateStage(data);
    localStorage.setItem(STORAGE_KEYS.BUYER_SCORE, JSON.stringify(data));
  }
}

export function markCheckoutResumed(): void {
  const data = getScoreData();
  if (data.checkoutAbandoned) {
    data.checkoutAbandoned = false;
    data.score += SCORE_VALUES.CHECKOUT_RESUMED;
    data.stage = calculateStage(data);
    localStorage.setItem(STORAGE_KEYS.BUYER_SCORE, JSON.stringify(data));
  }
}

export function getBuyerScore(): { score: number; stage: BuyerStage } {
  const data = getScoreData();
  return { score: data.score, stage: data.stage };
}
