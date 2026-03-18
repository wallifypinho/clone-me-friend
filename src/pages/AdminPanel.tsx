import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PasswordGate from "@/components/PasswordGate";
import { ArrowLeft, Search, Eye, RefreshCw, Settings, LogOut, CheckCircle, Clock, XCircle, Key } from "lucide-react";
import { toast } from "sonner";

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

const AdminPanel = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [tab, setTab] = useState<"bookings" | "settings">("bookings");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newUserPass, setNewUserPass] = useState("");

  const checkPassword = async (password: string) => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "admin_password")
      .single();
    return data?.value === password;
  };

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    setBookings((data as Booking[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (authenticated) fetchBookings();
  }, [authenticated]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", id);
    toast.success(`Status atualizado para ${status}`);
    fetchBookings();
    if (selectedBooking?.id === id) setSelectedBooking({ ...selectedBooking, status });
  };

  const updatePassword = async (key: string, value: string) => {
    if (value.length < 4) { toast.error("Senha deve ter pelo menos 4 caracteres"); return; }
    await supabase.from("admin_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    toast.success("Senha atualizada!");
    if (key === "admin_password") setNewAdminPass("");
    else setNewUserPass("");
  };

  const filtered = bookings.filter((b) => {
    const matchSearch = !search || b.nome.toLowerCase().includes(search.toLowerCase()) || b.cpf.includes(search) || b.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

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

  if (!authenticated) {
    return (
      <PasswordGate
        title="Painel Admin"
        description="Digite a senha de administrador"
        onAuthenticated={() => setAuthenticated(true)}
        checkPassword={checkPassword}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="brand-gradient text-primary-foreground py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></button>
            <p className="font-semibold">Painel Admin</p>
          </div>
          <button onClick={() => setAuthenticated(false)} className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("bookings")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "bookings" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"}`}>
            Reservas
          </button>
          <button onClick={() => setTab("settings")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "settings" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"}`}>
            <Settings className="w-4 h-4 inline mr-1" />Configurações
          </button>
        </div>

        {tab === "bookings" && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, CPF ou código" className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-background">
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <button onClick={fetchBookings} className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm bg-background hover:bg-muted">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total", count: bookings.length, color: "text-foreground" },
                { label: "Pendentes", count: bookings.filter(b => b.status === "pending").length, color: "text-yellow-500" },
                { label: "Confirmados", count: bookings.filter(b => b.status === "confirmed").length, color: "text-green-500" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Passageiro</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Rota</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Data</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Total</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma reserva encontrada</td></tr>
                    )}
                    {filtered.map((b) => (
                      <tr key={b.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{b.code}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{b.nome}</p>
                          <p className="text-xs text-muted-foreground">{b.cpf}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs">{b.origem} → {b.destino}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs">{b.data_viagem}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1">{statusIcon(b.status)} <span className="text-xs">{statusLabel(b.status)}</span></span>
                        </td>
                        <td className="px-4 py-3 font-semibold">R$ {Number(b.total).toFixed(2).replace(".", ",")}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setSelectedBooking(b)} className="p-1.5 rounded-lg hover:bg-muted"><Eye className="w-4 h-4" /></button>
                            {b.status === "pending" && (
                              <>
                                <button onClick={() => updateStatus(b.id, "confirmed")} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600"><CheckCircle className="w-4 h-4" /></button>
                                <button onClick={() => updateStatus(b.id, "cancelled")} className="p-1.5 rounded-lg hover:bg-red-100 text-destructive"><XCircle className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "settings" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Key className="w-4 h-4 text-primary" />Alterar Senhas</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Senha do Admin</label>
                  <div className="flex gap-2">
                    <input type="password" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} placeholder="Nova senha admin" className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                    <button onClick={() => updatePassword("admin_password", newAdminPass)} disabled={!newAdminPass} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50">Salvar</button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Senha do Usuário</label>
                  <div className="flex gap-2">
                    <input type="password" value={newUserPass} onChange={(e) => setNewUserPass(e.target.value)} placeholder="Nova senha usuário" className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                    <button onClick={() => updatePassword("user_password", newUserPass)} disabled={!newUserPass} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50">Salvar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-foreground mb-4">Detalhes da Reserva</h3>
            <div className="space-y-3 text-sm">
              {[
                ["Código", selectedBooking.code],
                ["Nome", selectedBooking.nome],
                ["CPF", selectedBooking.cpf],
                ["E-mail", selectedBooking.email || "-"],
                ["WhatsApp", selectedBooking.whatsapp || "-"],
                ["Rota", `${selectedBooking.origem} → ${selectedBooking.destino}`],
                ["Data", selectedBooking.data_viagem],
                ["Horário", `${selectedBooking.departure} - ${selectedBooking.arrival}`],
                ["Empresa", selectedBooking.company],
                ["Tipo", selectedBooking.seat_type],
                ["Assentos", selectedBooking.seats],
                ["Pagamento", selectedBooking.payment_method.toUpperCase()],
                ["Total", `R$ ${Number(selectedBooking.total).toFixed(2).replace(".", ",")}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-foreground">{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-1">{statusIcon(selectedBooking.status)} {statusLabel(selectedBooking.status)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              {selectedBooking.status === "pending" && (
                <>
                  <button onClick={() => updateStatus(selectedBooking.id, "confirmed")} className="flex-1 bg-green-500 text-primary-foreground font-semibold py-2 rounded-lg text-sm">Confirmar</button>
                  <button onClick={() => updateStatus(selectedBooking.id, "cancelled")} className="flex-1 bg-destructive text-destructive-foreground font-semibold py-2 rounded-lg text-sm">Cancelar</button>
                </>
              )}
              <button onClick={() => setSelectedBooking(null)} className="flex-1 border border-border text-foreground font-semibold py-2 rounded-lg text-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
