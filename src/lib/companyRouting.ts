/**
 * Company Routing Engine
 * 
 * Responsável APENAS por disponibilidade de companhias por rota.
 * NÃO interfere no motor de precificação (pricing.ts).
 * 
 * Fluxo: origem/destino → classifica rota → filtra companhias → retorna elegíveis
 */

import { supabase } from "@/integrations/supabase/client";
import { CidadeBrasil, findCityByDisplay, findCityByName } from "@/data/cidadesBrasil";
import { haversineDistance } from "@/lib/routeCalculator";

// ─── Tipos ───────────────────────────────────────────────────

export type RouteType = "local" | "metropolitan" | "intermunicipal" | "interstate" | "long_distance";

export interface Company {
  id: string;
  name: string;
  logo: string;
  is_active: boolean;
  accepts_local: boolean;
  accepts_metropolitan: boolean;
  accepts_intermunicipal: boolean;
  accepts_interstate: boolean;
  accepts_long_distance: boolean;
  distance_min_km: number | null;
  distance_max_km: number | null;
  priority: number;
}

export interface CoverageRule {
  id: string;
  company_id: string;
  origin_state: string | null;
  destination_state: string | null;
  origin_city_ibge: string | null;
  destination_city_ibge: string | null;
  rule_type: "allow" | "deny";
  min_distance_km: number | null;
  max_distance_km: number | null;
  priority: number;
}

export interface EligibleCompany {
  name: string;
  logo: string;
  priority: number;
}

// ─── Cache em memória ────────────────────────────────────────

let companiesCache: Company[] | null = null;
let companiesCacheTime = 0;
let rulesCache: CoverageRule[] | null = null;
let rulesCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function isCacheValid(cacheTime: number): boolean {
  return Date.now() - cacheTime < CACHE_TTL_MS;
}

// ─── 1. Classificar tipo de rota ─────────────────────────────

const METROPOLITAN_THRESHOLD_KM = 60;
const LONG_DISTANCE_THRESHOLD_KM = 800;

export function getRouteType(
  origin: CidadeBrasil,
  destination: CidadeBrasil,
  distanceKm: number | null
): RouteType {
  // Mesma cidade
  if (origin.codigoIbge === destination.codigoIbge) return "local";

  const sameState = origin.estado === destination.estado;

  if (sameState) {
    if (distanceKm !== null && distanceKm <= METROPOLITAN_THRESHOLD_KM) {
      return "metropolitan";
    }
    return "intermunicipal";
  }

  // Estados diferentes
  if (distanceKm !== null && distanceKm >= LONG_DISTANCE_THRESHOLD_KM) {
    return "long_distance";
  }
  return "interstate";
}

// ─── 2. Calcular distância (suporte operacional) ─────────────

const ROAD_FACTOR = 1.20;

export function calculateRouteDistance(
  origin: CidadeBrasil,
  destination: CidadeBrasil
): number | null {
  if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
    return null;
  }
  const straight = haversineDistance(
    origin.latitude, origin.longitude,
    destination.latitude, destination.longitude
  );
  return Math.round(straight * ROAD_FACTOR);
}

// ─── 3. Carregar dados do DB ─────────────────────────────────

async function loadCompanies(): Promise<Company[]> {
  if (companiesCache && isCacheValid(companiesCacheTime)) {
    return companiesCache;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error || !data) {
    console.error("[CompanyRouting] Failed to load companies:", error?.message);
    return companiesCache ?? [];
  }

  companiesCache = data as Company[];
  companiesCacheTime = Date.now();
  return companiesCache;
}

async function loadCoverageRules(): Promise<CoverageRule[]> {
  if (rulesCache && isCacheValid(rulesCacheTime)) {
    return rulesCache;
  }

  const { data, error } = await supabase
    .from("company_coverage_rules")
    .select("*")
    .order("priority", { ascending: false });

  if (error || !data) {
    console.error("[CompanyRouting] Failed to load coverage rules:", error?.message);
    return rulesCache ?? [];
  }

  rulesCache = data as CoverageRule[];
  rulesCacheTime = Date.now();
  return rulesCache;
}

