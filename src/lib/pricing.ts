/**
 * Motor de precificação de passagens rodoviárias — v2
 * 
 * Fluxo: distância → faixa → base → multiplicadores → limites → manual → arredondamento
 * 
 * Para editar valores futuramente, altere as constantes exportadas abaixo.
 */

// ─── A) Faixas de distância ─────────────────────────────────
export interface DistanceBand {
  minKm: number;
  maxKm: number;       // Infinity para última faixa
  floorPrice: number;  // piso em R$
  pricePerKm: number;  // R$/km
}

export const DISTANCE_BANDS: DistanceBand[] = [
  { minKm: 0,    maxKm: 50,   floorPrice: 24.90,  pricePerKm: 0.45 },
  { minKm: 51,   maxKm: 100,  floorPrice: 34.90,  pricePerKm: 0.40 },
  { minKm: 101,  maxKm: 300,  floorPrice: 59.90,  pricePerKm: 0.35 },
  { minKm: 301,  maxKm: 600,  floorPrice: 89.90,  pricePerKm: 0.30 },
  { minKm: 601,  maxKm: 1000, floorPrice: 149.90, pricePerKm: 0.28 },
  { minKm: 1001, maxKm: 1600, floorPrice: 239.90, pricePerKm: 0.25 },
  { minKm: 1601, maxKm: 2200, floorPrice: 329.90, pricePerKm: 0.23 },
  { minKm: 2201, maxKm: Infinity, floorPrice: 399.90, pricePerKm: 0.22 },
];

// ─── C) Multiplicadores por tipo de rota ─────────────────────
export const ROUTE_TYPE_MULTIPLIERS: Record<string, number> = {
  intermunicipal: 1.00,
  interestadual: 1.18,
};

// ─── D) Multiplicadores por categoria do ônibus ──────────────
// Chaves normalizadas + mapeamento de nomes legados
export const BUS_CATEGORY_MULTIPLIERS: Record<string, number> = {
  convencional: 1.00,
  "semi-leito": 1.12,
  semi_leito: 1.12,
  "Semi-Leito": 1.12,
  leito: 1.25,
  Leito: 1.25,
  leito_cama: 1.38,
  "Leito Cama": 1.38,
  Convencional: 1.00,
};

// ─── E) Multiplicadores por posição do assento ───────────────
export const SEAT_POSITION_MULTIPLIERS: Record<string, number> = {
  comum: 1.00,
  janela: 1.03,
  corredor: 1.00,
  premium: 1.08,
  primeira_fileira: 1.08,
};

// ─── Configuração global ─────────────────────────────────────
/** Preço mínimo absoluto — nenhuma passagem pode custar menos que isso */
export const ABSOLUTE_MIN_PRICE = 19.90;

/** Preço usado quando a distância é desconhecida/inválida */
export const FALLBACK_PRICE = 49.90;

// ─── F/G) Override por rota (preparado para admin futuro) ────
export interface RouteOverride {
  minPrice?: number;
  maxPrice?: number;
  useManualPrice?: boolean;
  manualPrice?: number;
}

// Cache em memória — populável via admin/API futuramente
const routeOverrides = new Map<string, RouteOverride>();

export function setRouteOverride(routeKey: string, override: RouteOverride) {
  routeOverrides.set(routeKey, override);
}

export function getRouteOverride(origin: string, destination: string): RouteOverride | undefined {
  return routeOverrides.get(`${origin}→${destination}`);
}

// ─── Funções modulares ───────────────────────────────────────

/** A) Localiza a faixa de distância */
export function getDistanceBand(distKm: number): DistanceBand {
  const band = DISTANCE_BANDS.find(b => distKm >= b.minKm && distKm <= b.maxKm);
  return band || DISTANCE_BANDS[DISTANCE_BANDS.length - 1];
}

