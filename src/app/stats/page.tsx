"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { CATEGORIES } from "@/lib/constants";

interface Item {
  id: string;
  category: string;
  colors: string[];
  colorNames: string[];
  brand: string | null;
  purchasePrice: number | null;
  timesWorn: number;
  lastWornAt: string | null;
  favorite: boolean;
  createdAt: string;
}

export default function StatsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/items").then((r) => r.json()).then((data) => { setItems(data); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <AppShell title="Estadísticas">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  // Category distribution
  const catCounts: Record<string, number> = {};
  items.forEach((i) => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
  const catSorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...Object.values(catCounts), 1);

  // Color distribution
  const colorCounts: Record<string, { count: number; hex: string }> = {};
  items.forEach((i) => {
    i.colorNames.forEach((name, idx) => {
      if (!colorCounts[name]) colorCounts[name] = { count: 0, hex: i.colors[idx] || "#ccc" };
      colorCounts[name].count++;
    });
  });
  const colorSorted = Object.entries(colorCounts).sort((a, b) => b[1].count - a[1].count);

  // Most/least worn
  const worn = [...items].sort((a, b) => b.timesWorn - a.timesWorn);
  const mostWorn = worn.slice(0, 5);
  const leastWorn = worn.filter((i) => i.timesWorn === 0);

  // Unused for 30+ days
  const now = new Date();
  const unused30 = items.filter((i) => {
    if (!i.lastWornAt) return true;
    const diff = (now.getTime() - new Date(i.lastWornAt).getTime()) / (1000 * 60 * 60 * 24);
    return diff > 30;
  });

  // Total value
  const totalValue = items.reduce((sum, i) => sum + (i.purchasePrice || 0), 0);
  const totalWears = items.reduce((sum, i) => sum + i.timesWorn, 0);

  return (
    <AppShell title="Estadísticas">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* Overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold font-display">{items.length}</p>
            <p className="text-xs text-muted">Prendas</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold font-display">{Object.keys(catCounts).length}</p>
            <p className="text-xs text-muted">Categorías</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold font-display">{totalWears}</p>
            <p className="text-xs text-muted">Usos totales</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold font-display">{items.filter((i) => i.favorite).length}</p>
            <p className="text-xs text-muted">Favoritas</p>
          </div>
        </div>

        {/* Category bars */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-sm mb-4">Por categoría</h3>
          <div className="space-y-2.5">
            {catSorted.map(([cat, count]) => {
              const info = CATEGORIES[cat];
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-sm w-6 text-center shrink-0">{info?.icon || "?"}</span>
                  <span className="text-xs w-20 truncate shrink-0">{info?.label || cat}</span>
                  <div className="flex-1 bg-tag rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-accent/70 rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${(count / maxCat) * 100}%`, minWidth: "24px" }}
                    >
                      <span className="text-[10px] text-white font-bold">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color palette */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-sm mb-4">Tu paleta de colores</h3>
          <div className="flex flex-wrap gap-2">
            {colorSorted.map(([name, { count, hex }]) => (
              <div key={name} className="flex items-center gap-1.5 tag-pill text-xs">
                <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                <span className="capitalize">{name}</span>
                <span className="text-muted">({count})</span>
              </div>
            ))}
          </div>
          {colorSorted.length === 0 && <p className="text-xs text-muted">Sin colores cargados todavía</p>}
        </div>

        {/* Most worn */}
        {mostWorn.length > 0 && mostWorn[0].timesWorn > 0 && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm mb-3">Más usadas</h3>
            <div className="space-y-2">
              {mostWorn.filter(i => i.timesWorn > 0).map((item, i) => {
                const cat = CATEGORIES[item.category];
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted w-5">#{i + 1}</span>
                    <span className="text-sm">{cat?.icon} {cat?.label}</span>
                    {item.brand && <span className="text-xs text-muted">· {item.brand}</span>}
                    <span className="ml-auto text-xs font-medium text-accent">{item.timesWorn}x</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dead items */}
        {unused30.length > 0 && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm mb-1">Sin usar hace +30 días</h3>
            <p className="text-xs text-muted mb-3">{unused30.length} prenda{unused30.length !== 1 ? "s" : ""} juntando polvo</p>
            <div className="flex flex-wrap gap-1.5">
              {unused30.slice(0, 10).map((item) => {
                const cat = CATEGORIES[item.category];
                return (
                  <span key={item.id} className="tag-pill text-xs">
                    {cat?.icon} {cat?.label} {item.brand ? `· ${item.brand}` : ""}
                  </span>
                );
              })}
              {unused30.length > 10 && <span className="tag-pill text-xs text-muted">+{unused30.length - 10} más</span>}
            </div>
          </div>
        )}

        {/* Value */}
        {totalValue > 0 && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm mb-2">Valor del guardarropa</h3>
            <p className="text-2xl font-bold font-display">${totalValue.toLocaleString("es-AR")}</p>
            {totalWears > 0 && (
              <p className="text-xs text-muted mt-1">
                Costo promedio por uso: ${(totalValue / totalWears).toFixed(0)}
              </p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
