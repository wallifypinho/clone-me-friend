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

      {/* Hero */}
      <section className="relative">
        <div className="brand-gradient-hero h-[320px] md:h-[400px] flex items-center justify-center overflow-hidden pt-8 pb-24 md:pb-28">
          <div className="relative z-10 text-center px-4">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">
              🎉 Semana do Consumidor
            </span>
            <h1 className="text-white text-xl md:text-3xl lg:text-4xl font-extrabold leading-tight mb-1">
              Sua viagem com até
            </h1>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-white text-7xl md:text-9xl font-black tracking-tighter leading-none">50%</span>
              <span className="text-white/90 text-xl md:text-3xl font-extrabold uppercase leading-none">
                OFF
              </span>
            </div>
            <p className="text-white/80 text-xs md:text-sm font-medium">
              Aproveite! Use o cupom <span className="bg-white/25 backdrop-blur-sm px-2 py-0.5 rounded font-bold text-white">SOHOJE50</span>
            </p>
          </div>
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2">
          <div className="container">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Spacer for search form overlap */}
      <div className="h-44 md:h-52" />

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