// ─── 4. Filtro por tipo de rota ──────────────────────────────

function acceptsRouteType(company: Company, routeType: RouteType): boolean {
  switch (routeType) {
    case "local": return company.accepts_local;
    case "metropolitan": return company.accepts_metropolitan;
    case "intermunicipal": return company.accepts_intermunicipal;
    case "interstate": return company.accepts_interstate;
    case "long_distance": return company.accepts_long_distance;
    default: return true;
  }
}

// ─── 5. Filtro por distância ─────────────────────────────────

function acceptsDistance(company: Company, distanceKm: number | null): boolean {
  if (distanceKm === null) return true; // fallback seguro: não eliminar

  if (company.distance_min_km !== null && distanceKm < company.distance_min_km) {
    return false;
  }
  if (company.distance_max_km !== null && distanceKm > company.distance_max_km) {
    return false;
  }
  return true;
}

// ─── 6. Filtro por cobertura geográfica ──────────────────────

function applyCoverageRules(
  companyId: string,
  origin: CidadeBrasil,
  destination: CidadeBrasil,
  distanceKm: number | null,
  rules: CoverageRule[]
): "allow" | "deny" | "neutral" {
  // Filtrar regras desta companhia
  const companyRules = rules.filter(r => r.company_id === companyId);
  if (companyRules.length === 0) return "neutral";

  // Ordenar por especificidade (cidade > estado > genérica)
  const scored = companyRules.map(rule => {
    let specificity = rule.priority;
    if (rule.origin_city_ibge && rule.destination_city_ibge) specificity += 1000;
    else if (rule.origin_city_ibge || rule.destination_city_ibge) specificity += 500;
    else if (rule.origin_state && rule.destination_state) specificity += 100;
    else if (rule.origin_state || rule.destination_state) specificity += 50;
    return { rule, specificity };
  }).sort((a, b) => b.specificity - a.specificity);

  for (const { rule } of scored) {
    // Verificar match
    if (!matchesRule(rule, origin, destination, distanceKm)) continue;
    return rule.rule_type as "allow" | "deny";
  }

  return "neutral";
}

function matchesRule(
  rule: CoverageRule,
  origin: CidadeBrasil,
  destination: CidadeBrasil,
  distanceKm: number | null
): boolean {
  // Match cidade origem
  if (rule.origin_city_ibge && rule.origin_city_ibge !== origin.codigoIbge) return false;
  // Match cidade destino
  if (rule.destination_city_ibge && rule.destination_city_ibge !== destination.codigoIbge) return false;
  // Match estado origem
  if (rule.origin_state && rule.origin_state !== origin.estado) return false;
  // Match estado destino
  if (rule.destination_state && rule.destination_state !== destination.estado) return false;
  // Match distância
  if (distanceKm !== null) {
    if (rule.min_distance_km !== null && distanceKm < rule.min_distance_km) return false;
    if (rule.max_distance_km !== null && distanceKm > rule.max_distance_km) return false;
  }
  return true;
}

// ─── 7. Pipeline principal ───────────────────────────────────

export async function getAvailableCompanies(
  originStr: string,
  destStr: string
): Promise<EligibleCompany[]> {
  // 1. Resolver cidades
  const origin = findCityByDisplay(originStr) || findCityByName(originStr);
  const dest = findCityByDisplay(destStr) || findCityByName(destStr);

  if (!origin || !dest) {
    console.warn("[CompanyRouting] City not found:", { originStr, destStr });
    return [];
  }

  if (origin.codigoIbge === dest.codigoIbge) {
    return [];
  }

  // 2. Calcular distância
  const distanceKm = calculateRouteDistance(origin, dest);

  // 3. Classificar rota
  const routeType = getRouteType(origin, dest, distanceKm);

  // 4. Carregar dados (paralelo)
  const [companies, rules] = await Promise.all([
    loadCompanies(),
    loadCoverageRules(),
  ]);

  // 5-8. Pipeline de filtros
  const eligible = companies.filter(company => {
    // Filtro por tipo de rota
    if (!acceptsRouteType(company, routeType)) return false;

    // Filtro por distância
    if (!acceptsDistance(company, distanceKm)) return false;

    // Filtro por cobertura
    const coverage = applyCoverageRules(company.id, origin, dest, distanceKm, rules);
    if (coverage === "deny") return false;

    return true;
  });

  // 9. Ordenar por prioridade DESC, depois nome
  eligible.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.name.localeCompare(b.name);
  });

  // 10. Retorno
  return eligible.map(c => ({
    name: c.name,
    logo: c.logo,
    priority: c.priority,
  }));
}

