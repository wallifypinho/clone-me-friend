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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: "transactionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Check local DB first
    const { data: order } = await supabase
      .from("orders")
      .select("payment_status, paid_at, purchase_event_id, order_id")
      .eq("gateway_transaction_id", transactionId)
      .maybeSingle();

    if (order?.payment_status === "paid") {
      return new Response(
        JSON.stringify({ status: "paid", paid_at: order.paid_at, purchase_event_id: order.purchase_event_id, source: "database" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fallback: query gateway directly
    const { data: keys } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["gateway_secret_key", "gateway_api_url"]);

    const secretKey = keys?.find((k: any) => k.key === "gateway_secret_key")?.value;
    const gatewayBaseUrl = keys?.find((k: any) => k.key === "gateway_api_url")?.value || "https://api.hurapayments.com.br";

    if (!secretKey) {
      return new Response(
        JSON.stringify({ status: order?.payment_status || "unknown", source: "database_only" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to check status at gateway
    const statusUrl = `${gatewayBaseUrl.replace(/\/+$/, "").replace(/\/v1\/payment-transaction\/create$/, "")}/v1/payment-transaction/${transactionId}`;

    try {
      const gwRes = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${secretKey}`,
        },
      });

      if (gwRes.ok) {
        const gwData = await gwRes.json();
        const data = gwData?.data || gwData;
        const rawStatus = (data?.Status || data?.status || "").toUpperCase();

        const statusMap: Record<string, string> = {
          PAID: "paid", APPROVED: "paid", CONFIRMED: "paid", CAPTURED: "paid", COMPLETED: "paid",
          PENDING: "pending", WAITING_PAYMENT: "pending",
          FAILED: "failed", DECLINED: "failed", REFUSED: "failed",
          EXPIRED: "expired", CANCELED: "canceled", CANCELLED: "canceled",
        };
        const normalized = statusMap[rawStatus] || "unknown";

        // If gateway says paid but our DB doesn't know yet, update it
        if (normalized === "paid" && order?.payment_status !== "paid") {
          const eventId = `poll_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
          const paidAt = data?.PaidAt || data?.paid_at || new Date().toISOString();

          await supabase.from("orders").update({
            payment_status: "paid",
            paid_at: paidAt,
            purchase_event_id: eventId,
            last_gateway_update_at: new Date().toISOString(),
          }).eq("gateway_transaction_id", transactionId);

          // Update booking too
          if (order?.order_id) {
            const { data: orderFull } = await supabase
              .from("orders")
              .select("reservation_code")
              .eq("gateway_transaction_id", transactionId)
              .maybeSingle();

            if (orderFull?.reservation_code) {
              await supabase.from("bookings").update({
                status: "confirmed",
                paid_at: paidAt,
              }).eq("code", orderFull.reservation_code);
            }
          }

          // Log the event
          await supabase.from("payment_events").insert({
            event_id: eventId,
            gateway_transaction_id: transactionId,
            raw_status: rawStatus,
            normalized_status: "paid",
            payload_json: gwData,
            received_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
            order_id: order?.order_id || null,
          });

          return new Response(
            JSON.stringify({ status: "paid", paid_at: paidAt, purchase_event_id: eventId, source: "gateway_poll" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ status: normalized, raw_status: rawStatus, source: "gateway" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (gwErr) {
      console.error("[check-payment-status] Gateway query error:", gwErr);
    }

    // Return DB status as last resort
    return new Response(
      JSON.stringify({ status: order?.payment_status || "unknown", source: "database" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[check-payment-status] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
