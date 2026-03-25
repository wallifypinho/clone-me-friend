import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map gateway statuses to internal normalized statuses
function normalizeStatus(rawStatus: string): string {
  const s = (rawStatus || "").toUpperCase().trim();
  const map: Record<string, string> = {
    PAID: "paid",
    APPROVED: "paid",
    CONFIRMED: "paid",
    CAPTURED: "paid",
    PENDING: "pending",
    WAITING_PAYMENT: "pending",
    PROCESSING: "processing",
    IN_ANALYSIS: "processing",
    FAILED: "failed",
    DECLINED: "failed",
    REFUSED: "failed",
    ERROR: "failed",
    EXPIRED: "expired",
    CANCELED: "canceled",
    CANCELLED: "canceled",
    VOIDED: "canceled",
    REFUNDED: "refunded",
    REVERSED: "refunded",
    CHARGEBACK: "chargeback",
    CHARGED_BACK: "chargeback",
    CREATED: "created",
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
    const body = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      console.error("[webhook] Invalid JSON body:", body.substring(0, 500));
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[webhook] Received:", JSON.stringify(payload).substring(0, 1000));

    // Extract transaction ID and status from HuraPay payload
    // HuraPay may send: { Id, Status, ... } or { data: { id, status, ... } }
    const data = payload?.data || payload;
    const gatewayTxId =
      data?.Id || data?.id || data?.transaction_id || data?.TransactionId || "";
    const rawStatus =
      data?.Status || data?.status || payload?.Status || payload?.status || "";
    const normalizedStatus = normalizeStatus(rawStatus);
    const paidAt =
      data?.PaidAt || data?.paid_at || data?.paidAt || null;

    if (!gatewayTxId) {
      console.warn("[webhook] No transaction ID found in payload");
      return new Response(JSON.stringify({ error: "No transaction ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique event_id for deduplication
    const eventId = `wh_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    // Check for duplicate: same gateway_transaction_id + same normalized_status
    const { data: existingEvents } = await supabase
      .from("payment_events")
      .select("id")
      .eq("gateway_transaction_id", gatewayTxId)
      .eq("normalized_status", normalizedStatus)
      .limit(1);

    const isDuplicate = (existingEvents && existingEvents.length > 0);

    // Always log the webhook event for audit
    await supabase.from("payment_events").insert({
      event_id: eventId,
      gateway_transaction_id: gatewayTxId,
      raw_status: rawStatus,
      normalized_status: normalizedStatus,
      payload_json: payload,
      received_at: new Date().toISOString(),
      processed_at: isDuplicate ? null : new Date().toISOString(),
      is_duplicate: isDuplicate,
    });

    if (isDuplicate) {
      console.log(`[webhook] Duplicate event for ${gatewayTxId} status=${normalizedStatus}, skipping processing`);
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the order by gateway_transaction_id
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("gateway_transaction_id", gatewayTxId)
      .limit(1);

    const order = orders?.[0];

    if (!order) {
      console.warn(`[webhook] No order found for gateway_transaction_id=${gatewayTxId}`);
      // Try to update payment_events with order_id later
      return new Response(JSON.stringify({ success: true, order_found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update payment_events with order_id
    await supabase
      .from("payment_events")
      .update({ order_id: order.order_id, processed_at: new Date().toISOString() })
      .eq("event_id", eventId);

    // Update order status
    const orderUpdate: Record<string, any> = {
      payment_status: normalizedStatus,
      last_gateway_update_at: new Date().toISOString(),
    };

    if (normalizedStatus === "paid") {
      orderUpdate.paid_at = paidAt
        ? new Date(paidAt).toISOString()
        : new Date().toISOString();
    }

    await supabase
      .from("orders")
      .update(orderUpdate)
      .eq("order_id", order.order_id);

    // Update booking status
    if (order.reservation_code) {
      const bookingUpdate: Record<string, any> = {
        status: normalizedStatus === "paid" ? "confirmed" : normalizedStatus,
        gateway_transaction_id: gatewayTxId,
      };
      if (normalizedStatus === "paid") {
        bookingUpdate.paid_at = orderUpdate.paid_at;
      }
      await supabase
        .from("bookings")
        .update(bookingUpdate)
        .eq("code", order.reservation_code);
    }

    // If payment confirmed, update all related entities
    if (normalizedStatus === "paid") {
      console.log(`[webhook] Payment confirmed for order ${order.order_id}, reservation ${order.reservation_code}`);

      // Update orders_attribution
      await supabase
        .from("orders_attribution")
        .update({
          payment_confirmed: true,
          confirmed_at: orderUpdate.paid_at,
          gateway_transaction_id: gatewayTxId,
        })
        .eq("reservation_code", order.reservation_code);

      // Update reservation status to "paid"
      if (order.reservation_code) {
        await supabase
          .from("reservations")
          .update({ reservation_status: "paid", updated_at: new Date().toISOString() })
          .eq("reservation_code", order.reservation_code);
      }

      // Create ticket record (pending issuance)
      const ticketId = `tkt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      await supabase.from("tickets").insert({
        ticket_id: ticketId,
        reservation_code: order.reservation_code,
        order_id: order.order_id,
        passenger_name: order.customer_name || null,
        passenger_cpf: order.customer_cpf || null,
        status: "issued",
        issued_at: new Date().toISOString(),
      });

      // Register PurchaseConfirmed conversion event in visitor_events
      const conversionEventId = `conv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      await supabase.from("visitor_events").insert({
        event_id: conversionEventId,
        session_id: order.session_id || null,
        visitor_id: order.visitor_id || null,
        reservation_code: order.reservation_code,
        event_name: "PurchaseConfirmed",
        page_url: "/webhook",
        payload_json: {
          order_id: order.order_id,
          gateway_transaction_id: gatewayTxId,
          amount: order.amount,
          currency: order.currency,
          paid_at: orderUpdate.paid_at,
          payment_method: order.payment_method,
          utm_source: order.utm_source,
          utm_medium: order.utm_medium,
          utm_campaign: order.utm_campaign,
          utm_content: order.utm_content,
          utm_term: order.utm_term,
          fbclid: order.fbclid,
          campaign_name: order.campaign_name,
          campaign_id: order.campaign_id,
          adset_name: order.adset_name,
          adset_id: order.adset_id,
          ad_name: order.ad_name,
          ad_id: order.ad_id,
          placement: order.placement,
          ticket_id: ticketId,
          confirmed_via: "webhook",
        },
        buyer_score: order.buyer_score || 0,
        buyer_stage: "comprador",
      });

      // Fire server-side CAPI Purchase event if META_CAPI_TOKEN is set
      const metaToken = Deno.env.get("META_CAPI_TOKEN");
      if (metaToken) {
        try {
          const capiPayload = {
            data: [
              {
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                event_id: conversionEventId,
                action_source: "website",
                user_data: {
                  em: order.customer_email ? [order.customer_email] : undefined,
                  ph: order.customer_whatsapp ? [order.customer_whatsapp] : undefined,
                  fn: order.customer_name ? [order.customer_name] : undefined,
                  fbc: order.fbclid ? `fb.1.${Date.now()}.${order.fbclid}` : undefined,
                },
                custom_data: {
                  value: order.amount,
                  currency: order.currency || "BRL",
                  order_id: order.order_id,
                  content_name: `${order.reservation_code}`,
                },
              },
            ],
          };

          const capiRes = await fetch(
            `https://graph.facebook.com/v19.0/951061374089610/events?access_token=${metaToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(capiPayload),
            }
          );
          const capiResult = await capiRes.text();
          console.log("[webhook] CAPI Purchase sent:", capiResult.substring(0, 300));
        } catch (capiErr) {
          console.error("[webhook] CAPI error:", capiErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.order_id,
        normalized_status: normalizedStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[webhook] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error processing webhook" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
