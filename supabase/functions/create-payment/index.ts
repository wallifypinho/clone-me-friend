import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      amount, bookingCode, customerName, customerCpf, customerEmail, customerPhone, paymentMethod,
      attribution,
    } = body;

    if (!amount || !bookingCode || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: amount, bookingCode, paymentMethod" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // amount comes from frontend in reais (e.g. 60.11) — convert to integer cents
    const amountCents = Math.round(Number(amount) * 100);

    if (amountCents < 100) {
      return new Response(
        JSON.stringify({ error: "Valor mínimo de R$ 1,00" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and clean CPF/CNPJ — digits only
    const cpfClean = (customerCpf || "").replace(/\D/g, "");
    if (cpfClean.length !== 11 && cpfClean.length !== 14) {
      return new Response(
        JSON.stringify({ error: "CPF/CNPJ inválido. Verifique o documento informado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone — digits only, must be 10 or 11 digits
    const phoneClean = (customerPhone || "").replace(/\D/g, "");

    // Get DuttyFy encrypted URL (this IS the auth — no separate API key needed)
    const duttyfyUrl = Deno.env.get("DUTTYFY_ENCRYPTED_URL")?.trim();

    if (!duttyfyUrl) {
      console.error("[create-payment] DUTTYFY_ENCRYPTED_URL not configured");
      return new Response(
        JSON.stringify({ error: "Gateway de pagamento não configurado." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const attr = attribution || {};

    // Build UTM string — forward all tracking params as-is
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

    // DuttyFy payload — amount in CENTS (integer)
    const duttyfyPayload = {
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

    // Debug: log URL length, first 40 chars, last 8 chars
    const urlSuffix = duttyfyUrl.slice(-8);
    const urlPrefix = duttyfyUrl.substring(0, 40);
    console.log(`[create-payment] URL debug: len=${duttyfyUrl.length}, starts="${urlPrefix}", ends="...${urlSuffix}"`);
    console.log(`[create-payment] DuttyFy request for ${bookingCode}:`, JSON.stringify(duttyfyPayload).substring(0, 500));

    // DuttyFy: NO auth headers — the encrypted URL IS the credential
    let gwResponse: Response;
    let gwResponseText: string;

    try {
      gwResponse = await fetch(duttyfyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duttyfyPayload),
      });
      gwResponseText = await gwResponse.text();
      console.log(`[create-payment] DuttyFy response status=${gwResponse.status}: ${gwResponseText.substring(0, 500)}`);
    } catch (fetchErr) {
      console.error(`[create-payment] DuttyFy fetch error:`, fetchErr);

      await supabase.from("integration_logs").insert({
        provider: "duttyfy", action: "create_payment",
        request_payload: duttyfyPayload,
        error_message: String(fetchErr),
        order_id: orderId,
      });

      return new Response(
        JSON.stringify({ error: "Não foi possível conectar ao gateway DuttyFy" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse response
    let gwData: any;
    try {
      gwData = JSON.parse(gwResponseText);
    } catch {
      await supabase.from("integration_logs").insert({
        provider: "duttyfy", action: "create_payment",
        request_payload: duttyfyPayload,
        response_payload: { raw: gwResponseText.substring(0, 2000) },
        status_code: gwResponse.status,
        error_message: "Invalid JSON response",
        order_id: orderId,
      });

      return new Response(
        JSON.stringify({ error: "Resposta inválida do gateway", details: gwResponseText.substring(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the integration call
    await supabase.from("integration_logs").insert({
      provider: "duttyfy", action: "create_payment",
      request_payload: duttyfyPayload,
      response_payload: gwData,
      status_code: gwResponse.status,
      transaction_id: gwData?.transactionId || null,
      order_id: orderId,
      error_message: gwResponse.ok ? null : JSON.stringify(gwData).substring(0, 500),
    });

    // Handle errors
    if (!gwResponse.ok) {
      const rawErrorMsg = gwData?.message ?? gwData?.error ?? `Erro no gateway (${gwResponse.status})`;
      const errorMsg = Array.isArray(rawErrorMsg)
        ? rawErrorMsg.filter(Boolean).join(" ")
        : String(rawErrorMsg);

      let userError = errorMsg;
      const normalizedError = errorMsg.toLowerCase();

      if (normalizedError.includes("cpf") || normalizedError.includes("document")) {
        userError = "CPF inválido. Verifique o documento informado.";
      } else if (normalizedError.includes("mínimo") || normalizedError.includes("minimum")) {
        userError = "Valor mínimo de R$ 1,00 não atingido.";
      } else if (gwResponse.status === 401) {
        userError = "URL encriptada expirada. Regenere no painel DuttyFy.";
      }

      return new Response(
        JSON.stringify({ error: userError, details: gwData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract response fields
    const pixCode = gwData?.pixCode || gwData?.pix_code || gwData?.qr_code || "";
    const transactionId = gwData?.transactionId || gwData?.transaction_id || gwData?.id || "";
    const txStatus = gwData?.status || "PENDING";

    if (!transactionId) {
      console.warn("[create-payment] No transactionId in DuttyFy response");
    }

    // Save payment_transaction — persist transactionId immediately
    await supabase.from("payment_transactions").insert({
      order_id: orderId,
      provider: "duttyfy",
      transaction_id: transactionId,
      amount: Number(amount), // store in reais for display
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
      raw_request: duttyfyPayload,
      raw_response: gwData,
      pix_code: pixCode,
    }).then(({ error }) => {
      if (error) console.error("[create-payment] Error saving payment_transaction:", error);
    });

    // Update booking status
    await supabase.from("bookings")
      .update({ status: "awaiting_payment", payment_method: paymentMethod, gateway_transaction_id: transactionId })
      .eq("code", bookingCode);

    // Save order with full attribution
    await supabase.from("orders").insert({
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
    }).then(({ error }) => {
      if (error) console.error("[create-payment] Error saving order:", error);
    });

    // UTMify waiting_payment
    const utmifyToken = Deno.env.get("UTMIFY_API_TOKEN");
    if (utmifyToken) {
      try {
        const utmifyRes = await fetch("https://api.utmify.com.br/api-credentials/orders", {
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
        });
        const utmifyResult = await utmifyRes.text();
        console.log("[create-payment] UTMify order created:", utmifyResult.substring(0, 300));
      } catch (utmifyErr) {
        console.error("[create-payment] UTMify error:", utmifyErr);
      }
    }

    // Normalized result for frontend
    const result = {
      success: true,
      transaction_id: transactionId,
      status: txStatus,
      pix_code: pixCode,
      qr_code_url: "",
      qr_code_base64: "",
      amount,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min session
      order_id: orderId,
      provider: "duttyfy",
      raw_response: gwData,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar pagamento" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
