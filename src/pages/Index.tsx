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
      <section className="relative pb-[72px] md:pb-20">
        <div
          className="relative h-[220px] md:h-[260px] overflow-visible bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url(${promoBanner})` }}
        />
        <div className="relative z-10 mx-auto -mt-[60px] max-w-4xl px-4">
          <SearchForm />
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
