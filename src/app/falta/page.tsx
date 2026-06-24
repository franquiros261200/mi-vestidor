"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { CATEGORIES } from "@/lib/constants";

interface Item {
  id: string;
  category: string;
  colors: string[];
  colorNames: string[];
  seasons: string[];
}

const BASICS_CHECKLIST = [
  { category: "remera", min: 5, label: "Remeras básicas" },
  { category: "jean", min: 2, label: "Jeans" },
  { category: "pantalon", min: 2, label: "Pantalones" },
  { category: "camisa", min: 2, label: "Camisas" },
  { category: "buzo", min: 2, label: "Buzos/Sweaters", alt: ["sweater"] },
  { category: "campera", min: 1, label: "Campera" },
  { category: "zapatillas", min: 2, label: "Zapatillas" },
  { category: "zapatos", min: 1, label: "Zapatos" },
  { category: "short", min: 2, label: "Shorts" },
];

const ESSENTIAL_COLORS = ["negro", "blanco", "gris", "azul marino"];

export default function FaltaPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/items").then((r) => r.json()).then((data) => { setItems(data); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <AppShell title="Lo que me falta">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  // Category analysis
  const catCounts: Record<string, number> = {};
  items.forEach((i) => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });

  // Check basics
  const basicsStatus = BASICS_CHECKLIST.map((b) => {
    const count = (catCounts[b.category] || 0) + (b.alt?.reduce((s, c) => s + (catCounts[c] || 0), 0) || 0);
    return { ...b, count, met: count >= b.min, deficit: Math.max(0, b.min - count) };
  });

  const missingBasics = basicsStatus.filter((b) => !b.met);
  const metBasics = basicsStatus.filter((b) => b.met);

  // Color analysis
  const allColors = items.flatMap((i) => i.colorNames);
  const missingColors = ESSENTIAL_COLORS.filter((c) => !allColors.includes(c));

  // Season balance
  const seasonCounts: Record<string, number> = {};
  items.forEach((i) => i.seasons.forEach((s) => { seasonCounts[s] = (seasonCounts[s] || 0) + 1; }));

  // Imbalance detection
  const catValues = Object.values(catCounts);
  const avgPerCat = catValues.length > 0 ? catValues.reduce((a, b) => a + b, 0) / catValues.length : 0;
  const overloaded = Object.entries(catCounts)
    .filter(([_, count]) => count > avgPerCat * 2)
    .sort((a, b) => b[1] - a[1]);

  const score = Math.round((metBasics.length / basicsStatus.length) * 100);

  return (
    <AppShell title="Lo que me falta">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* Score */}
        <div className="card p-6 text-center">
          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E8E8E6" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${score * 2.64} 264`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold font-display">
              {score}%
            </span>
          </div>
          <p className="font-display font-bold">Completitud del vestidor</p>
          <p className="text-xs text-muted mt-1">Basado en prendas básicas esenciales</p>
        </div>

        {/* Missing basics */}
        {missingBasics.length > 0 && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm mb-3 text-red-600">❌ Te falta</h3>
            <div className="space-y-2.5">
              {missingBasics.map((b) => {
                const cat = CATEGORIES[b.category];
                return (
                  <div key={b.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cat?.icon}</span>
                      <span className="text-sm">{b.label}</span>
                    </div>
                    <span className="text-xs font-medium text-red-500">
                      {b.count}/{b.min} (faltan {b.deficit})
                    </span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => router.push("/wishlist")}
              className="btn-secondary text-sm w-full mt-4"
            >
              🛒 Agregar a wishlist
            </button>
          </div>
        )}

        {/* Met basics */}
        {metBasics.length > 0 && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm mb-3 text-green-600">✅ Cubierto</h3>
            <div className="space-y-2">
              {metBasics.map((b) => {
                const cat = CATEGORIES[b.category];
                return (
                  <div key={b.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cat?.icon}</span>
                      <span className="text-sm">{b.label}</span>
                    </div>
                    <span className="text-xs font-medium text-green-600">{b.count}/{b.min}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missing colors */}
        {missingColors.length > 0 && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm mb-3">🎨 Colores básicos que te faltan</h3>
            <div className="flex flex-wrap gap-2">
              {missingColors.map((c) => (
                <span key={c} className="tag-pill text-xs capitalize bg-yellow-50 text-yellow-700">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Overloaded categories */}
        {overloaded.length > 0 && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm mb-3">⚠️ Exceso</h3>
            <p className="text-xs text-muted mb-3">Tenés mucho más que el promedio en:</p>
            <div className="space-y-2">
              {overloaded.map(([cat, count]) => {
                const info = CATEGORIES[cat];
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm">{info?.icon} {info?.label}</span>
                    <span className="text-xs text-muted">{count} prendas (promedio: {Math.round(avgPerCat)})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
