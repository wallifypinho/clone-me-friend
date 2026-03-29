import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const {
      amount, bookingCode, customerName, customerCpf, customerEmail,
      customerPhone, paymentMethod, attribution,
    } = body;

    // ── Validation ──────────────────────────────────────────────
    if (!amount || !bookingCode || !paymentMethod) {
      return jsonResponse({ error: "Campos obrigatórios: amount, bookingCode, paymentMethod" }, 400);
    }

    // amount from frontend is in reais (e.g. 60.11) → convert to integer cents
    const amountCents = Math.round(Number(amount) * 100);
    if (amountCents < 100) {
      return jsonResponse({ error: "Valor mínimo de R$ 1,00" }, 400);
    }

    // CPF/CNPJ: digits only, 11 or 14
    const cpfClean = (customerCpf || "").replace(/\D/g, "");
    if (cpfClean.length !== 11 && cpfClean.length !== 14) {
      return jsonResponse({ error: "CPF/CNPJ inválido. Verifique o documento informado." }, 400);
    }

    // Phone: digits only, 10 or 11
    const phoneClean = (customerPhone || "").replace(/\D/g, "");

    // ── Gateway URL ─────────────────────────────────────────────
    const duttyfyUrl = Deno.env.get("DUTTYFY_ENCRYPTED_URL")?.trim();
    if (!duttyfyUrl) {
      console.error("[create-payment] DUTTYFY_ENCRYPTED_URL not configured");
      return jsonResponse({ error: "Gateway de pagamento não configurado." }, 422);
    }

    // ── Build IDs ───────────────────────────────────────────────
    const orderId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const attr = attribution || {};

    // UTM: forward all tracking params as-is
    const utmParts = [
      attr.utm_source && `utm_source=${attr.utm_source}`,
      attr.utm_medium && `utm_medium=${attr.utm_medium}`,
      attr.utm_campaign && `utm_campaign=${attr.utm_campaign}`,
      attr.utm_content && `utm_content=${attr.utm_content}`,
      attr.utm_term && `utm_term=${attr.utm_term}`,
      attr.fbclid && `fbclid=${attr.fbclid}`,
      attr.fbp && `fbp=${attr.fbp}`,
      attr.session_id && `sid=${attr.session_id}`,
    ].filter(Boolean).join("&");

    // ── DuttyFy payload (amount in CENTS) ───────────────────────
    const gatewayPayload = {
      amount: amountCents,
      description: `Passagem ${bookingCode}`,
      customer: {
        name: customerName || "Cliente",
        document: cpfClean,
        email: customerEmail || "cliente@email.com",
        phone: phoneClean || "00000000000",
      },
      item: {
        title: `Passagem ${bookingCode}`,
        price: amountCents,
        quantity: 1,
      },
      paymentMethod: "PIX",
      utm: utmParts || orderId,
    };

    // ── Safe logging ────────────────────────────────────────────
    console.log(`[create-payment] URL: len=${duttyfyUrl.length}, ends="...${duttyfyUrl.slice(-8)}"`);
    console.log(`[create-payment] Payload: booking=${bookingCode}, amount=${amountCents}cents, doc=${cpfClean.length}d, phone=${phoneClean.length}d`);

    // ── Call gateway with retry (exponential backoff on 5xx) ────
    let gwResponse: Response | null = null;
    let gwResponseText = "";
    let lastError: unknown = null;
    const retryDelays = [0, 1000, 2000, 4000]; // first attempt + 3 retries

    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      if (attempt > 0) {
        console.log(`[create-payment] Retry #${attempt} after ${retryDelays[attempt]}ms`);
        await new Promise(r => setTimeout(r, retryDelays[attempt]));
      }

      try {
        gwResponse = await fetch(duttyfyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gatewayPayload),
          signal: AbortSignal.timeout(15_000), // 15s timeout
        });
        gwResponseText = await gwResponse.text();
        console.log(`[create-payment] Response: status=${gwResponse.status}, body=${gwResponseText.substring(0, 500)}`);

        // Don't retry on 4xx (client error) — only retry on 5xx
        if (gwResponse.status < 500) break;
        lastError = `HTTP ${gwResponse.status}`;
      } catch (fetchErr) {
        lastError = fetchErr;
        console.error(`[create-payment] Fetch error (attempt ${attempt}):`, fetchErr);
        if (attempt === retryDelays.length - 1) {
          await supabase.from("integration_logs").insert({
            provider: "duttyfy", action: "create_payment",
            request_payload: gatewayPayload,
            error_message: String(fetchErr),
            order_id: orderId,
          });
          return jsonResponse({ error: "Não foi possível conectar ao gateway de pagamento" }, 502);
        }
      }
    }

    if (!gwResponse) {
      return jsonResponse({ error: "Gateway indisponível após tentativas" }, 502);
    }

    // ── Parse response ──────────────────────────────────────────
    let gwData: Record<string, unknown>;
    try {
      gwData = JSON.parse(gwResponseText);
    } catch {
      await supabase.from("integration_logs").insert({
        provider: "duttyfy", action: "create_payment",
        request_payload: gatewayPayload,
        response_payload: { raw: gwResponseText.substring(0, 2000) },
        status_code: gwResponse.status,
        error_message: "Invalid JSON response",
        order_id: orderId,
      });
      return jsonResponse({ error: "Resposta inválida do gateway", details: gwResponseText.substring(0, 500) }, 502);
    }

    // ── Log integration call ────────────────────────────────────
    await supabase.from("integration_logs").insert({
      provider: "duttyfy", action: "create_payment",
      request_payload: gatewayPayload,
      response_payload: gwData,
      status_code: gwResponse.status,
      transaction_id: (gwData?.transactionId as string) || null,
      order_id: orderId,
      error_message: gwResponse.ok ? null : JSON.stringify(gwData).substring(0, 500),
    });

    // ── Handle gateway errors ───────────────────────────────────
    if (!gwResponse.ok) {
      const rawErrorMsg = gwData?.message ?? gwData?.error ?? `Erro no gateway (${gwResponse.status})`;
      const errorMsg = Array.isArray(rawErrorMsg)
        ? rawErrorMsg.filter(Boolean).join(" ")
        : String(rawErrorMsg);

      let userError = errorMsg;
      const norm = errorMsg.toLowerCase();
      if (norm.includes("cpf") || norm.includes("document")) {
        userError = "CPF inválido. Verifique o documento informado.";
      } else if (norm.includes("mínimo") || norm.includes("minimum")) {
        userError = "Valor mínimo de R$ 1,00 não atingido.";
      } else if (gwResponse.status === 401) {
        userError = "Credencial do gateway expirada. Contate o suporte.";
      }

      return jsonResponse({ error: userError, details: gwData }, 502);
    }

    // ── Extract success fields ──────────────────────────────────
    const pixCode = (gwData?.pixCode || gwData?.pix_code || gwData?.qr_code || "") as string;
    const transactionId = (gwData?.transactionId || gwData?.transaction_id || gwData?.id || "") as string;
    const txStatus = (gwData?.status || "PENDING") as string;

    if (!transactionId) {
      console.warn("[create-payment] No transactionId in gateway response — persistence may fail");
    }

    // ── Persist transactionId IMMEDIATELY (before returning to client) ──
    const ptInsert = supabase.from("payment_transactions").insert({
      order_id: orderId,
      provider: "duttyfy",
      transaction_id: transactionId,
      amount: Number(amount),
      payment_method: "PIX",
      status_internal: "waiting_payment",
      status_external: txStatus,
      customer_name: customerName || null,
      customer_document: cpfClean,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      item_title: `Passagem ${bookingCode}`,
      item_price: Number(amount),
      item_quantity: 1,
      utm: utmParts || null,
      raw_request: gatewayPayload,
      raw_response: gwData,
      pix_code: pixCode,
    });

    const bookingUpdate = supabase.from("bookings")
      .update({ status: "awaiting_payment", payment_method: paymentMethod, gateway_transaction_id: transactionId })
      .eq("code", bookingCode);

    const orderInsert = supabase.from("orders").insert({
      order_id: orderId, reservation_code: bookingCode,
      lead_id: attr.lead_id || null, session_id: attr.session_id || null,
      visitor_id: attr.visitor_id || null, gateway_transaction_id: transactionId,
      amount, currency: "BRL", payment_method: paymentMethod, payment_status: "pending",
      customer_name: customerName || null, customer_cpf: customerCpf || null,
      customer_email: customerEmail || null, customer_whatsapp: attr.customer_whatsapp || null,
      utm_source: attr.utm_source || null, utm_medium: attr.utm_medium || null,
      utm_campaign: attr.utm_campaign || null, utm_content: attr.utm_content || null,
      utm_term: attr.utm_term || null,
      fbclid: attr.fbclid || null, gclid: attr.gclid || null,
      fbc: attr.fbc || null, fbp: attr.fbp || null,
      campaign_name: attr.campaign_name || null, campaign_id: attr.campaign_id || null,
      adset_name: attr.adset_name || null, adset_id: attr.adset_id || null,
      ad_name: attr.ad_name || null, ad_id: attr.ad_id || null,
      placement: attr.placement || null,
      first_visit_at: attr.first_visit_at || null,
      landing_page: attr.landing_page || null, referrer: attr.referrer || null,
      buyer_score: attr.buyer_score || 0,
      raw_gateway_response: gwData,
    });

    // Execute DB writes in parallel — await all before returning
    const [ptResult, bookingResult, orderResult] = await Promise.all([ptInsert, bookingUpdate, orderInsert]);
    if (ptResult.error) console.error("[create-payment] payment_transactions insert error:", ptResult.error);
    if (bookingResult.error) console.error("[create-payment] bookings update error:", bookingResult.error);
    if (orderResult.error) console.error("[create-payment] orders insert error:", orderResult.error);

    // ── UTMify (fire-and-forget) ────────────────────────────────
    const utmifyToken = Deno.env.get("UTMIFY_API_TOKEN");
    if (utmifyToken) {
      fetch("https://api.utmify.com.br/api-credentials/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-token": utmifyToken },
        body: JSON.stringify({
          isTest: false, orderId, status: "waiting_payment",
          value: amount, currency: "BRL",
          paymentMethod: paymentMethod || "pix",
          createdAt: new Date().toISOString(), approvedDate: null,
          customer: {
            name: customerName || "", email: customerEmail || "",
            phone: customerPhone || "", document: cpfClean,
          },
          trackingParameters: {
            src: attr.utm_source || null, sck: attr.fbclid || null,
            utm_source: attr.utm_source || null, utm_medium: attr.utm_medium || null,
            utm_campaign: attr.utm_campaign || null, utm_content: attr.utm_content || null,
            utm_term: attr.utm_term || null,
          },
          product: {
            name: `Passagem ${bookingCode}`, id: bookingCode, price: amount, quantity: 1,
          },
        }),
      }).then(r => r.text()).then(t => console.log("[create-payment] UTMify:", t.substring(0, 300)))
        .catch(e => console.error("[create-payment] UTMify error:", e));
    }

    // ── Return to frontend ──────────────────────────────────────
    return jsonResponse({
      success: true,
      transaction_id: transactionId,
      status: txStatus,
      pix_code: pixCode,
      qr_code_url: "",
      qr_code_base64: "",
      amount,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      order_id: orderId,
      provider: "duttyfy",
      raw_response: gwData,
    });
  } catch (err) {
    console.error("[create-payment] Unhandled error:", err);
    return jsonResponse({ error: "Erro interno ao processar pagamento" }, 500);
  }
});
