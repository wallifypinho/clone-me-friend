import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeStatus(rawStatus: string): string {
  const s = (rawStatus || "").toUpperCase().trim();
  const map: Record<string, string> = {
    PAID: "paid", APPROVED: "paid", CONFIRMED: "paid", CAPTURED: "paid", COMPLETED: "paid",
    PENDING: "pending", WAITING_PAYMENT: "pending",
    FAILED: "failed", DECLINED: "failed", REFUSED: "failed",
    EXPIRED: "expired", CANCELED: "canceled", CANCELLED: "canceled",
  };
  return map[s] || "unknown";
}

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
      .select("payment_status, paid_at, purchase_event_id, order_id, reservation_code")
      .eq("gateway_transaction_id", transactionId)
      .maybeSingle();

    if (order?.payment_status === "paid") {
      return new Response(
        JSON.stringify({ status: "paid", paid_at: order.paid_at, purchase_event_id: order.purchase_event_id, source: "database" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fallback: query DuttyFy status endpoint
    const duttyfyApiKey = Deno.env.get("DUTTYFY_API_KEY");
    const duttyfyStatusUrl = Deno.env.get("DUTTYFY_STATUS_URL");

    if (!duttyfyApiKey || !duttyfyStatusUrl) {
      return new Response(
        JSON.stringify({ status: order?.payment_status || "unknown", source: "database_only" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const statusEndpoint = `${duttyfyStatusUrl}?transactionId=${encodeURIComponent(transactionId)}`;
      const gwRes = await fetch(statusEndpoint, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${duttyfyApiKey}`,
        },
      });

      const gwResponseText = await gwRes.text();
      console.log(`[check-payment-status] DuttyFy status response: ${gwResponseText.substring(0, 500)}`);

      // Log the query
      await supabase.from("integration_logs").insert({
        provider: "duttyfy",
        action: "check_status",
        response_payload: { raw: gwResponseText.substring(0, 2000) },
        status_code: gwRes.status,
        transaction_id: transactionId,
        order_id: order?.order_id || null,
      });

      if (gwRes.ok) {
        let gwData: any;
        try { gwData = JSON.parse(gwResponseText); } catch { gwData = {}; }

        const rawStatus = gwData?.status || gwData?.Status || "";
        const normalized = normalizeStatus(rawStatus);
        const paidAt = gwData?.paidAt || gwData?.paid_at || gwData?.PaidAt || null;

        // If gateway says paid but our DB doesn't know yet, update
        if (normalized === "paid" && order?.payment_status !== "paid") {
          const eventId = `poll_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
          const paidAtTs = paidAt ? new Date(paidAt).toISOString() : new Date().toISOString();

          await supabase.from("orders").update({
            payment_status: "paid",
            paid_at: paidAtTs,
            purchase_event_id: eventId,
            last_gateway_update_at: new Date().toISOString(),
          }).eq("gateway_transaction_id", transactionId);

          // Update booking
          if (order?.reservation_code) {
            await supabase.from("bookings").update({
              status: "confirmed",
              paid_at: paidAtTs,
            }).eq("code", order.reservation_code);
          }

          // Update payment_transaction
          await supabase.from("payment_transactions").update({
            status_internal: "paid",
            status_external: rawStatus,
            paid_at: paidAtTs,
            updated_at: new Date().toISOString(),
          }).eq("transaction_id", transactionId);

          // Log payment event
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
            JSON.stringify({ status: "paid", paid_at: paidAtTs, purchase_event_id: eventId, source: "gateway_poll" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ status: normalized, raw_status: rawStatus, source: "gateway" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (gwErr) {
      console.error("[check-payment-status] DuttyFy query error:", gwErr);
    }

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
