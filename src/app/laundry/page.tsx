"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { CATEGORIES } from "@/lib/constants";
import toast from "react-hot-toast";

interface Item {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  category: string;
  brand: string | null;
  inLaundry: boolean;
}

export default function LaundryPage() {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dirty" | "clean">("dirty");

  const fetchItems = async () => {
    const res = await fetch("/api/items");
    const data = await res.json();
    setAllItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const toggleLaundry = async (itemId: string) => {
    await fetch("/api/laundry", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    setAllItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, inLaundry: !i.inLaundry } : i))
    );
  };

  const washAll = async () => {
    if (!confirm("¿Marcar todo como lavado?")) return;
    await fetch("/api/laundry", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ washAll: true }),
    });
    setAllItems((prev) => prev.map((i) => ({ ...i, inLaundry: false })));
    toast.success("Todo limpio 🧼");
  };

  const dirtyItems = allItems.filter((i) => i.inLaundry);
  const cleanItems = allItems.filter((i) => !i.inLaundry);
  const displayItems = view === "dirty" ? dirtyItems : cleanItems;

  return (
    <AppShell title="Laundry">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Stats bar */}
        <div className="card p-4 mb-4 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{dirtyItems.length}</p>
              <p className="text-[11px] text-muted">Sucias</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{cleanItems.length}</p>
              <p className="text-[11px] text-muted">Limpias</p>
            </div>
          </div>
          {dirtyItems.length > 0 && (
            <button onClick={washAll} className="btn-primary text-sm">
              🧼 Ya lavé todo
            </button>
          )}
        </div>

        {/* Toggle */}
        <div className="flex gap-1 bg-tag rounded-lg p-1 mb-4">
          <button
            onClick={() => setView("dirty")}
            className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${
              view === "dirty" ? "bg-white shadow-sm text-ink" : "text-muted"
            }`}
          >
            🧺 Sucias ({dirtyItems.length})
          </button>
          <button
            onClick={() => setView("clean")}
            className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${
              view === "clean" ? "bg-white shadow-sm text-ink" : "text-muted"
            }`}
          >
            ✨ Limpias ({cleanItems.length})
          </button>
        </div>

        {/* Items grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-tag animate-pulse" />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">{view === "dirty" ? "✨" : "👕"}</p>
            <p className="text-sm text-muted">
              {view === "dirty" ? "Todo limpio, crack" : "No tenés prendas todavía"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {displayItems.map((item) => {
              const cat = CATEGORIES[item.category];
              return (
                <button
                  key={item.id}
                  onClick={() => toggleLaundry(item.id)}
                  className="relative aspect-square rounded-xl overflow-hidden border border-border group"
                >
                  <Image
                    src={item.thumbnailUrl || item.imageUrl}
                    alt={cat?.label || ""} fill className="object-cover" sizes="120px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-2xl transition-opacity">
                      {item.inLaundry ? "✨" : "🧺"}
                    </span>
                  </div>
                  <div className="absolute bottom-1 left-1 right-1">
                    <p className="text-[10px] text-white bg-black/50 rounded px-1 py-0.5 truncate text-center">
                      {cat?.icon} {cat?.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted text-center mt-4">
          Tocá una prenda para {view === "dirty" ? "marcarla como limpia" : "mandarla al lavarropas"}
        </p>
      </div>
    </AppShell>
  );
}
