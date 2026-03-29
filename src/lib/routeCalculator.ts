import { CidadeBrasil, findCityByDisplay, findCityByName } from "@/data/cidadesBrasil";
import type { Trip } from "@/data/trips";
import { getFinalFare, ABSOLUTE_MIN_PRICE, applyCommercialRounding } from "@/lib/pricing";
import { getAvailableCompaniesSync, preloadCompanyData, type EligibleCompany } from "@/lib/companyRouting";

// Pre-warm company cache on module load
preloadCompanyData();

// ─── Haversine ───────────────────────────────────────────────
const EARTH_RADIUS_KM = 6371;
const ROAD_FACTOR = 1.20; // +20% para rodovias vs linha reta

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function roadDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  return Math.round(haversineDistance(lat1, lon1, lat2, lon2) * ROAD_FACTOR);
}

// ─── Cache local (evita recalcular) ─────────────────────────
const distanceCache = new Map<string, number>();

function getCacheKey(a: CidadeBrasil, b: CidadeBrasil): string {
  return `${a.codigoIbge}-${b.codigoIbge}`;
}

export function getDistance(origin: CidadeBrasil, dest: CidadeBrasil): number {
  const key = getCacheKey(origin, dest);
  if (distanceCache.has(key)) return distanceCache.get(key)!;
  const dist = roadDistance(origin.latitude, origin.longitude, dest.latitude, dest.longitude);
  distanceCache.set(key, dist);
  distanceCache.set(getCacheKey(dest, origin), dist);
  return dist;
}

// ─── Tempo de viagem ─────────────────────────────────────────
const AVERAGE_SPEED_KMH = 70;

export function travelTimeMinutes(distKm: number): number {
  const baseMinutes = (distKm / AVERAGE_SPEED_KMH) * 60;
  const hours = distKm / AVERAGE_SPEED_KMH;

  // Paradas
  let stopMinutes = 0;
  if (hours > 16) stopMinutes = 90;
  else if (hours > 8) stopMinutes = 40;
  else if (hours > 4) stopMinutes = 20;

  return Math.round(baseMinutes + stopMinutes);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? String(m).padStart(2, "0") : "00"}`;
}

// ─── Preço dinâmico (delegado ao motor de precificação v2) ───
interface BusCompany {
  name: string;
  logo: string;
}

const COMPANIES: BusCompany[] = [
  { name: "Andorinha", logo: "🚌" },
  { name: "Caiçara", logo: "🚍" },
  { name: "Viação Garcia", logo: "🚎" },
  { name: "Brasil Sul", logo: "🚐" },
  { name: "Kaissara", logo: "🚌" },
  { name: "Águia Branca", logo: "🚍" },
  { name: "Auto Viação 1001", logo: "🚎" },
  { name: "Boa Esperança", logo: "🚐" },
  { name: "Catedral Turismo", logo: "🚌" },
];

// ─── Geração de horários ─────────────────────────────────────
function generateDepartures(distKm: number): string[] {
  const travelHours = distKm / AVERAGE_SPEED_KMH;
  
  // Intervalo baseado na distância
  let intervalMin: number;
  if (distKm < 200) intervalMin = 60;
  else if (distKm < 500) intervalMin = 90;
  else if (distKm < 1000) intervalMin = 120;
  else intervalMin = 180;

  const departures: string[] = [];
  const startHour = 6; // 06:00
  const endHour = 23;  // 23:00

  for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += intervalMin) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    departures.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  // Viagens longas: adicionar noturnas
  if (travelHours > 6) {
    departures.push("22:30", "23:00");
  }

  // Remover duplicatas e ordenar
  return [...new Set(departures)].sort();
}

// ─── Tipos de assento por empresa ────────────────────────────
function getSeatTypes(distKm: number): string[] {
  if (distKm < 150) return ["Convencional", "Semi-Leito"];
  if (distKm < 400) return ["Convencional", "Semi-Leito", "Leito"];
  return ["Semi-Leito", "Leito", "Leito Cama"];
}

// ─── Geração dinâmica de viagens ─────────────────────────────
export function generateDynamicTrips(originStr: string, destStr: string): Trip[] {
  // Tentar encontrar as cidades na base
  const originCity = findCityByDisplay(originStr) || findCityByName(originStr);
  const destCity = findCityByDisplay(destStr) || findCityByName(destStr);

  if (!originCity || !destCity) {
    // Fallback: se não encontrar, retorna vazio (o sistema antigo pode complementar)
    return [];
  }

  if (originCity.codigoIbge === destCity.codigoIbge) {
    return [];
  }

  const distKm = getDistance(originCity, destCity);
  const travelMin = travelTimeMinutes(distKm);
  const duration = formatDuration(travelMin);
  const departures = generateDepartures(distKm);
  const seatTypes = getSeatTypes(distKm);

  const trips: Trip[] = [];

  // Gerar combinações empresa × horário × tipo de assento
  // Limitar para não ter excesso
  const maxTrips = 12;
  let count = 0;

  for (const dep of departures) {
    if (count >= maxTrips) break;

    // Selecionar empresa (rotacionar)
    const company = COMPANIES[count % COMPANIES.length];
    // Selecionar tipo de assento (rotacionar)
    const seatType = seatTypes[count % seatTypes.length];

    // Usar novo motor de precificação v2
    const fareResult = getFinalFare({
      distanceKm: distKm,
      originState: originCity.estado,
      destState: destCity.estado,
      busCategory: seatType,
      seatPosition: "comum",
      origin: originCity.nome,
      destination: destCity.nome,
    });
    const price = fareResult.finalPrice;

    // Calcular horário de chegada
    const depH = parseInt(dep.split(":")[0]);
    const depM = parseInt(dep.split(":")[1]);
    const totalArrMin = depH * 60 + depM + travelMin;
    const arrH = Math.floor(totalArrMin / 60) % 24;
    const arrM = totalArrMin % 60;
    const arrival = `${String(arrH).padStart(2, "0")}:${String(arrM).padStart(2, "0")}`;

    // Simular assentos restantes
    const seatsLeft = count === 0 ? 5 : count === 3 ? 4 : count === 7 ? 3 : undefined;

    trips.push({
      company: company.name,
      companyLogo: company.logo,
      departure: dep,
      arrival,
      duration,
      origin: originCity.nome,
      destination: destCity.nome,
      seatType,
      originalPrice: price,
      discountedPrice: applyCommercialRounding(price / 2),
      seatsLeft,
      soldOut: false,
    });

    count++;
  }

  return trips;
}
