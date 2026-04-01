import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";

interface Company {
  id: string;
  name: string;
  logo: string | null;
  is_active: boolean;
  priority: number;
  accepts_local: boolean;
  accepts_metropolitan: boolean;
  accepts_intermunicipal: boolean;
  accepts_interstate: boolean;
  accepts_long_distance: boolean;
  distance_min_km: number | null;
  distance_max_km: number | null;
}

const CompaniesTab = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("priority", { ascending: false });

    if (!error && data) setCompanies(data as Company[]);
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Companhias Cadastradas</h2>
        <button onClick={fetchCompanies} disabled={loading} className="flex items-center gap-1 text-sm text-primary hover:underline">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">CNPJ</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Sede</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Logo</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Prioridade</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Cobertura</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-center text-lg">{c.logo || "🚌"}</td>
                <td className="px-4 py-3 text-center text-foreground">{c.priority}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {c.is_active ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {c.accepts_metropolitan && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Metro</span>}
                    {c.accepts_intermunicipal && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Intermun.</span>}
                    {c.accepts_interstate && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Interest.</span>}
                    {c.accepts_long_distance && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Longa dist.</span>}
                  </div>
                </td>
              </tr>
            ))}
            {companies.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma companhia cadastrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">Total: {companies.length} companhia(s)</p>
    </div>
  );
};

export default CompaniesTab;
