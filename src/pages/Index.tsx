import { useEffect, useMemo } from "react";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import promoBanner from "@/assets/promo-banner-mobile.avif";
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
        {/* Purple gradient that extends behind the search form */}
        <div className="brand-gradient-hero relative overflow-hidden pb-28 md:pb-40">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/[0.04]" />

          {/* Promo banner image */}
          <div className="relative z-10">
            <img
              src={promoBanner}
              alt="Promoção 15% OFF - Cupom COMPROUCOM15"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Search card overlapping purple → white transition */}
        <div className="relative z-20 -mt-24 md:-mt-32 pb-2">
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
