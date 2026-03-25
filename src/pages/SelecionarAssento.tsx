import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { analytics } from "@/lib/analytics";

type SeatStatus = "available" | "selected" | "unavailable";

const generateSeatMap = (): Record<string, SeatStatus> => {
  const seats: Record<string, SeatStatus> = {};
  const unavailable = ["01C", "05B", "06C", "08A", "08B", "09A", "10C"];
  for (let row = 1; row <= 11; row++) {
    for (const col of ["A", "B", "C", "D"]) {
      const id = `${String(row).padStart(2, "0")}${col}`;
      seats[id] = unavailable.includes(id) ? "unavailable" : "available";
    }
  }
  return seats;
};

const SelecionarAssento = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origem = searchParams.get("origem") || "";
  const destino = searchParams.get("destino") || "";
  const data = searchParams.get("data") || "";
  const departure = searchParams.get("departure") || "";
  const arrival = searchParams.get("arrival") || "";
  const company = searchParams.get("company") || "";
  const seatType = searchParams.get("seatType") || "";
  const price = parseFloat(searchParams.get("price") || "0");
  const adultos = parseInt(searchParams.get("adultos") || "1");

  const [seatMap, setSeatMap] = useState(generateSeatMap);
  const selectedSeats = useMemo(
    () => Object.entries(seatMap).filter(([, s]) => s === "selected").map(([id]) => id),
    [seatMap]
  );

  const toggleSeat = (id: string) => {
    setSeatMap((prev) => {
      if (prev[id] === "unavailable") return prev;
      if (prev[id] === "selected") return { ...prev, [id]: "available" };
      if (selectedSeats.length >= adultos) return prev;
      return { ...prev, [id]: "selected" };
    });
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    const [y, m, dd] = d.split("-");
    return `${dd}/${m}/${y}`;
  };

  const total = price * selectedSeats.length;

  useEffect(() => {
    analytics.trackEvent('ViewContent', { content_type: 'seat_selection', origin: origem, destination: destino, company, value: price, currency: 'BRL' });
  }, []);

  const handleConfirm = () => {
    // Internal event only — InitiateCheckout fires on Pagamento page
    analytics.trackEvent('SeatConfirmed', {
      origin: origem, destination: destino, company, amount: total,
      currency: 'BRL', seats: selectedSeats.join(','), passenger_count: adultos,
    });
    analytics.updateScore('PASSENGER_INFO_STARTED');
    const params = new URLSearchParams({
      origem, destino, data, departure, arrival, company, seatType,
      price: String(price),
      adultos: String(adultos),
      seats: selectedSeats.join(","),
    });
    navigate(`/dados-passageiro?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="brand-gradient text-primary-foreground py-3 px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="font-semibold">{origem} → {destino}</p>
            <p className="text-xs opacity-80">
              {formatDate(data)} · {departure} - {arrival} · {company}
            </p>
          </div>
        </div>
      </div>

      {/* Passenger count */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{adultos} adulto{adultos > 1 ? "s" : ""}</span>
        </div>
        <span className="text-sm text-muted-foreground">Selecione {adultos} assento{adultos > 1 ? "s" : ""}</span>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded border-2 border-border bg-background" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded bg-primary" />
          <span>Selecionado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded bg-muted" />
          <span>Indisponível</span>
        </div>
      </div>

      {/* Bus layout */}
      <div className="flex-1 flex justify-center px-4 pb-4">
        <div className="relative w-full max-w-sm">
          {/* Bus shape */}
          <div className="relative bg-gradient-to-b from-accent/60 to-background rounded-t-[60px] pt-8 pb-4 border border-border">
            {/* Windshield mirrors */}
            <div className="absolute -left-4 top-12 w-6 h-10 bg-muted rounded-l-lg border border-border" />
            <div className="absolute -right-4 top-12 w-6 h-10 bg-muted rounded-r-lg border border-border" />

            <div className="text-center mb-4">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-5 py-1.5 rounded-full uppercase tracking-wider">
                Motorista
              </span>
            </div>

            <div className="text-right pr-6 text-[10px] text-muted-foreground mb-2">PORTA →</div>

            {/* Seats grid */}
            <div className="px-6 space-y-2">
              {Array.from({ length: 11 }, (_, row) => {
                const rowNum = String(row + 1).padStart(2, "0");
                return (
                  <div key={row} className="flex items-center justify-center gap-1">
                    {["A", "B"].map((col) => {
                      const id = `${rowNum}${col}`;
                      const status = seatMap[id];
                      return (
                        <button
                          key={id}
                          onClick={() => toggleSeat(id)}
                          disabled={status === "unavailable"}
                          className={`w-12 h-9 rounded text-xs font-semibold transition-all ${
                            status === "selected"
                              ? "bg-primary text-primary-foreground shadow-md"
                              : status === "unavailable"
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-background border-2 border-border hover:border-primary text-foreground"
                          }`}
                        >
                          {id}
                        </button>
                      );
                    })}
                    <div className="w-6" />
                    {["C", "D"].map((col) => {
                      const id = `${rowNum}${col}`;
                      const status = seatMap[id];
                      return (
                        <button
                          key={id}
                          onClick={() => toggleSeat(id)}
                          disabled={status === "unavailable"}
                          className={`w-12 h-9 rounded text-xs font-semibold transition-all ${
                            status === "selected"
                              ? "bg-primary text-primary-foreground shadow-md"
                              : status === "unavailable"
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-background border-2 border-border hover:border-primary text-foreground"
                          }`}
                        >
                          {id}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-4 text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Traseira
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      {selectedSeats.length > 0 && (
        <div className="sticky bottom-0 bg-card border-t border-border px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Assento{selectedSeats.length > 1 ? "s" : ""} selecionado{selectedSeats.length > 1 ? "s" : ""}: <strong className="text-foreground">{selectedSeats.join(", ")}</strong>
            </p>
            <p className="text-xs text-muted-foreground">Valor total</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {total.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <button
            onClick={handleConfirm}
            disabled={selectedSeats.length !== adultos}
            className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-lg text-sm uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      )}
    </div>
  );
};

export default SelecionarAssento;
