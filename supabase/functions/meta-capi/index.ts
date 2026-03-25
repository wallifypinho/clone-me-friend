import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("META_CAPI_TOKEN");
    const pixelId = "951061374089610";

    if (!token) {
      return new Response(
        JSON.stringify({
          error: "META_CAPI_TOKEN not configured",
          message: "Add the Meta Conversions API token as a secret to enable server-side events.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { events } = await req.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ error: "No events provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to Meta Conversions API
    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`;

    const payload = {
      data: events.map((evt: any) => ({
        event_name: evt.event_name,
        event_time: evt.event_time,
        event_id: evt.event_id,
        action_source: "website",
        event_source_url: evt.event_source_url || undefined,
        user_data: {
          em: evt.user_data?.email ? [evt.user_data.email] : undefined,
          ph: evt.user_data?.phone ? [evt.user_data.phone] : undefined,
          fn: evt.user_data?.first_name ? [evt.user_data.first_name] : undefined,
          client_ip_address: req.headers.get("x-forwarded-for") || undefined,
          client_user_agent: req.headers.get("user-agent") || undefined,
          fbp: evt.user_data?.fbp || undefined,
          fbc: evt.user_data?.fbc || undefined,
        },
        custom_data: evt.custom_data || {},
      })),
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("CAPI error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
