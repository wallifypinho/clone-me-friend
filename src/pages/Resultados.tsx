import { useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Search, ArrowLeftRight } from "lucide-react";
import { generateTrips } from "@/data/trips";
import TripCard from "@/components/TripCard";

const Resultados = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origem = searchParams.get("origem") || "";
  const destino = searchParams.get("destino") || "";
  const data = searchParams.get("data") || "";
  const adultos = searchParams.get("adultos") || "1";

  const [origemInput, setOrigemInput] = useState(origem.split(",")[0].trim());
  const [destinoInput, setDestinoInput] = useState(destino.split(",")[0].trim());
  const [dataInput, setDataInput] = useState(data);
  const [dataVoltaInput, setDataVoltaInput] = useState(searchParams.get("dataVolta") || "");

  // Filters
  const [timeFilters, setTimeFilters] = useState<string[]>([]);
  const [seatFilters, setSeatFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("price");

  const trips = useMemo(() => generateTrips(origem, destino), [origem, destino]);

  const filteredTrips = useMemo(() => {
    let result = [...trips];

    if (timeFilters.length > 0) {
      result = result.filter((t) => {
        const h = parseInt(t.departure.split(":")[0]);
        return timeFilters.some((f) => {
          if (f === "manha") return h >= 6 && h < 12;
          if (f === "tarde") return h >= 12 && h < 18;
          if (f === "noite") return h >= 18 && h < 24;
          if (f === "madrugada") return h >= 0 && h < 6;
          return true;
        });
      });
    }

    if (seatFilters.length > 0) {
      result = result.filter((t) => seatFilters.includes(t.seatType));
    }

    if (sortBy === "price") {
      result.sort((a, b) => (a.soldOut ? 1 : 0) - (b.soldOut ? 1 : 0) || a.discountedPrice - b.discountedPrice);
    } else {
      result.sort((a, b) => a.departure.localeCompare(b.departure));
    }

    return result;
  }, [trips, timeFilters, seatFilters, sortBy]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const toggleFilter = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const handleNewSearch = () => {
    const params = new URLSearchParams({
      origem: origemInput,
      destino: destinoInput,
      data: dataInput,
      adultos,
      criancas: "0",
      colos: "0",
    });
    if (dataVoltaInput) params.set("dataVolta", dataVoltaInput);
    navigate(`/resultados?${params.toString()}`);
  };

  const handleInvert = () => {
    const params = new URLSearchParams({
      origem: destino,
      destino: origem,
      data,
      adultos,
      criancas: "0",
      colos: "0",
    });
    navigate(`/resultados?${params.toString()}`);
  };

  const originCity = origem.split(",")[0].trim();
  const destCity = destino.split(",")[0].trim();

  return (
    <div className="min-h-screen bg-muted">
      {/* Top search bar */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container py-3 flex flex-wrap items-center gap-3">
          <Link to="/" className="flex flex-col items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>VOLTAR</span>
          </Link>

          <Link to="/">
            <img src="/images/logo.png" alt="ClickBus" className="h-8" />
          </Link>

          <div className="flex-1 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm bg-background">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={origemInput}
                onChange={(e) => setOrigemInput(e.target.value)}
                className="bg-transparent outline-none w-28"
              />
            </div>
            <div className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm bg-background">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={destinoInput}
                onChange={(e) => setDestinoInput(e.target.value)}
                className="bg-transparent outline-none w-28"
              />
            </div>
            <div className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm bg-background">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="date"
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                className="bg-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm bg-background">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="date"
                value={dataVoltaInput}
                onChange={(e) => setDataVoltaInput(e.target.value)}
                placeholder="Data volta"
                className="bg-transparent outline-none"
              />
            </div>
            <button
              onClick={handleNewSearch}
              className="bg-primary text-primary-foreground px-5 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Route bar */}
      <div className="brand-gradient text-primary-foreground py-3">
        <div className="container flex items-center gap-2 text-sm">
          <span>Passagens de ônibus de</span>
          <strong>{originCity}</strong>
          <span>para</span>
          <strong>{destCity}</strong>
          <button onClick={handleInvert} className="flex items-center gap-1 ml-2 opacity-80 hover:opacity-100 transition-opacity">
            <ArrowLeftRight className="w-4 h-4" />
            Inverter
          </button>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-28">
              <h3 className="font-semibold text-foreground mb-4">Hora da saída</h3>
              {[
                { value: "manha", label: "Manhã (06h - 12h)" },
                { value: "tarde", label: "Tarde (12h - 18h)" },
                { value: "noite", label: "Noite (18h - 00h)" },
                { value: "madrugada", label: "Madrugada (00h - 06h)" },
              ].map((f) => (
                <label key={f.value} className="flex items-center gap-2 text-sm mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timeFilters.includes(f.value)}
                    onChange={() => toggleFilter(timeFilters, f.value, setTimeFilters)}
                    className="accent-primary"
                  />
                  {f.label}
                </label>
              ))}

              <h3 className="font-semibold text-foreground mt-6 mb-4">Tipo de assento</h3>
              {["Convencional", "Semi-Leito", "Leito", "Leito Cama"].map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seatFilters.includes(s)}
                    onChange={() => toggleFilter(seatFilters, s, setSeatFilters)}
                    className="accent-primary"
                  />
                  {s}
                </label>
              ))}

              <h3 className="font-semibold text-foreground mt-6 mb-3">Ordenar por</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              >
                <option value="price">Menor preço</option>
                <option value="time">Horário</option>
              </select>
            </div>
          </aside>

          {/* Trip list */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {originCity} → {destCity} · {formatDate(data)}
              </h2>
              <span className="text-sm text-muted-foreground">{filteredTrips.length} viagens</span>
            </div>

            <div className="space-y-4">
              {filteredTrips.map((trip, i) => (
                <TripCard key={i} trip={trip} />
              ))}
              {filteredTrips.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma viagem encontrada com os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resultados;
