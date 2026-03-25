/**
 * Entity Service Layer
 * Manages the lifecycle: Session → Lead → Reservation → Order → Payment → Ticket
 * Runs alongside existing booking/order logic without replacing it.
 */

import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";

// ─── ID Generators ───
function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

// ─── LEAD ───
export async function upsertLead(data: {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  cpf?: string;
}): Promise<string> {
  const sessionId = analytics.getSessionId();
  const visitorId = analytics.getVisitorId();
  const existingLeadData = analytics.getLeadData();
  const leadId = existingLeadData?.lead_id || generateId("lead");

  // Persist in localStorage for analytics
  analytics.identifyLead({ ...data, reservation_code: existingLeadData?.reservation_code });
  if (!existingLeadData?.lead_id) {
    // Store new lead_id
    try {
      const raw = localStorage.getItem("cb_lead_data");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.lead_id = leadId;
      localStorage.setItem("cb_lead_data", JSON.stringify(parsed));
    } catch {}
  }

  // Persist in DB (upsert by lead_id)
  const { error } = await supabase
    .from("leads")
    .upsert(
      {
        lead_id: leadId,
        name: data.name || null,
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        cpf: data.cpf || null,
        session_id: sessionId,
        visitor_id: visitorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lead_id" }
    );

  if (error) console.error("[entities] Error upserting lead:", error);
  return leadId;
}

// ─── RESERVATION ───
export async function createReservation(data: {
  reservationCode: string;
  leadId: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime?: string;
  arrivalTime?: string;
  company?: string;
  seatType?: string;
  seats?: string;
  passengerCount: number;
  baseAmount: number;
  totalAmount: number;
}): Promise<void> {
  const { error } = await supabase.from("reservations").insert({
    reservation_code: data.reservationCode,
    lead_id: data.leadId,
    origin: data.origin,
    destination: data.destination,
    departure_date: data.departureDate,
    departure_time: data.departureTime || null,
    arrival_time: data.arrivalTime || null,
    company: data.company || null,
    seat_type: data.seatType || null,
    seats: data.seats || null,
    passenger_count: data.passengerCount,
    base_amount: data.baseAmount,
    total_amount: data.totalAmount,
    reservation_status: "created",
  });

  if (error) console.error("[entities] Error creating reservation:", error);
}

export async function updateReservationStatus(
  reservationCode: string,
  status: "draft" | "created" | "awaiting_payment" | "paid" | "ticketed" | "canceled" | "expired"
): Promise<void> {
  const { error } = await supabase
    .from("reservations")
    .update({ reservation_status: status, updated_at: new Date().toISOString() })
    .eq("reservation_code", reservationCode);

  if (error) console.error("[entities] Error updating reservation status:", error);
}

// ─── TICKET ───
export async function createTicketRecord(data: {
  reservationCode: string;
  orderId: string;
  passengerName: string;
  passengerCpf: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  seat: string;
}): Promise<string> {
  const ticketId = generateId("tkt");

  const { error } = await supabase.from("tickets").insert({
    ticket_id: ticketId,
    reservation_code: data.reservationCode,
    order_id: data.orderId,
    passenger_name: data.passengerName,
    passenger_cpf: data.passengerCpf,
    origin: data.origin,
    destination: data.destination,
    departure_date: data.departureDate,
    departure_time: data.departureTime,
    seat: data.seat,
    status: "pending",
  });

  if (error) console.error("[entities] Error creating ticket:", error);
  return ticketId;
}

export async function markTicketIssued(ticketId: string, pdfUrl?: string): Promise<void> {
  const { error } = await supabase
    .from("tickets")
    .update({
      status: "issued",
      issued_at: new Date().toISOString(),
      pdf_url: pdfUrl || null,
    })
    .eq("ticket_id", ticketId);

  if (error) console.error("[entities] Error marking ticket issued:", error);
}

// ─── SESSION SCORE UPDATE ───
export async function updateSessionScore(sessionId: string, score: number): Promise<void> {
  const { error } = await supabase
    .from("visitor_sessions")
    .update({ buyer_score: score })
    .eq("session_id", sessionId);

  if (error) console.error("[entities] Error updating session score:", error);
}
