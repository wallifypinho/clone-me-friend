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

    // Fetch gateway keys from admin_settings
    const { data: keys } = await supabase
      .from("admin_settings").select("key, value")
      .in("key", ["gateway_public_key", "gateway_secret_key", "gateway_api_url"]);

    const publicKey = keys?.find((k: any) => k.key === "gateway_public_key")?.value;
    const secretKey = keys?.find((k: any) => k.key === "gateway_secret_key")?.value;
    const gatewayUrl = keys?.find((k: any) => k.key === "gateway_api_url")?.value || "https://api.hurapayments.com.br/v1/payment-transaction/create";

    if (!publicKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Gateway de pagamento não configurado. Configure as chaves no painel admin." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const amountInCents = Math.round(amount * 100);
    const cpfClean = (customerCpf || "00000000000").replace(/\D/g, "");

    const gatewayPayload: Record<string, any> = {
      amount: amountInCents,
      payment_method: paymentMethod === "pix" ? "pix" : "credit_card",
      postback_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      customer: {
        name: customerName || "Cliente",
        email: customerEmail || "cliente@email.com",
        document: { type: cpfClean.length > 11 ? "cnpj" : "cpf", number: cpfClean },
        phone: customerPhone || "+5500000000000",
      },
      items: [{
        title: `Passagem ${bookingCode}`,
        unit_price: amountInCents, quantity: 1, tangible: false,
      }],
      metadata: {
        booking_code: bookingCode, order_id: orderId,
        session_id: attribution?.session_id || "",
        lead_id: attribution?.lead_id || "",
      },
    };

    if (paymentMethod === "pix") {
      gatewayPayload.pix = { expires_in_days: 1 };
    }

    const endpoint = gatewayUrl.includes("/payment-transaction/create")
      ? gatewayUrl
      : `${gatewayUrl.replace(/\/+$/, "")}/v1/payment-transaction/create`;

    const authStrategies = [
      { name: "Bearer SecretKey", headers: { "Authorization": `Bearer ${secretKey}` } },
      { name: "Basic PK:SK", headers: { "Authorization": `Basic ${btoa(`${publicKey}:${secretKey}`)}` } },
      { name: "Bearer PublicKey", headers: { "Authorization": `Bearer ${publicKey}` } },
      { name: "ApiKey header", headers: { "x-api-key": secretKey } },
    ];

    let lastResponse: Response | null = null;
    let lastResponseText = "";
    let lastStrategy = "";

    for (const strategy of authStrategies) {
      console.log(`Trying auth: ${strategy.name}`);
      try {
        lastResponse = await fetch(endpoint, {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json", ...strategy.headers },
          body: JSON.stringify(gatewayPayload),
        });
        lastResponseText = await lastResponse.text();
        lastStrategy = strategy.name;
        console.log(`${strategy.name} => status ${lastResponse.status}: ${lastResponseText.substring(0, 300)}`);
        if (lastResponse.status !== 401 && lastResponse.status !== 403) break;
      } catch (fetchErr) {
        console.error(`${strategy.name} fetch error:`, fetchErr);
        continue;
      }
    }

    if (!lastResponse) {
      return new Response(
        JSON.stringify({ error: "Não foi possível conectar ao gateway de pagamento" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let gatewayData: any;
    try {
      gatewayData = JSON.parse(lastResponseText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Resposta inválida do gateway", details: lastResponseText.substring(0, 500), auth: lastStrategy }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lastResponse.ok) {
      const isAuthError = lastResponse.status === 401 || lastResponse.status === 403;
      return new Response(
        JSON.stringify({
          error: isAuthError ? "Falha de autenticação no gateway." : `Erro no gateway (${lastResponse.status})`,
          status: lastResponse.status, auth_strategy: lastStrategy, details: gatewayData,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse response
    const responseData = gatewayData?.data || gatewayData;
    const pixData = responseData?.pix || responseData?.Pix || gatewayData?.pix || gatewayData?.Pix || {};
    const txId = responseData?.Id || responseData?.id || gatewayData?.Id || gatewayData?.id;
    const txStatus = responseData?.Status || responseData?.status || "PENDING";

    const pixCode =
      pixData?.qr_code || pixData?.QrCode || pixData?.copy_paste || pixData?.copyAndPaste ||
      pixData?.emv || pixData?.code || responseData?.pix_code || responseData?.PixCode ||
      responseData?.qr_code || responseData?.QrCode || gatewayData?.pix_code || gatewayData?.QrCode || "";

    const qrCodeUrl = pixData?.qr_code_url || pixData?.QrCodeUrl || pixData?.url ||
      responseData?.qr_code_url || responseData?.QrCodeUrl || gatewayData?.qr_code_url || "";

    const qrCodeBase64 = pixData?.qr_code_base64 || pixData?.QrCodeBase64 ||
      responseData?.qr_code_base64 || gatewayData?.qr_code_base64 || "";

    const expiresAt = pixData?.expires_at || pixData?.ExpiresAt ||
      responseData?.ExpiresAt || responseData?.expires_at ||
      gatewayData?.ExpiresAt || new Date(Date.now() + 86400 * 1000).toISOString();

    const result = {
      success: true, transaction_id: txId, status: txStatus,
      pix_code: pixCode, qr_code_url: qrCodeUrl, qr_code_base64: qrCodeBase64,
      amount, auth_strategy: lastStrategy, expires_at: expiresAt,
      order_id: orderId, raw_response: gatewayData,
    };

    // Update booking status
    await supabase.from("bookings")
      .update({ status: "awaiting_payment", payment_method: paymentMethod, gateway_transaction_id: txId })
      .eq("code", bookingCode);

    // Save order with full attribution including _fbc/_fbp
    const attr = attribution || {};
    await supabase.from("orders").insert({
      order_id: orderId, reservation_code: bookingCode,
      lead_id: attr.lead_id || null, session_id: attr.session_id || null,
      visitor_id: attr.visitor_id || null, gateway_transaction_id: txId,
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
      raw_gateway_response: gatewayData,
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
              phone: customerPhone || "",
              document: (customerCpf || "").replace(/\D/g, ""),
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