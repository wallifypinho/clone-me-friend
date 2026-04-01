import { useEffect, useMemo } from "react";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import promoBanner from "@/assets/promo-banner.avif";
import DestinationCard from "@/components/DestinationCard";
import HomeSections from "@/components/HomeSections";
import { analytics } from "@/lib/analytics";
import { getFinalFare, applyCommercialRounding } from "@/lib/pricing";
import { findCityByName } from "@/data/cidadesBrasil";
import { getDistance } from "@/lib/routeCalculator";

function calcDisplayPrice(origemName: string, destinoName: string): string {
  const origin = findCityByName(origemName);
  const dest = findCityByName(destinoName);
  if (!origin || !dest) return "49,90";
  const distKm = getDistance(origin, dest);
  const fare = getFinalFare({
    distanceKm: distKm,
    originState: origin.estado,
    destState: dest.estado,
    busCategory: "Convencional",
    seatPosition: "comum",
    origin: origin.nome,
    destination: dest.nome,
  });
  const discounted = applyCommercialRounding(fare.finalPrice / 2);
  return discounted.toFixed(2).replace(".", ",");
}

interface OfferDef {
  image: string;
  origem: string;
  destino: string;
  origemName: string;
  destinoName: string;
}

const offersDef1: OfferDef[] = [
  { image: "/images/dest-rio.webp", origem: "São Paulo, SP", destino: "Rio de Janeiro, RJ", origemName: "São Paulo", destinoName: "Rio de Janeiro" },
  { image: "/images/dest-sp.webp", origem: "Rio de Janeiro, RJ", destino: "São Paulo, SP", origemName: "Rio de Janeiro", destinoName: "São Paulo" },
  { image: "/images/dest-bh.webp", origem: "São Paulo, SP", destino: "Belo Horizonte, MG", origemName: "São Paulo", destinoName: "Belo Horizonte" },
  { image: "/images/dest-rio.webp", origem: "Belo Horizonte, MG", destino: "Rio de Janeiro, RJ", origemName: "Belo Horizonte", destinoName: "Rio de Janeiro" },
];

const offersDef2: OfferDef[] = [
  { image: "/images/dest-rio.webp", origem: "São Paulo, SP", destino: "Rio de Janeiro, RJ", origemName: "São Paulo", destinoName: "Rio de Janeiro" },
  { image: "/images/dest-bh.webp", origem: "São Paulo, SP", destino: "Belo Horizonte, MG", origemName: "São Paulo", destinoName: "Belo Horizonte" },
  { image: "/images/dest-cwb.webp", origem: "São Paulo, SP", destino: "Curitiba, PR", origemName: "São Paulo", destinoName: "Curitiba" },
  { image: "/images/dest-bh.webp", origem: "Rio de Janeiro, RJ", destino: "Belo Horizonte, MG", origemName: "Rio de Janeiro", destinoName: "Belo Horizonte" },
];

const Index = () => {
  useEffect(() => {
    analytics.updateScore('PAGE_VIEW_HOME');
  }, []);

  const offers1 = useMemo(() => offersDef1.map(o => ({
    image: o.image, origem: o.origem, destino: o.destino,
    price: calcDisplayPrice(o.origemName, o.destinoName),
  })), []);

  const offers2 = useMemo(() => offersDef2.map(o => ({
    image: o.image, origem: o.origem, destino: o.destino,
    price: calcDisplayPrice(o.origemName, o.destinoName),
  })), []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero + Search */}
      <section className="relative">
        {/* Purple gradient banner */}
        <div className="brand-gradient-hero relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/[0.04]" />

          <div className="container relative z-10 px-5 py-6 md:py-10 text-center">
            <h1 className="text-primary-foreground text-lg sm:text-xl md:text-3xl lg:text-4xl font-extrabold leading-tight mb-2">
              Páscoa com economia...
              <br />
              pelo menos na passagem!
            </h1>

            {/* Promo banner */}
            <div className="inline-flex flex-col items-center bg-brand-purple-dark/60 backdrop-blur-sm rounded-xl px-5 py-3 md:px-8 md:py-4 border border-white/20 mt-2">
              <div className="flex items-baseline gap-2">
                <p className="text-primary-foreground text-3xl md:text-5xl font-black leading-none">15%</p>
                <span className="text-primary-foreground text-sm md:text-lg font-extrabold uppercase">OFF</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] md:text-xs text-primary-foreground/70 uppercase">cupom:</span>
                <span className="text-primary-foreground text-sm md:text-base font-bold tracking-wider bg-white/15 px-2.5 py-0.5 rounded">COMPROUCOM15</span>
              </div>
              <p className="text-[10px] md:text-xs text-primary-foreground/60 mt-1.5">
                Pague também com <span className="font-bold text-primary-foreground/80 underline">PIX parcelado</span>
              </p>
            </div>

            <p className="text-[10px] md:text-xs text-primary-foreground/50 mt-2 italic">
              Desconto de 15% sem compra mínima. Válido enquanto durar o estoque.
            </p>
          </div>
        </div>

        {/* Search card */}
        <div className="relative z-20 -mt-6 md:-mt-10 pb-2">
          <div className="container px-4">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Best Prices */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Passagens de Ônibus com os Melhores Preços
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {offers1.map((o, i) => (
              <DestinationCard key={`best-${i}`} {...o} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-12 bg-muted">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Passagens de Ônibus para Destinos Populares
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {offers2.map((o, i) => (
              <DestinationCard key={`pop-${i}`} {...o} />
            ))}
          </div>
        </div>
      </section>

      <HomeSections />
    </div>
  );
};

export default Index;
