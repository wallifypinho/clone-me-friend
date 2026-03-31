import { useNavigate, useSearchParams } from "react-router-dom";
import { Trip } from "@/data/trips";
import { Clock, ChevronRight, Flame } from "lucide-react";
import { analytics } from "@/lib/analytics";

interface TripCardProps {
  trip: Trip;
}

const TripCard = ({ trip }: TripCardProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSelect = () => {
    if (trip.soldOut) return;
    // Internal event
    analytics.trackEvent('RouteSelected', {
      origin: trip.origin, destination: trip.destination, company: trip.company,
      price: trip.discountedPrice, seat_type: trip.seatType,
    });
    // Standard Meta event: AddToCart (user selected a trip/fare)
    analytics.trackEvent('AddToCart', {
      content_name: `${trip.origin} → ${trip.destination}`,
      content_type: 'trip',
      value: trip.discountedPrice,
      currency: 'BRL',
      content_ids: [`${trip.company}-${trip.seatType}-${trip.departure}`],
    });
    analytics.updateScore('ROUTE_SELECTED');
    const params = new URLSearchParams({
      origem: searchParams.get("origem") || trip.origin,
      destino: searchParams.get("destino") || trip.destination,
      data: searchParams.get("data") || "",
      departure: trip.departure,
      arrival: trip.arrival,
      company: trip.company,
      seatType: trip.seatType,
      price: String(trip.discountedPrice),
      adultos: searchParams.get("adultos") || "1",
    });
    navigate(`/selecionar-assento?${params.toString()}`);
  };

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${trip.soldOut ? "opacity-60" : ""}`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{trip.companyLogo}</span>
            <span className="text-xs text-muted-foreground">Viaje Com {trip.company}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-1">
          <div className="text-center shrink-0">
            <p className="text-2xl font-bold text-foreground">{trip.departure}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[100px]">{trip.origin}</p>
          </div>
          <div className="flex-1 mx-4 flex flex-col items-center overflow-hidden min-w-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 whitespace-nowrap">
              <Clock className="w-3 h-3 shrink-0" />
              {trip.duration}
            </div>
            <div className="w-full flex items-center">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <div className="flex-1 border-t-2 border-dashed border-border" />
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            </div>
          </div>
          <div className="text-center shrink-0">
            <p className="text-2xl font-bold text-foreground">{trip.arrival}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[100px]">{trip.destination}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground font-medium">{trip.seatType}</span>
        </div>

        {trip.soldOut ? (
          <span className="offer-badge-sold-out text-sm font-bold">ESGOTADO</span>
        ) : (
          <div className="flex items-center gap-3">
            <div>
              <span className="offer-badge text-xs">% CLICKOFERTA</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground line-through">
                R$ {trip.originalPrice.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-xl font-bold text-foreground whitespace-nowrap">
                R$ {trip.discountedPrice.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <button
              onClick={handleSelect}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {trip.seatsLeft && !trip.soldOut && (
        <div className="px-5 py-2 bg-accent/50 flex items-center gap-2">
          <Flame className="w-4 h-4 text-destructive" />
          <span className="text-xs">
            Últimos <strong className="text-destructive">{trip.seatsLeft} assentos</strong> por esse preço
          </span>
        </div>
      )}
    </div>
  );
};

export default TripCard;