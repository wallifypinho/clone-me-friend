import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarDays, Clock, Bus, Armchair, Users, DollarSign, User, CreditCard, Mail, Phone } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { upsertLead } from "@/lib/entities";

const DadosPassageiro = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origem = searchParams.get("origem") || "";
  const destino = searchParams.get("destino") || "";
  const data = searchParams.get("data") || "";
  const departure = searchParams.get("departure") || "";
  const arrival = searchParams.get("arrival") || "";
  const company = searchParams.get("company") || "";
  const seatType = searchParams.get("seatType") || "";
  const price = parseFloat(searchParams.get("price") || "0");
  const adultos = parseInt(searchParams.get("adultos") || "1");
  const seats = searchParams.get("seats") || "";

  const total = price * (seats.split(",").length || 1);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const formatDate = (d: string) => {
    if (!d) return "";
    const [y, m, dd] = d.split("-");
    return `${dd}/${m}/${y}`;
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const isValid = nome.trim().length >= 3 && cpf.replace(/\D/g, "").length === 11 && email.includes("@") && whatsapp.replace(/\D/g, "").length >= 10;

  useEffect(() => {
    analytics.trackEvent('PassengerInfoStarted', { origin: origem, destination: destino });
    analytics.updateScore('PASSENGER_INFO_STARTED');
  }, []);

  const handleContinue = async () => {
    // Create/update lead in DB
    const leadId = await upsertLead({
      name: nome,
      email,
      phone: whatsapp.replace(/\D/g, ""),
      whatsapp: whatsapp.replace(/\D/g, ""),
      cpf: cpf.replace(/\D/g, ""),
    });

    analytics.identifyLead({ nome, email, cpf: cpf.replace(/\D/g, ""), whatsapp: whatsapp.replace(/\D/g, "") });
    analytics.trackEvent('PassengerInfoCompleted', { origin: origem, destination: destino, nome });
    analytics.trackEvent('Lead', { content_name: `${origem} → ${destino}`, value: total, currency: 'BRL' });
    analytics.updateScore('PASSENGER_INFO_COMPLETED');
    const params = new URLSearchParams({
      origem, destino, data, departure, arrival, company, seatType,
      price: String(price), adultos: String(adultos), seats,
      nome, cpf: cpf.replace(/\D/g, ""), email, whatsapp: whatsapp.replace(/\D/g, ""),
      leadId,
    });
    navigate(`/pagamento?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <div className="brand-gradient text-primary-foreground py-3 px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="font-semibold">Dados dos Passageiros</p>
            <p className="text-xs opacity-80">{origem} → {destino}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4">
        {/* Order summary */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4">Resumo do Pedido</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Origem → Destino</p><p className="font-medium text-foreground">{origem} → {destino}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium text-foreground">{formatDate(data)}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Horário</p><p className="font-medium text-foreground">{departure} - {arrival}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Bus className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Empresa · Tipo</p><p className="font-medium text-foreground">{company} · {seatType}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Armchair className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Assento(s)</p><p className="font-medium text-foreground">{seats}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Passageiros</p><p className="font-medium text-foreground">{adultos} adulto{adultos > 1 ? "s" : ""}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Valor Total</p><p className="text-xl font-bold text-foreground">R$ {total.toFixed(2).replace(".", ",")}</p></div>
            </div>
          </div>
        </div>

        {/* Passenger form */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-foreground">Adulto</h3>
            </div>
            <span className="text-xs text-muted-foreground">Passageiro 1 de {adultos}</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <User className="w-4 h-4" /> Nome Completo
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <CreditCard className="w-4 h-4" /> CPF
              </label>
              <input
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <Mail className="w-4 h-4" /> E-mail
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao23@gmail.com"
                type="email"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <Phone className="w-4 h-4" /> WhatsApp
              </label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 p-4 max-w-lg mx-auto w-full">
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-lg text-sm uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default DadosPassageiro;
