import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Search, Activity } from "lucide-react";

interface VisitorEvent {
  id: string;
  event_name: string;
  event_id: string;
  event_timestamp: string;
  session_id: string | null;
  lead_id: string | null;
  reservation_code: string | null;
  page_url: string | null;
  buyer_score: number | null;
  buyer_stage: string | null;
}

interface PaymentEvent {
  id: string;
  event_id: string;
  order_id: string | null;
  gateway_transaction_id: string | null;
  raw_status: string | null;
  normalized_status: string | null;
  received_at: string;
  is_duplicate: boolean | null;
}

const DiagnosticsTab = () => {
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [paymentEvents, setPaymentEvents] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<"events" | "payments" | "issues">("events");

  const fetchData = async () => {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [eventsRes, paymentsRes] = await Promise.all([
      supabase.from("visitor_events").select("*")
        .gte("event_timestamp", since)
        .order("event_timestamp", { ascending: false })
        .limit(200),
      supabase.from("payment_events").select("*")
        .gte("received_at", since)
        .order("received_at", { ascending: false })
        .limit(100),
    ]);

    setEvents((eventsRes.data as VisitorEvent[]) || []);
    setPaymentEvents((paymentsRes.data as PaymentEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredEvents = events.filter(e =>
    !filter || e.event_name.toLowerCase().includes(filter.toLowerCase()) ||
    e.reservation_code?.toLowerCase().includes(filter.toLowerCase()) ||
    e.session_id?.toLowerCase().includes(filter.toLowerCase())
  );

  // Issues detection
  const duplicatePayments = paymentEvents.filter(e => e.is_duplicate);
  const failedPayments = paymentEvents.filter(e => e.normalized_status === "failed" || e.normalized_status === "expired");
  const purchaseEvents = events.filter(e => e.event_name === "Purchase" || e.event_name === "PurchaseConfirmed");
  const ordersWithoutPurchase = paymentEvents
    .filter(e => e.normalized_status === "paid" && e.order_id)
    .filter(pe => !purchaseEvents.some(ev => {
      try {
        return JSON.stringify(ev).includes(pe.order_id || "___never___");
      } catch { return false; }
    }));

  const eventCounts: Record<string, number> = {};
  events.forEach(e => { eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1; });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Diagnóstico de Eventos
        </h3>
        <button onClick={fetchData} className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs bg-background hover:bg-muted">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-foreground">{events.length}</p>
          <p className="text-xs text-muted-foreground">Eventos (24h)</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-500">{paymentEvents.filter(e => e.normalized_status === "paid").length}</p>
          <p className="text-xs text-muted-foreground">Pagos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-yellow-500">{duplicatePayments.length}</p>
          <p className="text-xs text-muted-foreground">Duplicados</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-destructive">{failedPayments.length}</p>
          <p className="text-xs text-muted-foreground">Erros</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["events", "payments", "issues"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === v ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"}`}>
            {v === "events" ? "Eventos" : v === "payments" ? "Webhooks" : "Problemas"}
          </button>
        ))}
      </div>

      {/* Events view */}
      {view === "events" && (
        <>
          {/* Event counts */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground mb-2">Contagem por Evento</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                <span key={name} className="text-xs bg-muted px-2 py-1 rounded-full">
                  {name}: <strong>{count}</strong>
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar por evento, reserva ou sessão"
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background" />
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80">
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2">Hora</th>
                    <th className="text-left px-3 py-2">Evento</th>
                    <th className="text-left px-3 py-2">Página</th>
                    <th className="text-left px-3 py-2">Reserva</th>
                    <th className="text-left px-3 py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.slice(0, 100).map(e => (
                    <tr key={e.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono">{new Date(e.event_timestamp).toLocaleTimeString("pt-BR")}</td>
                      <td className="px-3 py-2 font-semibold">{e.event_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.page_url}</td>
                      <td className="px-3 py-2 font-mono">{e.reservation_code || "-"}</td>
                      <td className="px-3 py-2">{e.buyer_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Payments view */}
      {view === "payments" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80">
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2">Hora</th>
                  <th className="text-left px-3 py-2">Order ID</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Gateway TX</th>
                  <th className="text-left px-3 py-2">Dup?</th>
                </tr>
              </thead>
              <tbody>
                {paymentEvents.map(e => (
                  <tr key={e.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono">{new Date(e.received_at).toLocaleTimeString("pt-BR")}</td>
                    <td className="px-3 py-2 font-mono">{e.order_id || "-"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        e.normalized_status === "paid" ? "bg-green-100 text-green-700" :
                        e.normalized_status === "failed" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>{e.normalized_status}</span>
                    </td>
                    <td className="px-3 py-2 font-mono truncate max-w-[120px]">{e.gateway_transaction_id || "-"}</td>
                    <td className="px-3 py-2">{e.is_duplicate ? "⚠️" : "✓"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues view */}
      {view === "issues" && (
        <div className="space-y-3">
          {duplicatePayments.length > 0 && (
            <div className="bg-card border border-yellow-300 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" /> {duplicatePayments.length} webhook(s) duplicado(s)
              </p>
              <p className="text-xs text-muted-foreground mt-1">Webhooks duplicados foram recebidos e ignorados corretamente pela deduplicação.</p>
            </div>
          )}

          {failedPayments.length > 0 && (
            <div className="bg-card border border-destructive/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" /> {failedPayments.length} pagamento(s) falharam ou expiraram
              </p>
              <ul className="mt-2 space-y-1">
                {failedPayments.slice(0, 5).map(e => (
                  <li key={e.id} className="text-xs text-muted-foreground font-mono">
                    {e.order_id || e.gateway_transaction_id} — {e.normalized_status} ({new Date(e.received_at).toLocaleString("pt-BR")})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {duplicatePayments.length === 0 && failedPayments.length === 0 && (
            <div className="bg-card border border-green-300 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> Nenhum problema detectado nas últimas 24h
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosticsTab;