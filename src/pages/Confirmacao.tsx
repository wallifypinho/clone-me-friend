import { useMemo, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Bus, CalendarDays, Printer, ArrowRight, Copy, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Confirmacao = () => {
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
  const seats = searchParams.get("seats") || "";
  const nome = searchParams.get("nome") || "";
  const cpf = searchParams.get("cpf") || "";
  const paymentMethod = searchParams.get("paymentMethod") || "pix";
  const pixCode = searchParams.get("pixCode") || "";
  const qrBase64 = searchParams.get("qrBase64") || "";
  const qrUrl = searchParams.get("qrUrl") || "";
  const bookingCode = searchParams.get("bookingCode") || "";
  const expiresAt = searchParams.get("expiresAt") || "";

  const seatList = seats.split(",");
  const total = price * seatList.length;

  const generatedCode = useMemo(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return "RE" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }, []);
  const code = bookingCode || generatedCode;

  const [copied, setCopied] = useState(false);

  // Save booking
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current || !nome || !cpf) return;
    savedRef.current = true;
    supabase.from("bookings").insert({
      code,
      nome,
      cpf,
      email: searchParams.get("email") || null,
      whatsapp: searchParams.get("whatsapp") || null,
      origem,
      destino,
      data_viagem: data,
      departure,
      arrival,
      company,
      seat_type: seatType,
      seats,
      price_per_seat: price,
      total,
      payment_method: paymentMethod,
      status: paymentMethod === "pix" ? "awaiting_payment" : "pending",
    }).then(({ error }) => {
      if (error) console.error("Error saving booking:", error);
    });
  }, []);

  const formatDate = (d: string) => {
    if (!d) return "";
    const [y, m, dd] = d.split("-");
    return `${dd}/${m}/${y}`;
  };

  const formatCPF = (v: string) => {
    if (v.length !== 11) return v;
    return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
  };

  const copyPixCode = () => {
    if (!pixCode) {
      toast.error("Código PIX não disponível");
      return;
    }
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  // Countdown for PIX expiration
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!expiresAt || paymentMethod !== "pix") return;
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expirado");
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, paymentMethod]);

  const hasQrImage = qrBase64 || qrUrl;

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center">
      {/* Logo */}
      <div className="brand-gradient w-full flex justify-center py-3">
        <img src="/images/logo.png" alt="Logo" className="h-8 brightness-0 invert" />
      </div>

      <div className="max-w-lg w-full p-4 space-y-4">
        {/* Success card */}
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Bus className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Pedido Criado!</h2>

    {paymentMethod === "pix" && (
            <PixPaymentSection
              total={total}
              pixCode={pixCode}
              hasQrImage={!!(qrBase64 || qrUrl)}
              qrBase64={qrBase64}
              qrUrl={qrUrl}
              copied={copied}
              timeLeft={timeLeft}
              onCopy={copyPixCode}
            />
          )}
          {paymentMethod === "card" && (
            <p className="text-sm text-muted-foreground mt-2">Pagamento aprovado com sucesso!</p>
          )}
        </div>

        {/* Boarding ticket */}
        <BoardingTicket
          code={code}
          origem={origem}
          destino={destino}
          departure={departure}
          arrival={arrival}
          data={data}
          company={company}
          nome={nome}
          cpf={cpf}
          seats={seats}
          seatType={seatType}
          total={total}
          formatDate={formatDate}
          formatCPF={formatCPF}
        />

        {/* Actions */}
        <button
          onClick={() => window.print()}
          className="w-full bg-foreground text-background font-bold py-3.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Printer className="w-4 h-4" /> Imprimir Bilhete
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full border-2 border-border text-foreground font-bold py-3.5 rounded-lg text-sm uppercase tracking-wide hover:bg-muted transition-colors"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  );
};

