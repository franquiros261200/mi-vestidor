"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { CATEGORIES } from "@/lib/constants";
import { OUTFIT_OCCASIONS, WEATHER_OPTIONS } from "@/lib/outfit-constants";
import toast from "react-hot-toast";

interface OutfitItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  category: string;
  brand: string | null;
  colorNames: string[];
  style: string | null;
}

interface ScoreBreakdown {
  colorHarmony: number;
  styleCompat: number;
  occasionFit: number;
  weatherFit: number;
  visualBalance: number;
  total: number;
  penalties: string[];
  bonuses: string[];
}

interface OutfitCombo {
  items: OutfitItem[];
  score: number;
  breakdown: ScoreBreakdown;
}

export default function RandomPage() {
  const router = useRouter();
  const [results, setResults] = useState<OutfitCombo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [weather, setWeather] = useState<string | null>(null);
  const [rolled, setRolled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justification, setJustification] = useState<string | null>(null);
  const [loadingJustify, setLoadingJustify] = useState(false);

  const rollEngine = async () => {
    setLoading(true);
    setJustification(null);
    const res = await fetch("/api/engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occasion, weather, maxResults: 8, minScore: 60 }),
    });
    const data = await res.json();
    setResults(data);
    setCurrent(0);
    setRolled(true);
    setLoading(false);
  };

  const nextOutfit = () => {
    setJustification(null);
    setCurrent((prev) => (prev + 1) % results.length);
  };

  const saveAsOutfit = async () => {
    const combo = results[current];
    if (!combo) return;
    setSaving(true);
    const name = `Engine ${new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short" })} (${combo.score}pts)`;
    await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, occasion, weather, itemIds: combo.items.map((i) => i.id) }),
    });
    toast.success("Outfit guardado");
    setSaving(false);
  };

  const getJustification = async () => {
    const combo = results[current];
    if (!combo) return;
    setLoadingJustify(true);
    try {
      const res = await fetch("/api/engine/justify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: combo.items, score: combo.score, breakdown: combo.breakdown, context: { occasion, weather } }),
      });
      const data = await res.json();
      setJustification(data.justification || data.error || "No disponible");
    } catch {
      setJustification("Necesitás configurar tu API key en ⚙️ Configuración");
    }
    setLoadingJustify(false);
  };

  const combo = results[current];

  return (
    <AppShell title="Fashion Engine">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Ocasión</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {OUTFIT_OCCASIONS.map((o) => (
                <button key={o.value} onClick={() => setOccasion(occasion === o.value ? null : o.value)}
                  className={`tag-pill text-xs transition-colors ${occasion === o.value ? "bg-accent/10 text-accent ring-1 ring-accent/30" : ""}`}>
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Clima</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {WEATHER_OPTIONS.map((w) => (
                <button key={w.value} onClick={() => setWeather(weather === w.value ? null : w.value)}
                  className={`tag-pill text-xs transition-colors ${weather === w.value ? "bg-accent/10 text-accent ring-1 ring-accent/30" : ""}`}>
                  {w.icon} {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button onClick={rollEngine} disabled={loading}
          className="w-full btn-primary py-4 text-lg mb-6 flex items-center justify-center gap-2">
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analizando...</>
          ) : rolled ? "🎲 Generar de nuevo" : "🎲 ¿Qué me pongo?"}
        </button>

        {/* Results */}
        {rolled && results.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">😕</p>
            <p className="text-sm text-muted">No se encontraron outfits con buen puntaje. Probá con otros filtros o subí más prendas.</p>
          </div>
        )}

        {combo && (
          <div className="space-y-4">
            {/* Score header */}
            <div className="card p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold font-display ${
                    combo.score >= 85 ? "text-green-600" : combo.score >= 70 ? "text-accent" : "text-yellow-600"
                  }`}>{combo.score}</span>
                  <span className="text-sm text-muted">/100</span>
                </div>
                <p className="text-[11px] text-muted">Outfit {current + 1} de {results.length}</p>
              </div>
              {results.length > 1 && (
                <button onClick={nextOutfit} className="btn-secondary text-sm">
                  Siguiente →
                </button>
              )}
            </div>

            {/* Score breakdown */}
            <div className="card p-4 space-y-2">
              {[
                { label: "Colores", value: combo.breakdown.colorHarmony, max: 25 },
                { label: "Estilo", value: combo.breakdown.styleCompat, max: 25 },
                { label: "Ocasión", value: combo.breakdown.occasionFit, max: 20 },
                { label: "Clima", value: combo.breakdown.weatherFit, max: 15 },
                { label: "Balance", value: combo.breakdown.visualBalance, max: 15 },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <span className="text-xs w-16 text-muted shrink-0">{b.label}</span>
                  <div className="flex-1 bg-tag rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-accent/70 rounded-full transition-all"
                      style={{ width: `${(b.value / b.max) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-muted w-8 text-right shrink-0">{b.value}/{b.max}</span>
                </div>
              ))}

              {combo.breakdown.bonuses.map((b, i) => (
                <p key={i} className="text-[11px] text-green-600">✓ {b}</p>
              ))}
              {combo.breakdown.penalties.map((p, i) => (
                <p key={i} className="text-[11px] text-red-500">✗ {p}</p>
              ))}
            </div>

            {/* Items */}
            <div className="space-y-2">
              {combo.items.map((item) => {
                const cat = CATEGORIES[item.category];
                return (
                  <div key={item.id} className="card p-3 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-border relative shrink-0">
                      <Image src={item.thumbnailUrl || item.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cat?.icon} {cat?.label}</p>
                      {item.brand && <p className="text-xs text-muted">{item.brand}</p>}
                      {item.style && <span className="tag-pill text-[10px] mt-1">{item.style}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Justification */}
            <button onClick={getJustification} disabled={loadingJustify}
              className="w-full btn-secondary text-sm">
              {loadingJustify ? "Pensando..." : justification ? "🧠 Pedir otra opinión" : "🧠 ¿Por qué este outfit?"}
            </button>

            {justification && (
              <div className="card p-4 bg-tag/50">
                <p className="text-xs font-medium text-muted mb-1">🧠 Opinión IA</p>
                <p className="text-sm leading-relaxed">{justification}</p>
              </div>
            )}

            {/* Save */}
            <div className="flex gap-3">
              <button onClick={saveAsOutfit} disabled={saving} className="btn-primary flex-1">
                {saving ? "Guardando..." : "💾 Guardar outfit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
