import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Eye, EyeOff, CheckCircle, XCircle, TestTube } from "lucide-react";
import { toast } from "sonner";

const MetaTab = () => {
  const [pixelId, setPixelId] = useState("951061374089610");
  const [testEventCode, setTestEventCode] = useState("");
  const [metaActive, setMetaActive] = useState(true);
  const [capiConfigured, setCapiConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

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
      .in("key", ["meta_pixel_id", "meta_test_event_code", "meta_active"]);

    if (data) {
      for (const row of data) {
        if (row.key === "meta_pixel_id" && row.value) setPixelId(row.value);
        if (row.key === "meta_test_event_code") setTestEventCode(row.value);
        if (row.key === "meta_active") setMetaActive(row.value === "true");
      }
    }

    // Check if META_CAPI_TOKEN is configured (we can't read it, but we can check if CAPI events are being sent)
    const { data: recentCapi } = await supabase.from("visitor_events")
      .select("id").eq("event_name", "PurchaseConfirmed").limit(1);
    setCapiConfigured((recentCapi && recentCapi.length > 0) || false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setLoading(true);
    await upsertSetting("meta_pixel_id", pixelId);
    await upsertSetting("meta_test_event_code", testEventCode);
    await upsertSetting("meta_active", metaActive ? "true" : "false");
    setLoading(false);
    toast.success("Configurações Meta salvas!");
  };

  const handleTestEvent = async () => {
    try {
      const { error } = await supabase.functions.invoke("meta-capi", {
        body: {
          events: [{
            event_name: "PageView",
            event_id: `test_${Date.now()}`,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            user_data: {},
            custom_data: { test: true },
          }],
        },
      });
      if (error) {
        toast.error("Erro ao enviar evento teste: " + error.message);
      } else {
        toast.success("Evento teste enviado para a CAPI!");
      }
    } catch (err) {
      toast.error("Falha na conexão com a CAPI");
    }
  };

  return (
    <div className="space-y-4">
      {/* Meta Pixel */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-sm">📊 Meta Pixel (Browser)</h3>
          <button onClick={() => setMetaActive(!metaActive)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer ${metaActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
            {metaActive ? "Ativo" : "Inativo"}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Pixel ID</label>
            <input value={pixelId} onChange={e => setPixelId(e.target.value)}
              placeholder="000000000000000" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-mono" />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Test Event Code (opcional)</label>
            <input value={testEventCode} onChange={e => setTestEventCode(e.target.value)}
              placeholder="TEST12345" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-mono" />
            <p className="text-[10px] text-muted-foreground mt-1">Use para testar eventos no Events Manager da Meta</p>
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p>✅ Eventos padrão: PageView, ViewContent, Search, AddToCart, Lead, InitiateCheckout, AddPaymentInfo, Purchase</p>
          <p>✅ Eventos custom: PixViewed, PixCopied, PaymentGenerated, PaymentPending, ReservationViewed</p>
        </div>
      </div>

      {/* CAPI */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-sm">🔐 Conversions API (Server)</h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${capiConfigured ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            {capiConfigured ? "Configurada" : "Verificando..."}
          </span>
        </div>

        <div className="text-xs text-muted-foreground space-y-1.5">
          <p>O Access Token da CAPI é gerenciado como secret do backend (META_CAPI_TOKEN).</p>
          <p>✅ Deduplicação: event_id compartilhado entre browser e servidor</p>
          <p>✅ PII hasheado (SHA-256): email, telefone, nome</p>
          <p>✅ _fbc e _fbp capturados e enviados para melhor matching</p>
          <p>✅ Purchase disparado APENAS após confirmação real do gateway (webhook)</p>
        </div>

        <button onClick={handleTestEvent}
          className="mt-3 flex items-center gap-1.5 px-3 py-2 bg-muted border border-border rounded-lg text-xs font-semibold hover:bg-accent transition-colors">
          <TestTube className="w-3.5 h-3.5" /> Enviar Evento Teste
        </button>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50">
        <Save className="w-4 h-4" /> Salvar Configurações Meta
      </button>

      {/* Event architecture info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h4 className="font-semibold text-sm text-foreground mb-3">📋 Arquitetura de Eventos</h4>
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="grid grid-cols-3 gap-1 font-semibold text-foreground border-b border-border pb-1">
            <span>Evento</span><span>Pixel</span><span>CAPI</span>
          </div>
          {[
            ["PageView", "✅ track", "—"],
            ["ViewContent", "✅ track", "—"],
            ["Search", "✅ track", "—"],
            ["AddToCart", "✅ track", "✅"],
            ["Lead", "✅ track", "✅"],
            ["InitiateCheckout", "✅ track", "✅"],
            ["AddPaymentInfo", "✅ track", "✅"],
            ["Purchase", "✅ track", "✅ (webhook)"],
            ["PaymentGenerated", "✅ custom", "—"],
            ["PaymentPending", "✅ custom", "—"],
            ["PixViewed", "✅ custom", "—"],
            ["PixCopied", "✅ custom", "—"],
          ].map(([name, pixel, capi]) => (
            <div key={name} className="grid grid-cols-3 gap-1">
              <span className="font-medium">{name}</span><span>{pixel}</span><span>{capi}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetaTab;