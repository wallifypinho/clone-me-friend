import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ArrowLeftRight, Calendar, Users, Search } from "lucide-react";

const CITIES = [
  "São Paulo, SP - Terminal Rodoviário do Tietê",
  "São Paulo, SP - Terminal Rodoviário Barra Funda",
  "São Paulo, SP - Terminal Rodoviário Jabaquara",
  "Rio de Janeiro, RJ - Rodoviária Novo Rio",
  "Curitiba, PR - Terminal Rodoviário de Curitiba",
  "Campinas, SP - Terminal Rodoviário de Campinas",
  "Salvador, BA - Rodoviária de Salvador",
  "Brasília, DF - Rodoviária Interestadual de Brasília",
  "Florianópolis, SC - Terminal Rodoviário Rita Maria",
  "Porto Alegre, RS - Estação Rodoviária de Porto Alegre",
  "Goiânia, GO - Terminal Rodoviário de Goiânia",
  "Belo Horizonte, MG",
];

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

  const filteredOrigem = CITIES.filter((c) =>
    c.toLowerCase().includes(origem.toLowerCase())
  );
  const filteredDestino = CITIES.filter((c) =>
    c.toLowerCase().includes(destino.toLowerCase())
  );

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
      <h2 className="text-base sm:text-lg font-bold text-foreground mb-5">
        Compre Sua Passagem de Ônibus Online
      </h2>

      {/* Origin / Destination */}
      <div className="flex flex-col sm:flex-row items-stretch gap-0 border border-border rounded-xl overflow-visible mb-4 relative">
        {/* Origin */}
        <div className="flex-1 relative">
          <label className="text-[11px] font-medium text-muted-foreground px-4 pt-3 block tracking-wide uppercase">
            Origem
          </label>
          <div className="flex items-center px-4 pb-3">
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

        {/* Swap button */}
        <button
          type="button"
          onClick={swapCities}
          className="absolute left-1/2 sm:top-1/2 top-[calc(50%-1px)] -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-card border-2 border-border rounded-full flex items-center justify-center hover:bg-accent hover:border-primary/30 transition-all shadow-sm"
        >
          <ArrowLeftRight className="w-4 h-4 text-primary" />
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px bg-border self-stretch" />
        <div className="sm:hidden h-px bg-border w-full" />

        {/* Destination */}
        <div className="flex-1 relative">
          <label className="text-[11px] font-medium text-muted-foreground px-4 pt-3 block tracking-wide uppercase">
            Destino
          </label>
          <div className="flex items-center px-4 pb-3">
            <MapPin className="w-4 h-4 text-primary mr-2.5 shrink-0" />
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

      {/* Trip Type */}
      <div className="flex items-center gap-5 mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer group">
          <input
            type="radio"
            checked={tripType === "ida"}
            onChange={() => setTripType("ida")}
            className="accent-primary w-4 h-4"
          />
          <span className="text-foreground group-hover:text-primary transition-colors">Somente Ida</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer group">
          <input
            type="radio"
            checked={tripType === "ida-volta"}
            onChange={() => setTripType("ida-volta")}
            className="accent-primary w-4 h-4"
          />
          <span className="text-foreground group-hover:text-primary transition-colors">Ida e Volta</span>
        </label>
      </div>

      {/* Date / Passengers / Search */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        {/* Data Ida */}
        <div className="flex-1 border border-border rounded-xl px-4 py-2.5 hover:border-primary/40 transition-colors">
          <label className="text-[11px] font-medium text-muted-foreground block tracking-wide uppercase">
            Ida
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

        {/* Data Volta */}
        <div className={`flex-1 border border-border rounded-xl px-4 py-2.5 transition-colors ${tripType === "ida" ? "opacity-40 pointer-events-none" : "hover:border-primary/40"}`}>
          <label className="text-[11px] font-medium text-muted-foreground block tracking-wide uppercase">
            Volta
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

        {/* Passageiros */}
        <div className="flex-1 border border-border rounded-xl px-4 py-2.5 hover:border-primary/40 transition-colors">
          <label className="text-[11px] font-medium text-muted-foreground block tracking-wide uppercase">
            Passageiros
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <select
              value={passageiros}
              onChange={(e) => setPassageiros(Number(e.target.value))}
              className="w-full bg-transparent text-sm text-foreground outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} passageiro{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buscar */}
        <button
          type="submit"
          className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2.5 justify-center shadow-lg shadow-primary/25 hover:shadow-primary/40 min-w-[140px]"
        >
          <Search className="w-5 h-5" />
          Buscar
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