// ─── Versão síncrona com fallback (para uso no routeCalculator) ──

/** Fallback estático quando o DB não está disponível ou para renderização inicial */
const FALLBACK_COMPANIES: EligibleCompany[] = [
  { name: "Andorinha", logo: "🚌", priority: 9 },
  { name: "Kaissara", logo: "🚌", priority: 8 },
  { name: "Águia Branca", logo: "🚍", priority: 8 },
  { name: "Viação Garcia", logo: "🚎", priority: 7 },
  { name: "Auto Viação 1001", logo: "🚎", priority: 7 },
  { name: "Brasil Sul", logo: "🚐", priority: 6 },
  { name: "Catedral Turismo", logo: "🚌", priority: 6 },
  { name: "Caiçara", logo: "🚍", priority: 5 },
  { name: "Boa Esperança", logo: "🚐", priority: 4 },
];

/**
 * Filtra companhias de forma síncrona usando dados em cache ou fallback.
 * Usado pelo routeCalculator para não bloquear a geração de viagens.
 */
export function getAvailableCompaniesSync(
  originStr: string,
  destStr: string
): EligibleCompany[] {
  const origin = findCityByDisplay(originStr) || findCityByName(originStr);
  const dest = findCityByDisplay(destStr) || findCityByName(destStr);

  if (!origin || !dest || origin.codigoIbge === dest.codigoIbge) {
    return [];
  }

  const distanceKm = calculateRouteDistance(origin, dest);
  const routeType = getRouteType(origin, dest, distanceKm);

  // Usar cache se disponível, senão fallback
  const companies = (companiesCache && isCacheValid(companiesCacheTime))
    ? companiesCache
    : null;

  if (!companies) {
    // Disparar load assíncrono para próxima chamada
    loadCompanies().catch(() => {});
    loadCoverageRules().catch(() => {});

    // Filtrar fallback por tipo de rota (regras simplificadas)
    return filterFallbackByRouteType(FALLBACK_COMPANIES, routeType, distanceKm);
  }

  const rules = rulesCache ?? [];

  const eligible = companies.filter(company => {
    if (!acceptsRouteType(company, routeType)) return false;
    if (!acceptsDistance(company, distanceKm)) return false;
    const coverage = applyCoverageRules(company.id, origin, dest, distanceKm, rules);
    if (coverage === "deny") return false;
    return true;
  });

  eligible.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.name.localeCompare(b.name);
  });

  return eligible.map(c => ({ name: c.name, logo: c.logo, priority: c.priority }));
}

function filterFallbackByRouteType(
  companies: EligibleCompany[],
  routeType: RouteType,
  distanceKm: number | null
): EligibleCompany[] {
  // Para fallback, aplicar regras simples
  if (routeType === "local") return [];

  if (routeType === "metropolitan" || routeType === "intermunicipal") {
    // Excluir companhias tipicamente de longa distância em rotas curtas
    if (distanceKm !== null && distanceKm < 100) {
      return companies.slice(0, 6);
    }
    return companies;
  }

  // Interstate / long_distance: todas
  return companies;
}

/** Pre-warm cache: chamar no boot da app */
export function preloadCompanyData(): void {
  loadCompanies().catch(() => {});
  loadCoverageRules().catch(() => {});
}
