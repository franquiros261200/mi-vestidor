"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { CATEGORIES } from "@/lib/constants";
import toast from "react-hot-toast";

interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windKmph: number;
  icon: string;
  maxTemp: number;
  minTemp: number;
  chanceOfRain: number;
  suggestion: string;
  error?: string;
}

interface OutfitItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  category: string;
  brand: string | null;
  style: string | null;
}

interface OutfitCombo {
  items: OutfitItem[];
  score: number;
  breakdown: { colorHarmony: number; styleCompat: number; occasionFit: number; weatherFit: number; visualBalance: number; total: number; bonuses: string[]; penalties: string[] };
}

export default function ClimaPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [outfits, setOutfits] = useState<OutfitCombo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then(async (w) => {
        setWeather(w);
        if (!w.error && w.suggestion) {
          const { weather: wType } = JSON.parse(w.suggestion);
          const res = await fetch("/api/engine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ weather: wType, occasion: "casual", maxResults: 5, minScore: 55 }),
          });
          const data = await res.json();
          setOutfits(data);
        }
        setLoading(false);
      });
  }, []);

  const combo = outfits[current];

  const nextOutfit = () => {
    setCurrent((prev) => (prev + 1) % outfits.length);
  };

  const saveOutfit = async () => {
    if (!combo) return;
    const name = `Clima ${new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short" })} (${combo.score}pts)`;
    await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, weather: weather?.temp ? (weather.temp >= 28 ? "calor" : weather.temp >= 18 ? "templado" : "frio") : null, itemIds: combo.items.map((i) => i.id) }),
    });
    toast.success("Outfit guardado");
  };

  if (loading) {
    return (
      <AppShell title="Clima">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Clima + Sugerencia">
      <div className="max-w-md mx-auto px-4 py-6">
        {weather && !weather.error ? (
          <>
            {/* Weather card */}
            <div className="card p-6 text-center mb-6">
              <p className="text-5xl mb-2">{weather.icon}</p>
              <p className="text-4xl font-bold font-display">{weather.temp}°C</p>
              <p className="text-sm text-muted capitalize mt-1">{weather.description}</p>
              <p className="text-xs text-muted mt-1">Sensación {weather.feelsLike}°C</p>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div><p className="text-muted text-xs">Máx</p><p className="font-medium">{weather.maxTemp}°</p></div>
                <div><p className="text-muted text-xs">Mín</p><p className="font-medium">{weather.minTemp}°</p></div>
                <div><p className="text-muted text-xs">Lluvia</p><p className="font-medium">{weather.chanceOfRain}%</p></div>
                <div><p className="text-muted text-xs">Viento</p><p className="font-medium">{weather.windKmph} km/h</p></div>
              </div>
              {weather.chanceOfRain > 40 && (
                <div className="mt-4 tag-pill bg-blue-50 text-blue-700 text-xs">🌂 Llevá paraguas</div>
              )}
            </div>

            {/* Engine suggestion */}
            {combo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-base">Sugerencia para hoy</h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${combo.score >= 80 ? "text-green-600" : "text-accent"}`}>
                      {combo.score}/100
                    </span>
                    {outfits.length > 1 && (
                      <button onClick={nextOutfit} className="text-xs text-accent hover:underline">Otra →</button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {combo.items.map((item) => {
                    const cat = CATEGORIES[item.category];
                    return (
                      <div key={item.id} className="card p-3 flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-border relative shrink-0">
                          <Image src={item.thumbnailUrl || item.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{cat?.icon} {cat?.label}</p>
                          {item.brand && <p className="text-xs text-muted">{item.brand}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {combo.breakdown.bonuses.length > 0 && (
                  <div className="space-y-1">
                    {combo.breakdown.bonuses.map((b, i) => (
                      <p key={i} className="text-[11px] text-green-600">✓ {b}</p>
                    ))}
                  </div>
                )}

                <button onClick={saveOutfit} className="w-full btn-secondary text-sm">
                  💾 Guardar outfit
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">👕</p>
                <p className="text-sm text-muted">Subí más prendas para recibir sugerencias según el clima.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🌤️</p>
            <p className="text-muted">No se pudo cargar el clima</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