/* ── PIX Payment Section ── */
const PixPaymentSection = ({
  total,
  pixCode,
  hasQrImage,
  qrBase64,
  qrUrl,
  copied,
  timeLeft,
  onCopy,
}: {
  total: number;
  pixCode: string;
  hasQrImage: boolean;
  qrBase64: string;
  qrUrl: string;
  copied: boolean;
  timeLeft: string;
  onCopy: () => void;
}) => (
  <>
    <p className="text-sm text-muted-foreground mt-1 mb-4">
      Pague via <span className="text-primary font-semibold">PIX</span> para confirmar sua viagem
    </p>

    {/* QR Code */}
    <div className="w-52 h-52 mx-auto bg-background rounded-xl border-2 border-border mb-3 flex items-center justify-center overflow-hidden">
      {hasQrImage ? (
        <img
          src={qrBase64 ? `data:image/png;base64,${qrBase64}` : qrUrl}
          alt="QR Code PIX"
          className="w-48 h-48 object-contain"
        />
      ) : (
        <div className="w-44 h-44 flex items-center justify-center text-muted-foreground text-xs text-center p-4">
          Aguardando QR Code do gateway...
        </div>
      )}
    </div>

    {timeLeft && (
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
        <Clock className="w-3 h-3" />
        <span>Expira em: <span className="font-bold text-foreground">{timeLeft}</span></span>
      </div>
    )}

    <p className="text-2xl font-bold text-foreground mb-4">R$ {total.toFixed(2).replace(".", ",")}</p>

    {/* PIX Copy */}
    <button
      onClick={onCopy}
      className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg text-sm uppercase tracking-wide hover:opacity-90 transition-opacity mb-2 flex items-center justify-center gap-2"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Código Copiado!" : "Copiar Código PIX"}
    </button>

    {/* PIX code preview */}
    {pixCode ? (
      <div className="bg-muted rounded-lg p-3 mb-3">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide mb-1">Código Copia e Cola</p>
        <p className="text-xs text-foreground font-mono break-all leading-relaxed select-all">
          {pixCode}
        </p>
      </div>
    ) : (
      <div className="bg-muted rounded-lg p-3 mb-3">
        <p className="text-xs text-muted-foreground">Aguardando geração do código PIX...</p>
      </div>
    )}

    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide mb-4">
      Finalize seu pagamento para confirmar sua viagem e validar seu bilhete de embarque
    </p>

    <button
      className="w-full font-bold py-3 rounded-lg text-sm hover:opacity-90 transition-opacity text-primary-foreground"
      style={{ background: "hsl(160, 84%, 39%)" }}
    >
      📱 Enviar Comprovante
    </button>
    <p className="text-xs text-muted-foreground mt-2">Envie seu comprovante para agilizar a confirmação</p>
  </>
);

/* ── Boarding Ticket ── */
const BoardingTicket = ({
  code, origem, destino, departure, arrival, data, company,
  nome, cpf, seats, seatType, total,
  formatDate, formatCPF,
}: {
  code: string; origem: string; destino: string; departure: string;
  arrival: string; data: string; company: string; nome: string;
  cpf: string; seats: string; seatType: string; total: number;
  formatDate: (d: string) => string; formatCPF: (v: string) => string;
}) => (
  <div className="bg-card rounded-2xl border-2 border-primary overflow-hidden">
    <div className="bg-primary/10 px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bus className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">Bilhete de Embarque</span>
      </div>
      <span className="text-xs font-mono font-bold text-primary">{code}</span>
    </div>

    <div className="p-5">
      {/* Route */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase">Origem</p>
          <p className="font-bold text-foreground">{origem}</p>
          <p className="text-sm text-primary font-semibold">{departure}</p>
        </div>
        <div className="flex-1 mx-4 flex items-center">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <div className="flex-1 border-t-2 border-dashed border-border relative">
            <Bus className="w-4 h-4 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card" />
          </div>
          <ArrowRight className="w-3 h-3 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase">Destino</p>
          <p className="font-bold text-foreground">{destino}</p>
          <p className="text-sm text-primary font-semibold">{arrival}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {formatDate(data)}</span>
        <span className="flex items-center gap-1"><Bus className="w-3 h-3" /> {company}</span>
      </div>

      <div className="border-t border-dashed border-border pt-3 mb-3">
        <p className="text-xs text-muted-foreground uppercase mb-2">Passageiros (1)</p>
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <div>
            <p className="font-semibold text-sm text-foreground">{nome}</p>
            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
              <span>CPF {formatCPF(cpf)}</span>
              <span>Assento {seats}</span>
              <span>Tipo {seatType}</span>
            </div>
          </div>
          <span className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-semibold">Adulto</span>
        </div>
      </div>

      <div className="border-t border-dashed border-border pt-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Valor Total</p>
          <p className="text-xs text-muted-foreground">Código</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">R$ {total.toFixed(2).replace(".", ",")}</p>
          <p className="text-xs font-mono text-muted-foreground">{code}</p>
        </div>
      </div>
    </div>
  </div>
);

export default Confirmacao;
