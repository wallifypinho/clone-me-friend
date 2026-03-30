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
    PROCESSING: "processing", IN_ANALYSIS: "processing",
    FAILED: "failed", DECLINED: "failed", REFUSED: "failed", ERROR: "failed",
    EXPIRED: "expired",
    CANCELED: "canceled", CANCELLED: "canceled", VOIDED: "canceled",
    REFUNDED: "refunded", REVERSED: "refunded",
    CHARGEBACK: "chargeback", CHARGED_BACK: "chargeback",
    CREATED: "created",
  };
  return map[s] || "unknown";
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
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
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[webhook] Received:", JSON.stringify(payload).substring(0, 1000));

    // DuttyFy sends: { transactionId, status, paidAt?, ... }
    // Also support generic: { data: { Id, Status } }
    const data = payload?.data || payload;
    const gatewayTxId = data?.transactionId || data?.transaction_id || data?.Id || data?.id || data?.TransactionId || "";
    const rawStatus = data?.status || data?.Status || payload?.status || payload?.Status || "";
    const normalizedStatus = normalizeStatus(rawStatus);
    const paidAt = data?.paidAt || data?.PaidAt || data?.paid_at || null;

    if (!gatewayTxId) {
      console.warn("[webhook] No transaction ID found in payload");
      return new Response(JSON.stringify({ error: "No transaction ID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log webhook to integration_logs
    await supabase.from("integration_logs").insert({
      provider: "duttyfy",
      action: "webhook_received",
      request_payload: payload,
      transaction_id: gatewayTxId,
      status_code: 200,
    });

    // Generate unique event_id for deduplication
    const eventId = `wh_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    // Check for duplicate
    const { data: existingEvents } = await supabase
      .from("payment_events").select("id")
      .eq("gateway_transaction_id", gatewayTxId)
      .eq("normalized_status", normalizedStatus).limit(1);

    const isDuplicate = (existingEvents && existingEvents.length > 0);

    // Always log for audit
    await supabase.from("payment_events").insert({
      event_id: eventId, gateway_transaction_id: gatewayTxId,
      raw_status: rawStatus, normalized_status: normalizedStatus,
      payload_json: payload, received_at: new Date().toISOString(),
      processed_at: isDuplicate ? null : new Date().toISOString(),
      is_duplicate: isDuplicate,
    });

    if (isDuplicate) {
      console.log(`[webhook] Duplicate event for ${gatewayTxId} status=${normalizedStatus}`);
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the order
    const { data: orders } = await supabase.from("orders").select("*")
      .eq("gateway_transaction_id", gatewayTxId).limit(1);
    const order = orders?.[0];

    if (!order) {
      console.warn(`[webhook] No order found for gateway_transaction_id=${gatewayTxId}`);
      return new Response(JSON.stringify({ success: true, order_found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update payment_events with order_id
    await supabase.from("payment_events")
      .update({ order_id: order.order_id, processed_at: new Date().toISOString() })
      .eq("event_id", eventId);

    // Update payment_transactions
    const txUpdate: Record<string, any> = {
      status_external: rawStatus,
      status_internal: normalizedStatus === "paid" ? "paid" : normalizedStatus === "pending" ? "waiting_payment" : normalizedStatus,
      updated_at: new Date().toISOString(),
    };
    if (normalizedStatus === "paid") {
      txUpdate.paid_at = paidAt ? new Date(paidAt).toISOString() : new Date().toISOString();
    }
    await supabase.from("payment_transactions")
      .update(txUpdate)
      .eq("transaction_id", gatewayTxId);

    // Update order status
    const orderUpdate: Record<string, any> = {
      payment_status: normalizedStatus,
      last_gateway_update_at: new Date().toISOString(),
    };
    if (normalizedStatus === "paid") {
      orderUpdate.paid_at = paidAt ? new Date(paidAt).toISOString() : new Date().toISOString();
      orderUpdate.purchase_event_id = eventId;
    }

    await supabase.from("orders").update(orderUpdate).eq("order_id", order.order_id);

    // Update booking status
    if (order.reservation_code) {
      const bookingUpdate: Record<string, any> = {
        status: normalizedStatus === "paid" ? "confirmed" : normalizedStatus,
        gateway_transaction_id: gatewayTxId,
      };
      if (normalizedStatus === "paid") bookingUpdate.paid_at = orderUpdate.paid_at;
      await supabase.from("bookings").update(bookingUpdate).eq("code", order.reservation_code);
    }

    // === PAYMENT CONFIRMED (COMPLETED) ===
    if (normalizedStatus === "paid") {
      console.log(`[webhook] Payment confirmed for order ${order.order_id}`);

      // Update orders_attribution
      await supabase.from("orders_attribution").update({
        payment_confirmed: true, confirmed_at: orderUpdate.paid_at,
        gateway_transaction_id: gatewayTxId,
      }).eq("reservation_code", order.reservation_code);

      // Update reservation
      if (order.reservation_code) {
        await supabase.from("reservations").update({
          reservation_status: "paid", updated_at: new Date().toISOString(),
        }).eq("reservation_code", order.reservation_code);
      }

      // Create ticket
      const ticketId = `tkt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      await supabase.from("tickets").insert({
        ticket_id: ticketId, reservation_code: order.reservation_code,
        order_id: order.order_id, passenger_name: order.customer_name || null,
        passenger_cpf: order.customer_cpf || null,
        status: "issued", issued_at: new Date().toISOString(),
      });

      // PurchaseConfirmed in visitor_events
      await supabase.from("visitor_events").insert({
        event_id: eventId, session_id: order.session_id || null,
        visitor_id: order.visitor_id || null,
        reservation_code: order.reservation_code,
        event_name: "PurchaseConfirmed", page_url: "/webhook",
        payload_json: {
          order_id: order.order_id, gateway_transaction_id: gatewayTxId,
          amount: order.amount, currency: order.currency,
          paid_at: orderUpdate.paid_at, payment_method: order.payment_method,
          utm_source: order.utm_source, fbclid: order.fbclid,
          campaign_name: order.campaign_name, ticket_id: ticketId,
          confirmed_via: "webhook", provider: "duttyfy",
        },
        buyer_score: order.buyer_score || 0, buyer_stage: "comprador",
      });

      // === META CAPI Purchase ===
      const metaToken = Deno.env.get("META_CAPI_TOKEN");
      if (metaToken) {
        try {
          const userData: Record<string, any> = {};
          if (order.customer_email) userData.em = [await sha256(order.customer_email)];
          if (order.customer_whatsapp) {
            const phone = order.customer_whatsapp.replace(/\D/g, "");
            userData.ph = [await sha256(phone.startsWith("55") ? phone : `55${phone}`)];
          }
          if (order.customer_name) {
            const names = order.customer_name.trim().split(/\s+/);
            userData.fn = [await sha256(names[0])];
            if (names.length > 1) userData.ln = [await sha256(names[names.length - 1])];
          }
          if (order.fbc) userData.fbc = order.fbc;
          else if (order.fbclid) userData.fbc = `fb.1.${Date.now()}.${order.fbclid}`;
          if (order.fbp) userData.fbp = order.fbp;

          userData.client_ip_address = "0.0.0.0";
          userData.client_user_agent = "server";

          const capiPayload = {
            data: [{
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              event_id: eventId,
              action_source: "website",
              user_data: userData,
              custom_data: {
                value: order.amount,
                currency: order.currency || "BRL",
                order_id: order.order_id,
                content_name: order.reservation_code || order.order_id,
              },
            }],
          };

          const capiRes = await fetch(
            `https://graph.facebook.com/v19.0/951061374089610/events?access_token=${metaToken}`,
            { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(capiPayload) }
          );
          const capiResult = await capiRes.text();
          console.log("[webhook] CAPI Purchase sent:", capiResult.substring(0, 300));

          // Log CAPI call
          await supabase.from("integration_logs").insert({
            provider: "meta_capi",
            action: "purchase_event",
            request_payload: capiPayload,
            response_payload: { raw: capiResult.substring(0, 2000) },
            status_code: capiRes.status,
            transaction_id: gatewayTxId,
            order_id: order.order_id,
          });
        } catch (capiErr) {
          console.error("[webhook] CAPI error:", capiErr);
        }
      }

      // === UTMify paid ===
      const utmifyToken = Deno.env.get("UTMIFY_API_TOKEN");
      if (utmifyToken) {
        try {
          const utmifyRes = await fetch("https://api.utmify.com.br/api-credentials/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-token": utmifyToken },
            body: JSON.stringify({
              isTest: false, orderId: order.order_id, status: "paid",
              value: order.amount, currency: order.currency || "BRL",
              paymentMethod: order.payment_method || "pix",
              createdAt: order.created_at, approvedDate: orderUpdate.paid_at,
              customer: {
                name: order.customer_name || "", email: order.customer_email || "",
                phone: order.customer_whatsapp || "", document: order.customer_cpf || "",
              },
              trackingParameters: {
                src: order.utm_source || null, sck: order.fbclid || null,
                utm_source: order.utm_source || null, utm_medium: order.utm_medium || null,
                utm_campaign: order.utm_campaign || null, utm_content: order.utm_content || null,
                utm_term: order.utm_term || null,
              },
              product: {
                name: `Passagem ${order.reservation_code || ""}`,
                id: order.reservation_code || order.order_id,
                price: order.amount, quantity: 1,
              },
            }),
          });
          const utmifyResult = await utmifyRes.text();
          console.log("[webhook] UTMify paid sent:", utmifyResult.substring(0, 300));
        } catch (utmifyErr) {
          console.error("[webhook] UTMify error:", utmifyErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, order_id: order.order_id, normalized_status: normalizedStatus }),
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