/** B) Calcula preço base (max entre piso e distância × valor/km) */
export function calculateBaseFare(distKm: number): number {
  if (!distKm || distKm <= 0) return FALLBACK_PRICE;
  const band = getDistanceBand(distKm);
  return Math.max(band.floorPrice, distKm * band.pricePerKm);
}

/** Detecta tipo de rota (inter-estadual vs inter-municipal) */
export function detectRouteType(originState?: string, destState?: string): string {
  if (!originState || !destState) return "intermunicipal";
  return originState === destState ? "intermunicipal" : "interestadual";
}

/** C-E) Aplica todos os multiplicadores */
export function applyFareMultipliers(
  baseFare: number,
  routeType: string,
  busCategory: string,
  seatPosition: string = "comum",
): number {
  const routeMult = ROUTE_TYPE_MULTIPLIERS[routeType] ?? 1.00;
  const busMult = BUS_CATEGORY_MULTIPLIERS[busCategory] ?? 1.00;
  const seatMult = SEAT_POSITION_MULTIPLIERS[seatPosition] ?? 1.00;
  return baseFare * routeMult * busMult * seatMult;
}

/** F) Aplica limites min/max da rota */
export function applyRouteLimits(
  price: number,
  override?: RouteOverride,
): number {
  let p = price;
  if (override?.minPrice != null) p = Math.max(p, override.minPrice);
  if (override?.maxPrice != null) p = Math.min(p, override.maxPrice);
  return p;
}

/** H) Arredondamento comercial → final .90 */
export function applyCommercialRounding(price: number): number {
  // Arredonda para cima ao inteiro e subtrai 0.10 → .90
  const intPart = Math.ceil(price);
  // Se já termina em .90, manter
  const rounded = intPart - 0.10;
  // Garantir que não ficou abaixo do original
  return rounded >= price ? rounded : rounded + 1.00;
}

/** Garante preço mínimo absoluto e nunca zero/negativo */
function enforceSafePrice(price: number): number {
  if (!price || price <= 0 || isNaN(price)) return ABSOLUTE_MIN_PRICE;
  return Math.max(price, ABSOLUTE_MIN_PRICE);
}

// ─── Função principal ────────────────────────────────────────

export interface FareInput {
  distanceKm: number;
  originState?: string;
  destState?: string;
  busCategory: string;       // ex: "Semi-Leito", "Leito", "Convencional"
  seatPosition?: string;     // ex: "comum", "janela", "premium"
  origin?: string;
  destination?: string;
}

export interface FareResult {
  finalPrice: number;
  baseFare: number;
  routeType: string;
  bandUsed: DistanceBand;
  wasManual: boolean;
}

/**
 * Calcula o preço final da passagem.
 * Fluxo completo: faixa → base → multiplicadores → limites → manual → arredondamento
 */
export function getFinalFare(input: FareInput): FareResult {
  const { distanceKm, originState, destState, busCategory, seatPosition = "comum", origin, destination } = input;

  const band = getDistanceBand(distanceKm);
  const routeType = detectRouteType(originState, destState);

  // Override por rota
  const override = origin && destination ? getRouteOverride(origin, destination) : undefined;

  // G) Se preço manual ativo, usar diretamente
  if (override?.useManualPrice && override.manualPrice != null && override.manualPrice > 0) {
    const manualRounded = applyCommercialRounding(enforceSafePrice(override.manualPrice));
    return { finalPrice: manualRounded, baseFare: override.manualPrice, routeType, bandUsed: band, wasManual: true };
  }

  // B) Preço base
  const baseFare = calculateBaseFare(distanceKm);

  // C-E) Multiplicadores
  let price = applyFareMultipliers(baseFare, routeType, busCategory, seatPosition);

  // F) Limites da rota
  price = applyRouteLimits(price, override);

  // Segurança
  price = enforceSafePrice(price);

  // H) Arredondamento comercial
  const finalPrice = applyCommercialRounding(price);

  return { finalPrice, baseFare, routeType, bandUsed: band, wasManual: false };
}
