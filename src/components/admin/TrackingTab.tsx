import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const TrackingTab = () => {
  const [utmifyPixelId, setUtmifyPixelId] = useState("69c380e1105830146538cfa9");
  const [utmifyActive, setUtmifyActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const upsertSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("admin_settings").select("id").eq("key", key).single();
    if (existing) {
      await supabase.from("admin_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    } else {
      await supabase.from("admin_settings").insert({ key, value });
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("admin_settings").select("key, value")
      .in("key", ["utmify_pixel_id", "utmify_active"]);

    if (data) {
      for (const row of data) {
        if (row.key === "utmify_pixel_id" && row.value) setUtmifyPixelId(row.value);
        if (row.key === "utmify_active") setUtmifyActive(row.value === "true");
      }
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setLoading(true);
    await upsertSetting("utmify_pixel_id", utmifyPixelId);
    await upsertSetting("utmify_active", utmifyActive ? "true" : "false");
    setLoading(false);
    toast.success("Configurações de tracking salvas!");
  };

  return (
    <div className="space-y-4">
      {/* UTMify */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-sm">📡 UTMify</h3>
          <button onClick={() => setUtmifyActive(!utmifyActive)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer ${utmifyActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
            {utmifyActive ? "Ativo" : "Inativo"}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Pixel ID (UTMify)</label>
            <input value={utmifyPixelId} onChange={e => setUtmifyPixelId(e.target.value)}
              placeholder="ID do pixel UTMify" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-mono" />
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p>✅ Script UTMs carregado automaticamente no &lt;head&gt;</p>
          <p>✅ Pixel UTMify carregado automaticamente</p>
          <p>✅ API Token configurado como secret do backend (UTMIFY_API_TOKEN)</p>
        </div>
      </div>

      {/* Integration flow */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h4 className="font-semibold text-sm text-foreground mb-3">🔄 Fluxo de Integração UTMify</h4>
        <div className="space-y-2">
          {[
            { step: "1", label: "Pedido gerado", status: "waiting_payment", desc: "Enviado ao criar o pagamento (create-payment)" },
            { step: "2", label: "Pagamento confirmado", status: "paid", desc: "Enviado após webhook do gateway confirmar" },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">{item.step}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label} → <code className="text-xs bg-muted px-1 rounded">{item.status}</code></p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking params */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h4 className="font-semibold text-sm text-foreground mb-3">🏷️ Parâmetros Capturados</h4>
        <div className="flex flex-wrap gap-1.5">
          {["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
            "fbclid", "gclid", "_fbc", "_fbp",
            "campaign_name|id", "adset_name|id", "ad_name|id", "placement"].map(p => (
            <span key={p} className="text-xs bg-muted px-2 py-1 rounded-full font-mono">{p}</span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Formato UTM do Facebook: <code>nome|id</code> — parseado automaticamente para campos separados.
        </p>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50">
        <Save className="w-4 h-4" /> Salvar Configurações
      </button>
    </div>
  );
};

export default TrackingTab;