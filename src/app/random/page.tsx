"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { OUTFIT_LAYERS, WEATHER_OPTIONS, OUTFIT_OCCASIONS } from "@/lib/outfit-constants";
import { CATEGORIES } from "@/lib/constants";
import toast from "react-hot-toast";

interface Item {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  category: string;
  brand: string | null;
  seasons: string[];
  occasions: string[];
  inLaundry: boolean;
}

export default function RandomPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Record<string, Item | null>>({});
  const [occasion, setOccasion] = useState<string | null>(null);
  const [weather, setWeather] = useState<string | null>(null);
  const [rolled, setRolled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((data) => { setItems(data.filter((i: Item) => !i.inLaundry)); setLoading(false); });
  }, []);

  const rollAll = () => {
    const newResult: Record<string, Item | null> = {};
    OUTFIT_LAYERS.forEach((layer) => {
      const pool = items.filter((item) => {
        if (!layer.categories.includes(item.category)) return false;
        if (occasion && item.occasions.length > 0 && !item.occasions.includes(occasion)) return false;
        return true;
      });
      newResult[layer.key] = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
    });
    setResult(newResult);
    setRolled(true);
  };

  const rerollLayer = (layerKey: string) => {
    const layer = OUTFIT_LAYERS.find((l) => l.key === layerKey);
    if (!layer) return;
    const pool = items.filter((item) => {
      if (!layer.categories.includes(item.category)) return false;
      if (result[layerKey]?.id === item.id) return false;
      return true;
    });
    if (pool.length > 0) {
      setResult((prev) => ({ ...prev, [layerKey]: pool[Math.floor(Math.random() * pool.length)] }));
    }
  };

  const saveAsOutfit = async () => {
    const selectedIds = Object.values(result).filter(Boolean).map((i) => i!.id);
    if (selectedIds.length === 0) return;

    setSaving(true);
    const name = `Random ${new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`;
    
    await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, occasion, weather, itemIds: selectedIds }),
    });
    
    toast.success("Outfit guardado");
    setSaving(false);
    router.push("/outfits");
  };

  const hasItems = Object.values(result).some(Boolean);

  return (
    <AppShell title="Outfit Random">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Ocasión</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {OUTFIT_OCCASIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setOccasion(occasion === o.value ? null : o.value)}
                  className={`tag-pill text-xs transition-colors ${occasion === o.value ? "bg-accent/10 text-accent ring-1 ring-accent/30" : ""}`}
                >
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Roll button */}
        <button onClick={rollAll} className="w-full btn-primary py-4 text-lg mb-6 flex items-center justify-center gap-2">
          🎲 {rolled ? "Tirar de nuevo" : "¿Qué me pongo?"}
        </button>

        {/* Results */}
        {rolled && (
          <div className="space-y-3">
            {OUTFIT_LAYERS.map((layer) => {
              const item = result[layer.key];
              if (!item && !items.some((i) => layer.categories.includes(i.category))) return null;

              return (
                <div key={layer.key} className="card p-3 flex items-center gap-3">
                  {item ? (
                    <>
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-border relative shrink-0">
                        <Image src={item.thumbnailUrl || item.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{CATEGORIES[item.category]?.icon} {CATEGORIES[item.category]?.label}</p>
                        {item.brand && <p className="text-xs text-muted">{item.brand}</p>}
                      </div>
                      <button onClick={() => rerollLayer(layer.key)} className="text-lg hover:scale-110 transition-transform shrink-0" title="Otra">
                        🔄
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-16 h-16 rounded-xl bg-tag flex items-center justify-center text-2xl shrink-0">{layer.icon}</div>
                      <p className="text-sm text-muted">No tenés {layer.label.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Save */}
            {hasItems && (
              <button onClick={saveAsOutfit} disabled={saving} className="w-full btn-secondary mt-4">
                {saving ? "Guardando..." : "💾 Guardar como outfit"}
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
