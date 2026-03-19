import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import DestinationCard from "@/components/DestinationCard";
import HomeSections from "@/components/HomeSections";

const offers1 = [
  { image: "/images/dest-rio.webp", origem: "São Paulo, SP", destino: "Rio de Janeiro, RJ", price: "25,00" },
  { image: "/images/dest-sp.webp", origem: "Rio de Janeiro, RJ", destino: "São Paulo, SP", price: "25,00" },
  { image: "/images/dest-bh.webp", origem: "São Paulo, SP", destino: "Belo Horizonte, MG", price: "30,88" },
  { image: "/images/dest-rio.webp", origem: "Belo Horizonte, MG", destino: "Rio de Janeiro, RJ", price: "25,00" },
];

const offers2 = [
  { image: "/images/dest-rio.webp", origem: "São Paulo, SP", destino: "Rio de Janeiro, RJ", price: "25,00" },
  { image: "/images/dest-bh.webp", origem: "São Paulo, SP", destino: "Belo Horizonte, MG", price: "30,88" },
  { image: "/images/dest-cwb.webp", origem: "São Paulo, SP", destino: "Curitiba, PR", price: "27,99" },
  { image: "/images/dest-bh.webp", origem: "Rio de Janeiro, RJ", destino: "Belo Horizonte, MG", price: "25,00" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero + Search */}
      <section className="relative">
        {/* Purple gradient banner */}
        <div className="brand-gradient-hero relative overflow-hidden">
          {/* Subtle decorative glows */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/[0.04]" />

          <div className="container relative z-10 flex items-center gap-4 px-5 py-8 md:py-12 lg:py-14">
            {/* Left - text */}
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-primary-foreground text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2 md:mb-3">
                🎉 Semana do Consumidor
              </span>
              <h1 className="text-primary-foreground text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
                A hora é agora
                <br />
                e não volta mais!
              </h1>
            </div>

            {/* Right - discount block */}
            <div className="shrink-0 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 md:px-8 md:py-6 text-center border border-white/20">
              <p className="text-primary-foreground text-4xl md:text-7xl font-black leading-none">50%</p>
              <p className="text-primary-foreground text-lg md:text-2xl font-extrabold uppercase">OFF</p>
              <div className="mt-1.5 md:mt-2 bg-white/20 rounded-md px-2 py-1 md:px-3 md:py-1.5">
                <span className="text-[8px] md:text-[10px] text-primary-foreground/70 uppercase tracking-wider block leading-none">cupom</span>
                <p className="text-primary-foreground text-[11px] md:text-sm font-bold tracking-wider leading-tight">SOHOJE50</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search card - on mobile no overlap, on desktop overlap */}
        <div className="relative z-20 -mt-6 md:-mt-10 pb-2">
          <div className="container">
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
