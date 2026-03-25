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
    const { amount, bookingCode, customerName, customerCpf, customerEmail, customerPhone, paymentMethod } = body;

    if (!amount || !bookingCode || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: amount, bookingCode, paymentMethod" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch gateway keys from admin_settings
    const { data: keys } = await supabase
      .from("admin_settings")
      .select("key, value")
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

    // HuraPay API - amount is in centavos (cents)
    const amountInCents = Math.round(amount * 100);
    const cpfClean = (customerCpf || "00000000000").replace(/\D/g, "");

    const gatewayPayload: Record<string, any> = {
      amount: amountInCents,
      payment_method: paymentMethod === "pix" ? "pix" : "credit_card",
      postback_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      customer: {
        name: customerName || "Cliente",
        email: customerEmail || "cliente@email.com",
        document: {
          type: cpfClean.length > 11 ? "cnpj" : "cpf",
          number: cpfClean,
        },
        phone: customerPhone || "+5500000000000",
      },
      items: [
        {
          title: `Passagem ${bookingCode}`,
          unit_price: amountInCents,
          quantity: 1,
          tangible: false,
        },
      ],
      metadata: { booking_code: bookingCode },
    };

    // Add PIX config if applicable
    if (paymentMethod === "pix") {
      gatewayPayload.pix = { expires_in_days: 1 };
    }

    // If the URL already contains the full path, use it directly; otherwise append the path
    const endpoint = gatewayUrl.includes("/payment-transaction/create") 
      ? gatewayUrl 
      : `${gatewayUrl.replace(/\/+$/, "")}/v1/payment-transaction/create`;

    // Try multiple auth strategies
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
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...strategy.headers,
          },
          body: JSON.stringify(gatewayPayload),
        });

        lastResponseText = await lastResponse.text();
        lastStrategy = strategy.name;

        console.log(`${strategy.name} => status ${lastResponse.status}: ${lastResponseText.substring(0, 300)}`);

        // If not 401/403, we found the right auth (even if other error)
        if (lastResponse.status !== 401 && lastResponse.status !== 403) {
          break;
        }
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
          error: isAuthError
            ? "Falha de autenticação no gateway. Verifique as chaves no painel admin."
            : `Erro no gateway (${lastResponse.status})`,
          status: lastResponse.status,
          auth_strategy: lastStrategy,
          details: gatewayData,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse HuraPay response
    // Response format: { Id, Status, Amount, PaymentMethod, ... }
    // For PIX: may contain pix_code/qr_code in nested object or at root
    const txId = gatewayData?.Id || gatewayData?.id || gatewayData?.data?.Id || gatewayData?.data?.id;
    const txStatus = gatewayData?.Status || gatewayData?.status || "PENDING";

    // Try to extract PIX data from various possible response structures
    const pixData = gatewayData?.pix || gatewayData?.Pix || {};
    const pixCode = pixData?.qr_code || pixData?.QrCode || pixData?.code || 
                    gatewayData?.pix_code || gatewayData?.PixCode || 
                    gatewayData?.qr_code || gatewayData?.QrCode || "";
    const pixUrl = pixData?.url || pixData?.Url || gatewayData?.pix_url || "";

    const result = {
      success: true,
      transaction_id: txId,
      status: txStatus,
      pix_code: pixCode,
      qr_code_url: pixUrl,
      qr_code_base64: "",
      amount,
      auth_strategy: lastStrategy,
      expires_at: gatewayData?.ExpiresAt || gatewayData?.expires_at || 
                  new Date(Date.now() + 86400 * 1000).toISOString(),
      raw_response: gatewayData, // Include full response for debugging
    };

    // Update booking status
    await supabase
      .from("bookings")
      .update({ status: "awaiting_payment", payment_method: paymentMethod })
      .eq("code", bookingCode);

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
