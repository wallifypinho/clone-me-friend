import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PasswordGate from "@/components/PasswordGate";
import { ArrowLeft, LogOut, Search, Bus, CalendarDays, CheckCircle, Clock, XCircle, Ticket } from "lucide-react";

type Booking = {
  id: string;
  code: string;
  nome: string;
  cpf: string;
  email: string | null;
  whatsapp: string | null;
  origem: string;
  destino: string;
  data_viagem: string;
  departure: string;
  arrival: string;
  company: string;
  seat_type: string;
  seats: string;
  price_per_seat: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
};

const UserPanel = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [cpfSearch, setCpfSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkPassword = async (password: string) => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "user_password")
      .single();
    return data?.value === password;
  };

  const searchBookings = async () => {
    const digits = cpfSearch.replace(/\D/g, "");
    if (digits.length < 11) return;
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("cpf", digits)
      .order("created_at", { ascending: false });
    setBookings((data as Booking[]) || []);
    setSearched(true);
    setLoading(false);
  };

  const statusIcon = (s: string) => {
    if (s === "confirmed") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (s === "cancelled") return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const statusLabel = (s: string) => {
    if (s === "confirmed") return "Confirmado";
    if (s === "cancelled") return "Cancelado";
    return "Pendente";
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  if (!authenticated) {
    return (
      <PasswordGate
        title="Minha Área"
        description="Digite a senha de acesso"
        onAuthenticated={() => setAuthenticated(true)}
        checkPassword={checkPassword}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="brand-gradient text-primary-foreground py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></button>
            <p className="font-semibold">Minha Área</p>
          </div>
          <button onClick={() => setAuthenticated(false)} className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* CPF search */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" /> Buscar Minhas Passagens
          </h3>
          <p className="text-sm text-muted-foreground mb-3">Digite seu CPF para encontrar suas reservas</p>
          <div className="flex gap-2">
            <input
              value={cpfSearch}
              onChange={(e) => setCpfSearch(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              className="flex-1 border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={searchBookings}
              disabled={cpfSearch.replace(/\D/g, "").length < 11 || loading}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-1"
            >
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>
        </div>

        {/* Results */}
        {searched && bookings.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Bus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">Nenhuma reserva encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Verifique se o CPF está correto</p>
          </div>
        )}

        {bookings.map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-primary/5 px-4 py-2 flex items-center justify-between border-b border-border">
              <span className="text-xs font-mono font-bold text-primary">{b.code}</span>
              <span className="flex items-center gap-1 text-xs font-semibold">{statusIcon(b.status)} {statusLabel(b.status)}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Rota</p>
                  <p className="font-semibold text-sm text-foreground">{b.origem} → {b.destino}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold text-primary">R$ {Number(b.total).toFixed(2).replace(".", ",")}</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{b.data_viagem}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.departure} - {b.arrival}</span>
                <span className="flex items-center gap-1"><Bus className="w-3 h-3" />{b.company}</span>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Assento(s): {b.seats}</span>
                <span>Tipo: {b.seat_type}</span>
                <span>Pagamento: {b.payment_method.toUpperCase()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPanel;
