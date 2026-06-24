"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { OUTFIT_OCCASIONS, WEATHER_OPTIONS } from "@/lib/outfit-constants";
import { CATEGORIES } from "@/lib/constants";
import toast from "react-hot-toast";

interface OutfitItem {
  item: {
    id: string;
    imageUrl: string;
    thumbnailUrl: string | null;
    category: string;
    colorNames: string[];
    colors: string[];
    brand: string | null;
  };
}

interface Outfit {
  id: string;
  name: string;
  occasion: string | null;
  weather: string | null;
  rating: number | null;
  notes: string | null;
  items: OutfitItem[];
  createdAt: string;
}

export default function OutfitsPage() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterOccasion, setFilterOccasion] = useState<string | null>(null);
  const [filterWeather, setFilterWeather] = useState<string | null>(null);

  const fetchOutfits = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterOccasion) params.set("occasion", filterOccasion);
    if (filterWeather) params.set("weather", filterWeather);
    const res = await fetch(`/api/outfits?${params}`);
    const data = await res.json();
    setOutfits(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOutfits();
  }, [filterOccasion, filterWeather]);

  const deleteOutfit = async (id: string) => {
    if (!confirm("¿Eliminar este outfit?")) return;
    await fetch("/api/outfits", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Outfit eliminado");
    fetchOutfits();
  };

  const rateOutfit = async (id: string, rating: number) => {
    await fetch("/api/outfits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rating }),
    });
    fetchOutfits();
  };

  const getOccasionInfo = (value: string | null) =>
    OUTFIT_OCCASIONS.find((o) => o.value === value);
  const getWeatherInfo = (value: string | null) =>
    WEATHER_OPTIONS.find((w) => w.value === value);

  return (
    <AppShell
      title="Outfits"
      onUploadClick={() => router.push("/outfits/nuevo")}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 pb-20">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {OUTFIT_OCCASIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setFilterOccasion(filterOccasion === o.value ? null : o.value)}
              className={`tag-pill whitespace-nowrap text-xs shrink-0 transition-colors ${
                filterOccasion === o.value ? "bg-accent/10 text-accent" : ""
              }`}
            >
              {o.icon} {o.label}
            </button>
          ))}
          <div className="w-px bg-border shrink-0 my-1" />
          {WEATHER_OPTIONS.map((w) => (
            <button
              key={w.value}
              onClick={() => setFilterWeather(filterWeather === w.value ? null : w.value)}
              className={`tag-pill whitespace-nowrap text-xs shrink-0 transition-colors ${
                filterWeather === w.value ? "bg-accent/10 text-accent" : ""
              }`}
            >
              {w.icon} {w.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted mb-3">
          {outfits.length} outfit{outfits.length !== 1 ? "s" : ""}
        </p>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-5 bg-tag rounded w-1/2 mb-3" />
                <div className="flex gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="w-16 h-16 bg-tag rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">👔</div>
            <h3 className="font-display font-bold text-lg mb-1">Sin outfits todavía</h3>
            <p className="text-sm text-muted mb-4">
              Armá tu primer combo de prendas
            </p>
            <button
              onClick={() => router.push("/outfits/nuevo")}
              className="btn-primary"
            >
              Crear outfit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outfits.map((outfit) => {
              const occ = getOccasionInfo(outfit.occasion);
              const wea = getWeatherInfo(outfit.weather);
              const isExpanded = expanded === outfit.id;

              return (
                <div key={outfit.id} className="card overflow-hidden">
                  {/* Card header */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : outfit.id)}
                    className="w-full text-left p-4 hover:bg-tag/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-bold text-base">{outfit.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          {occ && <span className="tag-pill text-[11px]">{occ.icon} {occ.label}</span>}
                          {wea && <span className="tag-pill text-[11px]">{wea.icon} {wea.label}</span>}
                        </div>
                      </div>
                      {/* Rating */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={(e) => {
                              e.stopPropagation();
                              rateOutfit(outfit.id, star);
                            }}
                            className="text-sm"
                          >
                            {star <= (outfit.rating || 0) ? "⭐" : "☆"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Item thumbnails */}
                    <div className="flex gap-2 overflow-x-auto">
                      {outfit.items.map(({ item }) => {
                        const cat = CATEGORIES[item.category];
                        return (
                          <div
                            key={item.id}
                            className="w-14 h-14 rounded-lg overflow-hidden border border-border shrink-0 relative"
                          >
                            <Image
                              src={item.thumbnailUrl || item.imageUrl}
                              alt={cat?.label || ""} fill className="object-cover" sizes="56px"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-3">
                      {/* Items list */}
                      <div className="space-y-2">
                        {outfit.items.map(({ item }) => {
                          const cat = CATEGORIES[item.category];
                          return (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0 relative">
                                <Image
                                  src={item.thumbnailUrl || item.imageUrl}
                                  alt="" fill className="object-cover" sizes="48px"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{cat?.icon} {cat?.label}</p>
                                {item.brand && <p className="text-xs text-muted">{item.brand}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {outfit.notes && (
                        <p className="text-sm text-muted italic">"{outfit.notes}"</p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => deleteOutfit(outfit.id)}
                          className="btn-secondary text-sm text-red-500 hover:text-red-600 hover:border-red-200"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
