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

    // Fetch gateway keys and URL from admin_settings
    const { data: keys } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["gateway_public_key", "gateway_secret_key", "gateway_api_url"]);

    const publicKey = keys?.find((k: any) => k.key === "gateway_public_key")?.value;
    const secretKey = keys?.find((k: any) => k.key === "gateway_secret_key")?.value;
    const gatewayUrl = keys?.find((k: any) => k.key === "gateway_api_url")?.value || "https://api.hurapayments.com.br";

    if (!publicKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Gateway de pagamento não configurado. Configure as chaves no painel admin." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // HuraPay API uses Basic Auth: base64(public_key:secret_key)
    const basicAuth = btoa(`${publicKey}:${secretKey}`);

    const gatewayPayload: Record<string, any> = {
      payment_method: paymentMethod === "pix" ? "pix" : "credit_card",
      amount: Math.round(amount * 100), // amount in cents
      customer: {
        name: customerName || "Cliente",
        email: customerEmail || "cliente@email.com",
        document: {
          type: (customerCpf || "").replace(/\D/g, "").length > 11 ? "cnpj" : "cpf",
          number: (customerCpf || "00000000000").replace(/\D/g, ""),
        },
        phone: customerPhone || "+5500000000000",
      },
      items: [
        {
          title: `Passagem ${bookingCode}`,
          unit_price: Math.round(amount * 100),
          quantity: 1,
          tangible: false,
        },
      ],
      postback_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      metadata: JSON.stringify({ booking_code: bookingCode }),
    };

    // Add PIX expiration if PIX
    if (paymentMethod === "pix") {
      gatewayPayload.pix = { expires_in_days: 1 };
    }

    const endpoint = `${gatewayUrl}/v1/payment-transaction/create`;
    console.log("Calling HuraPay:", endpoint, JSON.stringify({
      payment_method: gatewayPayload.payment_method,
      amount: gatewayPayload.amount,
      bookingCode,
    }));

    const gatewayResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify(gatewayPayload),
    });

    const responseText = await gatewayResponse.text();
    console.log(`HuraPay status: ${gatewayResponse.status}`);
    console.log(`HuraPay response: ${responseText.substring(0, 1000)}`);

    let gatewayData: any;
    try {
      gatewayData = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Resposta inválida do gateway de pagamento", details: responseText.substring(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!gatewayResponse.ok) {
      const isAuthError = gatewayResponse.status === 401 || gatewayResponse.status === 403;
      console.error("HuraPay error:", gatewayResponse.status, gatewayData);
      return new Response(
        JSON.stringify({
          error: isAuthError
            ? "Falha de autenticação no gateway. Verifique as chaves Public Key e Secret Key no painel admin."
            : `Erro no gateway de pagamento (${gatewayResponse.status})`,
          status: gatewayResponse.status,
          details: gatewayData,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse HuraPay response - data is an array
    const txData = Array.isArray(gatewayData?.data) ? gatewayData.data[0] : gatewayData?.data || gatewayData;
    const pixInfo = Array.isArray(txData?.pix) ? txData.pix[0] : txData?.pix || {};

    const result = {
      success: true,
      transaction_id: txData?.id || gatewayData?.id,
      status: txData?.status || "PENDING",
      pix_code: pixInfo?.qr_code || "",
      qr_code_url: pixInfo?.url || "",
      qr_code_base64: "",
      amount,
      expires_at: pixInfo?.expiration_date || new Date(Date.now() + 86400 * 1000).toISOString(),
    };

    // Update booking status
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
