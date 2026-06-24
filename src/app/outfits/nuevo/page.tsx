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
  colorNames: string[];
  colors: string[];
}

export default function NuevoOutfitPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selections
  const [selectedItems, setSelectedItems] = useState<Record<string, string | null>>({});
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState<string | null>(null);
  const [weather, setWeather] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [expandedLayer, setExpandedLayer] = useState<string | null>("top");

  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  const getItemsForLayer = (layer: typeof OUTFIT_LAYERS[0]) => {
    return items.filter((item) => layer.categories.includes(item.category));
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const selectedItemIds = Object.values(selectedItems).filter(Boolean) as string[];

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Ponele un nombre al outfit");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Elegí al menos una prenda");
      return;
    }

    setSaving(true);
    try {
      await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          occasion,
          weather,
          notes: notes.trim() || null,
          itemIds: selectedItemIds,
        }),
      });
      toast.success("Outfit guardado");
      router.push("/outfits");
    } catch {
      toast.error("Error al guardar");
    }
    setSaving(false);
  };

  const toggleItem = (layerKey: string, itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [layerKey]: prev[layerKey] === itemId ? null : itemId,
    }));
  };

  if (loading) {
    return (
      <AppShell title="Nuevo Outfit">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Nuevo Outfit">
      <div className="max-w-2xl mx-auto px-4 py-4 pb-32">
        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del outfit (ej: Look de viernes)"
          className="w-full border border-border rounded-xl px-4 py-3 text-base font-medium bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent mb-4"
        />

        {/* Occasion + Weather */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Ocasión</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {OUTFIT_OCCASIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setOccasion(occasion === o.value ? null : o.value)}
                  className={`tag-pill text-xs transition-colors ${
                    occasion === o.value ? "bg-accent/10 text-accent ring-1 ring-accent/30" : "hover:bg-tag/80"
                  }`}
                >
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Clima</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setWeather(weather === w.value ? null : w.value)}
                  className={`tag-pill text-xs transition-colors ${
                    weather === w.value ? "bg-accent/10 text-accent ring-1 ring-accent/30" : "hover:bg-tag/80"
                  }`}
                >
                  {w.icon} {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Layer pickers */}
        <div className="space-y-2">
          {OUTFIT_LAYERS.map((layer) => {
            const layerItems = getItemsForLayer(layer);
            const selected = selectedItems[layer.key];
            const selectedItem = items.find((i) => i.id === selected);
            const isExpanded = expandedLayer === layer.key;

            if (layerItems.length === 0) return null;

            return (
              <div key={layer.key} className="card overflow-hidden">
                {/* Layer header */}
                <button
                  onClick={() => setExpandedLayer(isExpanded ? null : layer.key)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-tag/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{layer.icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium">{layer.label}</p>
                      <p className="text-[11px] text-muted">{layerItems.length} disponible{layerItems.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedItem && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-border">
                        <Image
                          src={selectedItem.thumbnailUrl || selectedItem.imageUrl}
                          alt="" width={32} height={32} className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <svg
                      className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Expanded items grid */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {layerItems.map((item) => {
                        const isSelected = selected === item.id;
                        const cat = CATEGORIES[item.category];
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleItem(layer.key, item.id)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                              isSelected
                                ? "border-accent ring-2 ring-accent/20 scale-[1.02]"
                                : "border-border hover:border-muted"
                            }`}
                          >
                            <Image
                              src={item.thumbnailUrl || item.imageUrl}
                              alt={cat?.label || ""} fill className="object-cover"
                              sizes="80px"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                            {/* Color dots */}
                            <div className="absolute bottom-1 left-1 flex gap-0.5">
                              {item.colors.slice(0, 2).map((hex, i) => (
                                <div key={i} className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: hex }} />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas (opcional)"
          rows={2}
          className="w-full mt-4 border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
        />

        {/* Preview strip */}
        {selectedCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-30">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {selectedItemIds.map((id) => {
                    const item = items.find((i) => i.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <Image
                          src={item.thumbnailUrl || item.imageUrl}
                          alt="" width={40} height={40} className="object-cover w-full h-full"
                        />
                      </div>
                    );
                  })}
                </div>
                <span className="text-sm text-muted">{selectedCount} prenda{selectedCount !== 1 ? "s" : ""}</span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? "Guardando..." : "Guardar outfit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
