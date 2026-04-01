import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Send, ArrowDownUp, Calendar, Search } from "lucide-react";
import { searchCidades, formatCityDisplay } from "@/data/cidadesBrasil";

const SearchForm = () => {
  const navigate = useNavigate();
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [tripType, setTripType] = useState<"ida" | "ida-volta">("ida");
  const [dataIda, setDataIda] = useState("");
  const [dataVolta, setDataVolta] = useState("");
  const [passageiros, setPassageiros] = useState(1);
  const [showOrigemSuggestions, setShowOrigemSuggestions] = useState(false);
  const [showDestinoSuggestions, setShowDestinoSuggestions] = useState(false);

  const filteredOrigem = searchCidades(origem, 10).map(formatCityDisplay);
  const filteredDestino = searchCidades(destino, 10).map(formatCityDisplay);

  const swapCities = () => {
    setOrigem(destino);
    setDestino(origem);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origem || !destino || !dataIda) return;

    const params = new URLSearchParams({
      origem,
      destino,
      data: dataIda,
      adultos: String(passageiros),
      criancas: "0",
      colos: "0",
    });
    if (tripType === "ida-volta" && dataVolta) {
      params.set("dataVolta", dataVolta);
    }
    navigate(`/resultados?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-card rounded-2xl shadow-2xl shadow-black/10 p-5 sm:p-6 lg:p-8 max-w-4xl mx-auto relative z-10 border border-border/50"
    >
      <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 text-center">
        Compre sua passagem de ônibus
      </h2>

      {/* Origin / Destination stacked with swap on right */}
      <div className="flex items-stretch gap-0 mb-4">
        <div className="flex-1 border border-border rounded-xl overflow-visible relative">
          {/* Origin */}
          <div className="relative">
            <label className="text-[11px] font-medium text-muted-foreground px-4 pt-2.5 block tracking-wide">
              Origem
            </label>
            <div className="flex items-center px-4 pb-2.5">
              <MapPin className="w-4 h-4 text-primary mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="De onde você vai sair?"
                value={origem}
                onChange={(e) => { setOrigem(e.target.value); setShowOrigemSuggestions(true); }}
                onFocus={() => setShowOrigemSuggestions(true)}
                onBlur={() => setTimeout(() => setShowOrigemSuggestions(false), 200)}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            {showOrigemSuggestions && origem && filteredOrigem.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                {filteredOrigem.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    onMouseDown={() => { setOrigem(city); setShowOrigemSuggestions(false); }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border w-full" />

          {/* Destination */}
          <div className="relative">
            <label className="text-[11px] font-medium text-muted-foreground px-4 pt-2.5 block tracking-wide">
              Destino
            </label>
            <div className="flex items-center px-4 pb-2.5">
              <Send className="w-4 h-4 text-primary mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="Para onde você vai?"
                value={destino}
                onChange={(e) => { setDestino(e.target.value); setShowDestinoSuggestions(true); }}
                onFocus={() => setShowDestinoSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDestinoSuggestions(false), 200)}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            {showDestinoSuggestions && destino && filteredDestino.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                {filteredDestino.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    onMouseDown={() => { setDestino(city); setShowDestinoSuggestions(false); }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Swap button on the right */}
        <div className="flex items-center pl-3">
          <button
            type="button"
            onClick={swapCities}
            className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:opacity-90 transition-all shadow-md"
          >
            <ArrowDownUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trip Type */}
      <div className="flex items-center gap-6 mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer group">
          <input
            type="radio"
            checked={tripType === "ida"}
            onChange={() => setTripType("ida")}
            className="accent-primary w-4 h-4"
          />
          <span className="text-foreground font-medium group-hover:text-primary transition-colors">Somente Ida</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer group">
          <input
            type="radio"
            checked={tripType === "ida-volta"}
            onChange={() => setTripType("ida-volta")}
            className="accent-primary w-4 h-4"
          />
          <span className="text-foreground font-medium group-hover:text-primary transition-colors">Ida e Volta</span>
        </label>
      </div>

      {/* Dates side by side */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border border-border rounded-xl px-4 py-2.5 hover:border-primary/40 transition-colors">
          <label className="text-[11px] font-medium text-muted-foreground block tracking-wide">
            Data de ida
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <input
              type="date"
              value={dataIda}
              onChange={(e) => setDataIda(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
              required
            />
          </div>
        </div>

        <div className={`border border-border rounded-xl px-4 py-2.5 transition-colors ${tripType === "ida" ? "opacity-40 pointer-events-none" : "hover:border-primary/40"}`}>
          <label className="text-[11px] font-medium text-muted-foreground block tracking-wide">
            Data de volta
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <input
              type="date"
              value={dataVolta}
              onChange={(e) => setDataVolta(e.target.value)}
              disabled={tripType === "ida"}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </div>
        </div>
      </div>

      {/* Hidden passengers (kept for functionality) */}
      <input type="hidden" value={passageiros} />

      {/* Search button full width */}
      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-all flex items-center gap-2.5 justify-center shadow-lg shadow-primary/25 hover:shadow-primary/40"
      >
        Buscar
      </button>
    </form>
  );
};

export default SearchForm;
