"use client";

import { useState } from "react";
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
  aiReasoning?: string;
  source?: string;
}

type Mode = "rules" | "ai";

export default function RandomPage() {
  const [mode, setMode] = useState<Mode>("ai");
  const [results, setResults] = useState<OutfitCombo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [weather, setWeather] = useState<string | null>(null);
  const [rolled, setRolled] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const endpoint = mode === "ai" ? "/api/engine/ai" : "/api/engine";
      const body = mode === "ai"
        ? { occasion, weather, count: 3 }
        : { occasion, weather, maxResults: 8, minScore: 60 };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error");
        setResults([]);
      } else {
        setResults(data);
        setCurrent(0);
      }
      setRolled(true);
    } catch (err: any) {
      toast.error(err.message || "Error");
    }
    setLoading(false);
  };

  const nextOutfit = () => setCurrent((prev) => (prev + 1) % results.length);

  const saveAsOutfit = async () => {
    const combo = results[current];
    if (!combo) return;
    setSaving(true);
    const name = `${mode === "ai" ? "IA" : "Engine"} ${new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short" })} (${combo.score}pts)`;
    await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, occasion, weather, itemIds: combo.items.map((i) => i.id) }),
    });
    toast.success("Outfit guardado");
    setSaving(false);
  };

  const combo = results[current];

  return (
    <AppShell title="Fashion Engine">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Mode selector */}
        <div className="flex gap-1 bg-tag rounded-lg p-1 mb-5">
          <button
            onClick={() => setMode("ai")}
            className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${
              mode === "ai" ? "bg-white shadow-sm text-ink" : "text-muted"
            }`}
          >
            🧠 IA
          </button>
          <button
            onClick={() => setMode("rules")}
            className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${
              mode === "rules" ? "bg-white shadow-sm text-ink" : "text-muted"
            }`}
          >
            🎲 Reglas
          </button>
        </div>

        <p className="text-xs text-muted text-center mb-5">
          {mode === "ai"
            ? "Claude analiza tu guardarropa y arma outfits creativos con teoría de moda real. Consume tu API key (~$0.01 por generación)."
            : "Motor matemático que evalúa miles de combinaciones y las puntúa. Gratis e instantáneo."}
        </p>

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

        <button onClick={generate} disabled={loading}
          className="w-full btn-primary py-4 text-lg mb-6 flex items-center justify-center gap-2">
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {mode === "ai" ? "Claude pensando..." : "Analizando..."}</>
          ) : rolled ? "🔄 Generar de nuevo" : mode === "ai" ? "🧠 Que Claude arme mis outfits" : "🎲 ¿Qué me pongo?"}
        </button>

        {rolled && results.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">😕</p>
            <p className="text-sm text-muted">No se encontraron outfits. Probá con otros filtros o subí más prendas.</p>
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
                  {combo.source === "ai" && <span className="tag-pill text-[10px] bg-purple-50 text-purple-700">IA</span>}
                </div>
                <p className="text-[11px] text-muted">Outfit {current + 1} de {results.length}</p>
              </div>
              {results.length > 1 && (
                <button onClick={nextOutfit} className="btn-secondary text-sm">Siguiente →</button>
              )}
            </div>

            {/* AI reasoning */}
            {combo.aiReasoning && (
              <div className="card p-4 bg-purple-50/50 border-purple-200">
                <p className="text-xs font-medium text-purple-900 mb-1">🧠 Por qué este outfit</p>
                <p className="text-sm text-purple-950 leading-relaxed">{combo.aiReasoning}</p>
              </div>
            )}

            {/* Breakdown */}
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
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.colorNames.slice(0, 3).map((c, i) => (
                          <span key={i} className="tag-pill text-[10px] capitalize">{c}</span>
                        ))}
                        {item.style && <span className="tag-pill text-[10px]">{item.style}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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
