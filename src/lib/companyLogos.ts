import logoAndorinha from "@/assets/logos/andorinha.png";
import logoAguiaBranca from "@/assets/logos/aguia-branca.png";
import logoCometa from "@/assets/logos/cometa.png";
import logoKaissara from "@/assets/logos/kaissara.png";
import logoGuanabara from "@/assets/logos/guanabara.png";
import logo1001 from "@/assets/logos/auto-viacao-1001.png";
import logoGarcia from "@/assets/logos/viacao-garcia.png";
import logoOuroEPrata from "@/assets/logos/ouro-e-prata.png";
import logoBrasilSul from "@/assets/logos/brasil-sul.png";
import logoEucatur from "@/assets/logos/eucatur.png";
import logoCatedral from "@/assets/logos/catedral-turismo.png";
import logoProgresso from "@/assets/logos/progresso.png";
import logoCaicara from "@/assets/logos/caicara2.png";
import logoCatarinense from "@/assets/logos/catarinense.png";
import logoRealExpresso from "@/assets/logos/real-expresso.png";
import logoBoaEsperanca from "@/assets/logos/boa-esperanca.png";
import logoReunidas from "@/assets/logos/reunidas.png";
import logoSateliteNorte from "@/assets/logos/satelite-norte.png";
import logoRealMaia from "@/assets/logos/real-maia.png";

const normalize = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const LOGO_MAP: Record<string, string> = {
  andorinha: logoAndorinha,
  "aguia branca": logoAguiaBranca,
  cometa: logoCometa,
  kaissara: logoKaissara,
  guanabara: logoGuanabara,
  "auto viacao 1001": logo1001,
  "viacao garcia": logoGarcia,
  "ouro e prata": logoOuroEPrata,
  "brasil sul": logoBrasilSul,
  eucatur: logoEucatur,
  "catedral turismo": logoCatedral,
  progresso: logoProgresso,
  caicara: logoCaicara,
  catarinense: logoCatarinense,
  "real expresso": logoRealExpresso,
  "boa esperanca": logoBoaEsperanca,
  reunidas: logoReunidas,
  "satelite norte": logoSateliteNorte,
  "real maia": logoRealMaia,
};

export function getCompanyLogo(companyName: string): string | null {
  return LOGO_MAP[normalize(companyName)] || null;
}
