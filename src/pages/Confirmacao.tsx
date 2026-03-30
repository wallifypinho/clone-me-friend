import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Bus, CalendarDays, Copy, Check, Clock, Download, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import ThermalTicket from "@/components/ThermalTicket";
import { analytics } from "@/lib/analytics";

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
  const pixCode = searchParams.get("pixCode") || searchParams.get("qrCode") || "";
  const bookingCode = searchParams.get("bookingCode") || "";
  const expiresAt = searchParams.get("expiresAt") || "";
  const transactionId = searchParams.get("transactionId") || "";
  const orderId = searchParams.get("orderId") || "";

  const seatList = seats.split(",");
  const total = price * seatList.length;

  const generatedCode = useMemo(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return "RE" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }, []);
  const code = bookingCode || generatedCode;

  const [copied, setCopied] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Track & update booking with gateway transaction ID
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current || !nome || !cpf) return;
    savedRef.current = true;

    // Analytics
    analytics.identifyLead({ nome, cpf, reservation_code: code });
    if (paymentMethod === 'pix') {
      analytics.trackEvent('PixViewed', { reservation_code: code, amount: total, currency: 'BRL' });
      analytics.updateScore('PIX_VIEWED');
    }
    analytics.trackEvent('ReservationViewed', { reservation_code: code, origin: origem, destination: destino, amount: total });

    // Update booking with gateway_transaction_id (booking was created in Pagamento)
    if (transactionId) {
      supabase.from("bookings")
        .update({ gateway_transaction_id: transactionId })
        .eq("code", code)
        .then(({ error }) => {
          if (error) console.error("Error updating booking with txId:", error);
        });
    }

    // Save order attribution
    analytics.saveOrderAttribution({
      order_id: transactionId || code,
      reservation_code: code,
      purchase_value: total,
    });
  }, []);

  // Poll payment status and fire Purchase event for browser pixel when confirmed
  // Uses purchase_event_id from orders table for deduplication with CAPI
  const purchaseFiredRef = useRef(false);
  useEffect(() => {
    if (!transactionId || paymentMethod !== 'pix' || purchaseFiredRef.current) return;

    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      try {
        // Primary: check local DB
        const { data: orderData } = await supabase
          .from('orders')
          .select('payment_status, paid_at, purchase_event_id')
          .eq('gateway_transaction_id', transactionId)
          .maybeSingle();

        let isPaid = orderData?.payment_status === 'paid';
        let paidAt = orderData?.paid_at;
        let purchaseEventId = (orderData as any)?.purchase_event_id;

        // Fallback: if DB doesn't show paid, query gateway directly every 3rd poll
        if (!isPaid && pollCount % 3 === 0) {
          try {
            const { data: gwData } = await supabase.functions.invoke('check-payment-status', {
              body: { transactionId },
            });
            if (gwData?.status === 'paid') {
              isPaid = true;
              paidAt = gwData.paid_at;
              purchaseEventId = gwData.purchase_event_id;
            }
          } catch (gwErr) {
            console.warn("Gateway poll fallback error:", gwErr);
          }
        }
        pollCount++;

        if (isPaid && !purchaseFiredRef.current) {
          purchaseFiredRef.current = true;
          setPaymentConfirmed(true);
          clearInterval(pollInterval);

          const attrData = analytics.getAttributionData();
          console.log('[payment] confirmed! order_id:', orderId || transactionId, 'purchase_event_id:', purchaseEventId || '(browser-generated)');

          const paidPayload: Record<string, any> = {
            value: total,
            currency: 'BRL',
            content_name: `${origem} → ${destino}`,
            reservation_code: code,
            order_id: orderId || transactionId,
            transaction_id: transactionId,
            gateway_transaction_id: transactionId,
            session_id: analytics.getSessionId(),
            visitor_id: analytics.getVisitorId(),
            lead_id: analytics.getLeadData()?.lead_id || null,
            paid_at: paidAt || new Date().toISOString(),
            payment_status: 'paid',
            // Full attribution chain from original click
            utm_source: attrData?.utm_source || null,
            utm_medium: attrData?.utm_medium || null,
            utm_campaign: attrData?.utm_campaign || null,
            utm_content: attrData?.utm_content || null,
            utm_term: attrData?.utm_term || null,
            fbclid: attrData?.fbclid || null,
            gclid: attrData?.gclid || null,
            fbc: attrData?.fbc || null,
            fbp: attrData?.fbp || null,
            campaign_name: attrData?.campaign_name || null,
            campaign_id: attrData?.campaign_id || null,
            adset_name: attrData?.adset_name || null,
            adset_id: attrData?.adset_id || null,
            ad_name: attrData?.ad_name || null,
            ad_id: attrData?.ad_id || null,
            placement: attrData?.placement || null,
            landing_page: attrData?.landing_page || null,
            referrer: attrData?.referrer || null,
            first_visit_at: attrData?.first_visit_at || null,
          };

          if (purchaseEventId) {
            paidPayload.event_id = purchaseEventId;
          }

          analytics.trackEvent('Purchase', paidPayload);
          analytics.trackEvent('OrderPaid', paidPayload);
          analytics.updateScore('PURCHASE_COMPLETED');

          toast.success("Pagamento confirmado!");
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 5000);

    // Stop polling after 30 minutes
    const timeout = setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [transactionId, paymentMethod]);

  const copyPixCode = () => {
    if (!pixCode) {
      toast.error("Código PIX não disponível");
      return;
    }
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    analytics.trackEvent('PixCopied', { reservation_code: code, amount: total });
    analytics.updateScore('PIX_COPIED');
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
    analytics.trackEvent('TicketDownloaded', { reservation_code: code });
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

        {/* Boarding Ticket (visible on page) */}
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
        />

        {/* Hidden thermal ticket for PDF export */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
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
        </div>

        {/* Actions */}
        <button
          onClick={handleDownloadPdf}
          className="w-full bg-foreground text-background font-bold py-3.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" /> Baixar / Imprimir Bilhete
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

/* ── Boarding Ticket (visible on page) ── */
const formatDate = (d: string) => {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
};

const formatCPF = (v: string) => {
  const digits = v.replace(/\D/g, "");
  if (digits.length !== 11) return v;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const BoardingTicket = ({
  code, origem, destino, departure, arrival, data, company,
  nome, cpf, seats, seatType, total,
}: {
  code: string; origem: string; destino: string; departure: string;
  arrival: string; data: string; company: string; nome: string;
  cpf: string; seats: string; seatType: string; total: number;
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