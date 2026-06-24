"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { OUTFIT_LAYERS } from "@/lib/outfit-constants";
import { CATEGORIES } from "@/lib/constants";

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
}

interface Item {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  category: string;
  brand: string | null;
  seasons: string[];
  inLaundry: boolean;
}

export default function ClimaPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [suggestion, setSuggestion] = useState<Record<string, Item | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/weather").then((r) => r.json()),
      fetch("/api/items").then((r) => r.json()),
    ]).then(([w, allItems]) => {
      setWeather(w);
      const available = allItems.filter((i: Item) => !i.inLaundry);
      setItems(available);

      if (w.suggestion) {
        const { weather: wType } = JSON.parse(w.suggestion);
        const seasonMap: Record<string, string[]> = {
          calor: ["verano", "todo_el_año"],
          templado: ["entretiempo", "todo_el_año"],
          frio: ["invierno", "todo_el_año"],
        };
        const validSeasons = seasonMap[wType] || ["todo_el_año"];

        const result: Record<string, Item | null> = {};
        OUTFIT_LAYERS.forEach((layer) => {
          const pool = available.filter((item: Item) => {
            if (!layer.categories.includes(item.category)) return false;
            if (item.seasons.length > 0 && !item.seasons.some((s: string) => validSeasons.includes(s))) return false;
            return true;
          });
          result[layer.key] = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
        });
        setSuggestion(result);
      }
      setLoading(false);
    });
  }, []);

  const regenerate = () => {
    if (!weather?.suggestion) return;
    const { weather: wType } = JSON.parse(weather.suggestion);
    const seasonMap: Record<string, string[]> = {
      calor: ["verano", "todo_el_año"],
      templado: ["entretiempo", "todo_el_año"],
      frio: ["invierno", "todo_el_año"],
    };
    const validSeasons = seasonMap[wType] || ["todo_el_año"];

    const result: Record<string, Item | null> = {};
    OUTFIT_LAYERS.forEach((layer) => {
      const pool = items.filter((item) => {
        if (!layer.categories.includes(item.category)) return false;
        if (item.seasons.length > 0 && !item.seasons.some((s) => validSeasons.includes(s))) return false;
        return true;
      });
      result[layer.key] = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
    });
    setSuggestion(result);
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
                <div>
                  <p className="text-muted text-xs">Máx</p>
                  <p className="font-medium">{weather.maxTemp}°</p>
                </div>
                <div>
                  <p className="text-muted text-xs">Mín</p>
                  <p className="font-medium">{weather.minTemp}°</p>
                </div>
                <div>
                  <p className="text-muted text-xs">Lluvia</p>
                  <p className="font-medium">{weather.chanceOfRain}%</p>
                </div>
                <div>
                  <p className="text-muted text-xs">Viento</p>
                  <p className="font-medium">{weather.windKmph} km/h</p>
                </div>
              </div>

              {weather.chanceOfRain > 40 && (
                <div className="mt-4 tag-pill bg-blue-50 text-blue-700 text-xs">
                  🌂 Llevá paraguas
                </div>
              )}
            </div>

            {/* Suggestion */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-base">Sugerencia para hoy</h2>
              <button onClick={regenerate} className="text-sm text-accent hover:underline">🔄 Otra</button>
            </div>

            <div className="space-y-2">
              {OUTFIT_LAYERS.map((layer) => {
                const item = suggestion[layer.key];
                if (!item) return null;
                const cat = CATEGORIES[item.category];

                return (
                  <div key={layer.key} className="card p-3 flex items-center gap-3">
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
