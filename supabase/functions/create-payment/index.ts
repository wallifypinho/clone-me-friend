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

function getGatewayConfig() {
  const proxyUrl = Deno.env.get("DUTTYFY_PROXY_URL")?.trim();
  const proxySecret = Deno.env.get("DUTTYFY_PROXY_SECRET")?.trim();
  const directUrl = Deno.env.get("DUTTYFY_ENCRYPTED_URL")?.trim();

  if (proxyUrl && proxySecret) {
    return {
      url: proxyUrl,
      mode: "proxy",
      headers: {
        "Content-Type": "application/json",
        "x-proxy-secret": proxySecret,
      },
    };
  }

  if (directUrl) {
    return {
      url: directUrl,
      mode: "direct",
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  return null;
}

async function getGatewayConfigFromDb(supabase: ReturnType<typeof createClient>) {
  // Try to read gateway credentials from admin_settings (allows runtime config via admin panel)
  const { data } = await supabase
    .from("admin_settings")
    .select("key, value")
    .in("key", ["duttyfy_encrypted_url", "duttyfy_api_key"]);

  const settings: Record<string, string> = {};
  if (data) {
    for (const row of data as { key: string; value: string }[]) {
      settings[row.key] = row.value;
    }
  }

  const dbUrl = settings["duttyfy_encrypted_url"]?.trim();
  const dbApiKey = settings["duttyfy_api_key"]?.trim();

  if (dbUrl) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (dbApiKey) {
      headers["x-api-key"] = dbApiKey;
    }
    return { url: dbUrl, mode: "database", headers };
  }

  return null;
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

    // Phone: digits only, 10 or 11 (required by DuttyFy)
    const phoneClean = (customerPhone || "").replace(/\D/g, "");
    if (phoneClean.length !== 10 && phoneClean.length !== 11) {
      return jsonResponse({ error: "Telefone inválido. Informe DDD + número (10 ou 11 dígitos)." }, 400);
    }

    // ── Gateway URL (Encrypted URL = endpoint + credential) ─────
    // Priority: 1) admin_settings DB  2) env vars  3) proxy
    let gatewayConfig = await getGatewayConfigFromDb(supabase);
    if (!gatewayConfig) {
      gatewayConfig = getGatewayConfig();
    }
    if (!gatewayConfig) {
      console.error("[create-payment] DUTTYFY gateway not configured");
      return jsonResponse({ error: "Gateway de pagamento não configurado." }, 422);
    }

    // ── Build IDs ───────────────────────────────────────────────
    const orderId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const attr = attribution || {};

    // UTM: forward raw query string from frontend as-is (per DuttyFy contract)
    const utmRaw = (body.utm || "").trim();

    // ── DuttyFy payload (amount in CENTS, no auth headers) ──────
    // IMPORTANT: Only send minimal, generic info to gateway — no product details
    const gatewayPayload = {
      amount: amountCents,
      description: "Oferta Promocional",
      customer: {
        name: customerName || "Cliente",
        document: cpfClean,
        email: customerEmail || "cliente@email.com",
        phone: phoneClean || "00000000000",
      },
      item: {
        title: "Serviços Digitais",
        price: amountCents,
        quantity: 1,
      },
      paymentMethod: "PIX",
      utm: utmParts || orderId,
    };

    // ── Safe logging (only last 8 chars of URL) ─────────────────
    console.log(`[create-payment] Mode=${gatewayConfig.mode}, URL: len=${gatewayConfig.url.length}, ends="...${gatewayConfig.url.slice(-8)}"`);
    console.log(`[create-payment] Payload: ref=${orderId}, amount=${amountCents}cents, doc=${cpfClean.length}d, phone=${phoneClean.length}d`);

    // ── Call gateway with retry (exponential backoff on 5xx) ────
    let gwResponse: Response | null = null;
    let gwResponseText = "";
    let lastError: unknown = null;
    const retryDelays = [0, 1000, 2000, 4000];

    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      if (attempt > 0) {
        console.log(`[create-payment] Retry #${attempt} after ${retryDelays[attempt]}ms`);
        await new Promise(r => setTimeout(r, retryDelays[attempt]));
      }

      try {
        // Per DuttyFy docs: NO auth headers. Encrypted URL IS the credential.
        gwResponse = await fetch(gatewayConfig.url, {
          method: "POST",
          headers: gatewayConfig.headers,
          body: JSON.stringify(gatewayPayload),
          signal: AbortSignal.timeout(15_000),
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
      item_title: "Serviços Digitais",
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
            name: "Serviços Digitais", id: orderId, price: amount, quantity: 1,
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
