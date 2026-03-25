import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function toBase64(str: string): string {
  return btoa(str);
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
    const { amount, bookingCode, customerName, customerCpf, customerEmail, paymentMethod } = body;

    if (!amount || !bookingCode || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: amount, bookingCode, paymentMethod" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch gateway keys and URL from admin_settings
    const { data: keys } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["gateway_public_key", "gateway_secret_key", "gateway_api_url"]);

    const publicKey = keys?.find((k: any) => k.key === "gateway_public_key")?.value;
    const secretKey = keys?.find((k: any) => k.key === "gateway_secret_key")?.value;
    const gatewayUrl = keys?.find((k: any) => k.key === "gateway_api_url")?.value || "https://api.hurapay.com.br/v1/transactions";

    if (!publicKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Gateway de pagamento não configurado. Configure as chaves no painel admin." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gatewayPayload: Record<string, any> = {
      paymentMethod: paymentMethod === "pix" ? "pix" : "credit_card",
      amount: Math.round(amount * 100),
      items: [
        {
          title: `Passagem ${bookingCode}`,
          quantity: 1,
          unitPrice: Math.round(amount * 100),
          tangible: false,
        },
      ],
      customer: {
        name: customerName || "Cliente",
        email: customerEmail || "cliente@email.com",
        document: {
          type: (customerCpf || "").length > 11 ? "cnpj" : "cpf",
          number: customerCpf || "00000000000",
        },
      },
    };

    console.log("Calling gateway:", gatewayUrl, JSON.stringify({
      paymentMethod: gatewayPayload.paymentMethod,
      amount: gatewayPayload.amount,
      bookingCode,
    }));

    // Try multiple authentication strategies common in Brazilian payment gateways
    const authStrategies = [
      {
        label: "bearer_secret",
        headers: { "authorization": `Bearer ${secretKey}` },
      },
      {
        label: "bearer_public",
        headers: { "authorization": `Bearer ${publicKey}` },
      },
      {
        label: "custom_headers",
        headers: {
          "x-public-key": publicKey,
          "x-secret-key": secretKey,
        },
      },
      {
        label: "api_key_header",
        headers: { "x-api-key": secretKey },
      },
      {
        label: "basic_public_secret",
        headers: { "authorization": `Basic ${toBase64(`${publicKey}:${secretKey}`)}` },
      },
      {
        label: "basic_secret_public",
        headers: { "authorization": `Basic ${toBase64(`${secretKey}:${publicKey}`)}` },
      },
    ];

    let gatewayResponse: Response | null = null;
    let responseText = "";
    let successLabel = "";

    for (const strategy of authStrategies) {
      try {
        gatewayResponse = await fetch(gatewayUrl, {
          method: "POST",
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            ...strategy.headers,
          },
          body: JSON.stringify(gatewayPayload),
        });

        responseText = await gatewayResponse.text();
        console.log(`Auth strategy [${strategy.label}] → status: ${gatewayResponse.status}`);
        console.log(`Response body: ${responseText.substring(0, 500)}`);

        // If we got anything other than 401/403, this auth worked (or it's a different error)
        if (gatewayResponse.status !== 401 && gatewayResponse.status !== 403) {
          successLabel = strategy.label;
          break;
        }
      } catch (fetchErr) {
        console.error(`Auth strategy [${strategy.label}] fetch error:`, fetchErr);
      }
    }

    let gatewayData: any;
    try {
      gatewayData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse gateway response as JSON:", responseText.substring(0, 200));
      return new Response(
        JSON.stringify({ error: "Resposta inválida do gateway de pagamento", details: responseText.substring(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!gatewayResponse?.ok) {
      const isAuthError = gatewayResponse?.status === 401 || gatewayResponse?.status === 403;
      console.error("Gateway error:", gatewayResponse?.status, gatewayData);
      return new Response(
        JSON.stringify({
          error: isAuthError
            ? "Falha de autenticação no gateway. Verifique as chaves cadastradas no painel admin. Todas as estratégias de autenticação falharam."
            : `Erro no gateway de pagamento (${gatewayResponse?.status})`,
          status: gatewayResponse?.status,
          details: gatewayData,
          tried_strategies: authStrategies.map(s => s.label),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Gateway success with auth strategy: ${successLabel}`);

    const pixData = gatewayData.pix || {};
    const result = {
      success: true,
      transaction_id: gatewayData.id || gatewayData.transactionId,
      status: gatewayData.status || "pending",
      pix_code: pixData.qrcode || pixData.qrCode || pixData.brCode || gatewayData.brCode || gatewayData.pixCode || "",
      qr_code_base64: pixData.qrCodeBase64 || gatewayData.qrCodeBase64 || "",
      qr_code_url: pixData.qrCodeUrl || gatewayData.qrCodeUrl || "",
      amount,
      expires_at: pixData.expirationDate || gatewayData.expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
      raw: gatewayData,
    };

    await supabase
      .from("bookings")
      .update({
        status: "awaiting_payment",
        payment_method: paymentMethod,
      })
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
