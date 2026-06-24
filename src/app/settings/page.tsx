"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setHasKey(data.hasAnthropicKey));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicKey }),
      });
      setHasKey(!!anthropicKey);
      setAnthropicKey("");
      toast.success("Guardado");
    } catch {
      toast.error("Error al guardar");
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anthropicKey: null }),
    });
    setHasKey(false);
    toast.success("Key eliminada");
    setSaving(false);
  };

  return (
    <AppShell title="Configuración">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="card p-5 space-y-4">
          <div>
            <h2 className="font-display font-bold text-base">Funciones de IA</h2>
            <p className="text-sm text-muted mt-1">
              Cargá tu API key de Anthropic para activar el auto-detectado de categoría, color y temporada al subir prendas. Sin key, podés cargar todo a mano.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Anthropic API Key
            </label>
            <div className="flex items-center gap-2 mt-1.5">
              {hasKey ? (
                <>
                  <div className="flex-1 flex items-center gap-2 border border-border rounded-lg px-3 py-2.5 bg-green-50">
                    <span className="text-green-600 text-sm">✓</span>
                    <span className="text-sm text-green-700">Key configurada</span>
                  </div>
                  <button onClick={handleRemove} disabled={saving} className="btn-secondary text-sm text-red-500 hover:text-red-600">
                    Eliminar
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="flex-1 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                  <button onClick={handleSave} disabled={saving || !anthropicKey} className="btn-primary text-sm">
                    {saving ? "..." : "Guardar"}
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-muted/60 mt-2">
              Conseguila en{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" className="text-accent hover:underline">
                console.anthropic.com
              </a>
              . Cada análisis cuesta ~$0.003 USD.
            </p>
          </div>
        </div>

        <div className="card p-5 bg-tag/50">
          <h3 className="font-medium text-sm mb-2">¿Cómo funciona?</h3>
          <div className="text-sm text-muted space-y-2">
            <p><span className="font-medium text-ink">Sin key:</span> Subís la foto y elegís categoría, color y temporada a mano.</p>
            <p><span className="font-medium text-ink">Con key:</span> La IA analiza la foto y te sugiere todo automáticamente. Vos confirmás o editás.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
