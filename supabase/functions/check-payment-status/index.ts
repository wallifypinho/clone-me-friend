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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { transactionId } = await req.json();
    if (!transactionId) {
      return jsonResponse({ error: "transactionId is required" }, 400);
    }

    // 1. Check local DB first
    const { data: order } = await supabase
      .from("orders")
      .select("payment_status, paid_at, purchase_event_id, order_id, reservation_code")
      .eq("gateway_transaction_id", transactionId)
      .maybeSingle();

    if (order?.payment_status === "paid") {
      return jsonResponse({
        status: "paid", paid_at: order.paid_at,
        purchase_event_id: order.purchase_event_id, source: "database",
      });
    }

    // 2. Poll DuttyFy (proxy-first, fallback to direct)
    const proxyUrl = Deno.env.get("DUTTYFY_PROXY_URL")?.trim();
    const proxySecret = Deno.env.get("DUTTYFY_PROXY_SECRET")?.trim();
    const directUrl = Deno.env.get("DUTTYFY_ENCRYPTED_URL")?.trim();
    const baseUrl = proxyUrl || directUrl;
    const useProxy = !!proxyUrl && !!proxySecret;
    if (!baseUrl) {
      return jsonResponse({ status: order?.payment_status || "unknown", source: "database_only" });
    }

    try {
      const statusUrl = `${baseUrl}?transactionId=${encodeURIComponent(transactionId)}`;
      console.log(`[check-status] Polling via ${useProxy ? "PROXY" : "DIRECT"}, txId=${transactionId.substring(0, 12)}...`);

      const apiKey = Deno.env.get("DUTTYFY_API_KEY") || "";
      const fetchHeaders: Record<string, string> = { Accept: "application/json" };
      if (apiKey) fetchHeaders["x-api-key"] = apiKey;
      if (useProxy && proxySecret) fetchHeaders["x-proxy-secret"] = proxySecret;

      const gwRes = await fetch(statusUrl, {
        method: "GET",
        headers: fetchHeaders,
        signal: AbortSignal.timeout(10_000),
      });

      const gwText = await gwRes.text();
      console.log(`[check-status] Response: status=${gwRes.status}, body=${gwText.substring(0, 300)}`);

      await supabase.from("integration_logs").insert({
        provider: "duttyfy", action: "check_status",
        response_payload: { raw: gwText.substring(0, 2000) },
        status_code: gwRes.status,
        transaction_id: transactionId,
        order_id: order?.order_id || null,
      });

      if (gwRes.ok) {
        let gwData: Record<string, unknown> = {};
        try { gwData = JSON.parse(gwText); } catch { /* ignore */ }

        const rawStatus = (gwData?.status || gwData?.Status || "") as string;
        const normalized = normalizeStatus(rawStatus);
        const paidAt = (gwData?.paidAt || gwData?.paid_at || null) as string | null;

        // Gateway says paid but DB doesn't know → update via conditional UPDATE
        if (normalized === "paid" && order?.payment_status !== "paid") {
          const eventId = `poll_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
          const paidAtTs = paidAt ? new Date(paidAt).toISOString() : new Date().toISOString();

          await Promise.all([
            supabase.from("orders").update({
              payment_status: "paid", paid_at: paidAtTs,
              purchase_event_id: eventId,
              last_gateway_update_at: new Date().toISOString(),
            }).eq("gateway_transaction_id", transactionId),

            order?.reservation_code
              ? supabase.from("bookings").update({ status: "confirmed", paid_at: paidAtTs }).eq("code", order.reservation_code)
              : Promise.resolve(),

            supabase.from("payment_transactions").update({
              status_internal: "paid", status_external: rawStatus,
              paid_at: paidAtTs, updated_at: new Date().toISOString(),
            }).eq("transaction_id", transactionId),

            supabase.from("payment_events").insert({
              event_id: eventId, gateway_transaction_id: transactionId,
              raw_status: rawStatus, normalized_status: "paid",
              payload_json: gwData, received_at: new Date().toISOString(),
              processed_at: new Date().toISOString(),
              order_id: order?.order_id || null,
            }),
          ]);

          return jsonResponse({
            status: "paid", paid_at: paidAtTs,
            purchase_event_id: eventId, source: "gateway_poll",
          });
        }

        return jsonResponse({ status: normalized, raw_status: rawStatus, source: "gateway" });
      }
    } catch (gwErr) {
      console.error("[check-status] Gateway poll error:", gwErr);
    }

    return jsonResponse({ status: order?.payment_status || "unknown", source: "database" });
  } catch (err) {
    console.error("[check-status] Unhandled error:", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
