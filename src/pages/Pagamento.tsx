import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";

const Pagamento = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origem = searchParams.get("origem") || "";
  const destino = searchParams.get("destino") || "";
  const price = parseFloat(searchParams.get("price") || "0");
  const seats = searchParams.get("seats") || "";
  const nome = searchParams.get("nome") || "";
  const cpf = searchParams.get("cpf") || "";
  const email = searchParams.get("email") || "";
  const total = price * (seats.split(",").length || 1);

  const [method, setMethod] = useState<"pix" | "card" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analytics.trackEvent('PaymentScreenViewed', { origin: origem, destination: destino, amount: total, currency: 'BRL' });
    analytics.trackEvent('AddPaymentInfo', { value: total, currency: 'BRL' });
    analytics.updateScore('PAYMENT_SCREEN_VIEWED');
  }, []);

  const handleContinue = async () => {
    if (!method) return;
    setLoading(true);
    analytics.trackEvent('PaymentLinkGenerated', { payment_type: method, amount: total, currency: 'BRL' });
    analytics.updateScore('PAYMENT_LINK_GENERATED');

    try {
      // Generate booking code
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const bookingCode = "RE" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

      // Call edge function to create payment via gateway
      // Gather attribution data to send with payment
      const attrData = analytics.getAttributionData();
      const { score } = analytics.getBuyerScore();
      const attribution = {
        session_id: analytics.getSessionId(),
        visitor_id: analytics.getVisitorId(),
        lead_id: analytics.getLeadData()?.lead_id || null,
        customer_whatsapp: searchParams.get("whatsapp") || null,
        buyer_score: score,
        utm_source: attrData?.utm_source || null,
        utm_medium: attrData?.utm_medium || null,
        utm_campaign: attrData?.utm_campaign || null,
        utm_content: attrData?.utm_content || null,
        utm_term: attrData?.utm_term || null,
        fbclid: attrData?.fbclid || null,
        gclid: attrData?.gclid || null,
        campaign_name: attrData?.campaign_name || null,
        campaign_id: attrData?.campaign_id || null,
        adset_name: attrData?.adset_name || null,
        adset_id: attrData?.adset_id || null,
        ad_name: attrData?.ad_name || null,
        ad_id: attrData?.ad_id || null,
        placement: attrData?.placement || null,
        first_visit_at: attrData?.first_visit_at || null,
        landing_page: attrData?.landing_page || null,
        referrer: attrData?.referrer || null,
      };

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          amount: total,
          bookingCode,
          customerName: nome,
          customerCpf: cpf,
          customerEmail: email,
          paymentMethod: method,
          attribution,
        },
      });

      if (error) {
        console.error("Payment error:", error);
        toast.error("Erro ao processar pagamento. Tente novamente.");
        setLoading(false);
        return;
      }

      if (data?.error) {
        console.error("Gateway error details:", data.details);
        toast.error(data.error);
        setLoading(false);
        return;
      }

      console.log("AnubisPay response:", data);

      // Navigate to confirmation with payment data
      const params = new URLSearchParams(searchParams);
      params.set("paymentMethod", method);
      params.set("bookingCode", bookingCode);
      if (data?.pix_code) params.set("pixCode", data.pix_code);
      if (data?.qr_code_base64) params.set("qrBase64", data.qr_code_base64);
      if (data?.qr_code_url) params.set("qrUrl", data.qr_code_url);
      if (data?.transaction_id) params.set("transactionId", data.transaction_id);
      if (data?.expires_at) params.set("expiresAt", data.expires_at);
      if (data?.fallback) params.set("fallback", "true");

      navigate(`/confirmacao?${params.toString()}`);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erro ao conectar com o gateway de pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="brand-gradient text-primary-foreground py-3 px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="font-semibold">Forma de Pagamento</p>
            <p className="text-xs opacity-80">{origem} → {destino}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full p-4">
        <h2 className="text-lg font-bold text-center text-foreground mt-4 mb-1">Escolha a forma de pagamento</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Selecione como deseja pagar sua passagem</p>

        <div className="space-y-3">
          <button
            onClick={() => setMethod("pix")}
            disabled={loading}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              method === "pix" ? "border-primary bg-accent/30" : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <QrCode className="w-8 h-8 text-foreground shrink-0" />
            <div>
              <p className="font-bold text-foreground">PIX</p>
              <p className="text-xs text-muted-foreground">Pagamento instantâneo · Aprovação imediata</p>
            </div>
          </button>

          <button
            onClick={() => setMethod("card")}
            disabled={loading}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              method === "card" ? "border-primary bg-accent/30" : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <CreditCard className="w-8 h-8 text-foreground shrink-0" />
            <div>
              <p className="font-bold text-foreground">Cartão de Crédito</p>
              <p className="text-xs text-muted-foreground">Em até 12x · Todas as bandeiras</p>
            </div>
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between bg-card border border-border rounded-xl p-4">
          <span className="text-sm text-muted-foreground">Valor Total</span>
          <span className="text-xl font-bold text-foreground">R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 p-4 max-w-lg mx-auto w-full">
        <button
          onClick={handleContinue}
          disabled={!method || loading}
          className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-lg text-sm uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Continuar"
          )}
        </button>
      </div>
    </div>
  );
};

export default Pagamento;
