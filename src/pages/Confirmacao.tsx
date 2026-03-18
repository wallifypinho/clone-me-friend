import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Bus, Printer, Copy, Check, Clock, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import ThermalTicket from "@/components/ThermalTicket";

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
  const bookingCode = searchParams.get("bookingCode") || "";
  const expiresAt = searchParams.get("expiresAt") || "";
  const transactionId = searchParams.get("transactionId") || "";

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

  // PDF download
  const handleDownloadPdf = useCallback(() => {
    const el = document.getElementById("thermal-ticket");
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Permita popups para baixar o PDF");
      return;
    }
    printWindow.document.write(`
      <html>
      <head>
        <title>Prévia de Reserva - ${code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; padding: 10px; background: white; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>${el.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }, [code]);

  const paymentStatus = paymentMethod === "pix" ? "awaiting_payment" : "pending";

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
              copied={copied}
              timeLeft={timeLeft}
              onCopy={copyPixCode}
            />
          )}
          {paymentMethod === "card" && (
            <p className="text-sm text-muted-foreground mt-2">Pagamento aprovado com sucesso!</p>
          )}
        </div>

        {/* Thermal Ticket */}
        <ThermalTicket
          companyName={company || "VIAÇÃO EXEMPLO S.A."}
          origem={origem}
          destino={destino}
          dataViagem={data}
          horario={departure}
          arrival={arrival}
          poltrona={seats}
          tipoServico={seatType}
          nomePassageiro={nome}
          documento={cpf}
          localizador={code}
          tarifa={price * seatList.length}
          valorTotal={total}
          formaPagamento={paymentMethod === "pix" ? "PIX" : "Cartão de Crédito"}
          statusPagamento={paymentStatus}
          numeroPedido={transactionId || code}
          qrValue={code}
        />

        {/* Actions */}
        <button
          onClick={handleDownloadPdf}
          className="w-full bg-foreground text-background font-bold py-3.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" /> Baixar / Imprimir Bilhete
        </button>
        <button
          onClick={() => window.print()}
          className="w-full border-2 border-border text-foreground font-bold py-3.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors"
        >
          <Printer className="w-4 h-4" /> Imprimir Página
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
  copied,
  timeLeft,
  onCopy,
}: {
  total: number;
  pixCode: string;
  copied: boolean;
  timeLeft: string;
  onCopy: () => void;
}) => (
  <>
    <p className="text-sm text-muted-foreground mt-1 mb-4">
      Pague via <span className="text-primary font-semibold">PIX</span> para confirmar sua viagem
    </p>

    {/* QR Code */}
    <div className="w-52 h-52 mx-auto bg-background rounded-xl border-2 border-border mb-3 flex items-center justify-center overflow-hidden p-2">
      {pixCode ? (
        <QRCodeSVG value={pixCode} size={180} level="M" />
      ) : (
        <div className="text-muted-foreground text-xs text-center p-4">
          Aguardando QR Code...
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

    <button
      onClick={onCopy}
      className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg text-sm uppercase tracking-wide hover:opacity-90 transition-opacity mb-2 flex items-center justify-center gap-2"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Código Copiado!" : "Copiar Código PIX"}
    </button>

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
  </>
);

export default Confirmacao;
