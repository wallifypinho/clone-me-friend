import { Shield, Award, MessageCircle, ThumbsUp, Star, Quote } from "lucide-react";

const stats = [
  { value: "2M+", label: "Passagens vendidas" },
  { value: "4.8", label: "Avaliação dos clientes" },
  { value: "200+", label: "Empresas parceiras" },
  { value: "4.800", label: "Destinos no Brasil" },
];

const testimonials = [
  {
    text: "Super rápido e fácil de comprar. Melhor preço que encontrei para ir pro Rio. Já comprei 5 vezes e nunca tive problema!",
    name: "Maria S.",
    city: "São Paulo, SP",
  },
  {
    text: "Atendimento excelente pelo WhatsApp, me ajudaram na hora. Passagem confirmada em minutos. Recomendo demais!",
    name: "Carlos A.",
    city: "Belo Horizonte, MG",
  },
  {
    text: "Preços imbatíveis e pagamento fácil pelo PIX. A confirmação é instantânea. Viajo sempre pela RotaCerta!",
    name: "Juliana R.",
    city: "Curitiba, PR",
  },
];

const trust = [
  { icon: Shield, title: "Compra 100% Segura", desc: "Seus dados protegidos com criptografia de ponta a ponta" },
  { icon: Award, title: "Empresa Premiada", desc: "Reconhecida pelo Reclame Aqui como empresa de excelência" },
  { icon: MessageCircle, title: "Suporte Humanizado", desc: "Atendimento via WhatsApp para tirar todas suas dúvidas" },
  { icon: ThumbsUp, title: "Satisfação Garantida", desc: "Mais de 98% dos clientes recomendam nossos serviços" },
];

const HomeSections = () => {
  return (
    <>
      {/* Stats */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-extrabold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground mb-8">O Que Nossos Clientes Dizem</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <Quote className="w-6 h-6 text-primary mb-3" />
                <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-brand-orange text-brand-orange" />
                  ))}
                </div>
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 bg-muted">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground mb-2">Por Que Escolher a RotaCerta?</h2>
          <p className="text-muted-foreground mb-8">
            Somos referência em venda de passagens de ônibus online no Brasil.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trust.map((t) => (
              <div key={t.title} className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                  <t.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RotaCerta — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </>
  );
};

export default HomeSections;
