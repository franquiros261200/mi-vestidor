"use client";

import { useState, useEffect, useCallback } from "react";
import ItemCard from "./ItemCard";
import ReanalyzeBanner from "./ReanalyzeBanner";
import { CATEGORIES, SEASONS, OCCASIONS } from "@/lib/constants";

interface Item {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  category: string;
  subcategory: string | null;
  colorNames: string[];
  colors: string[];
  brand: string | null;
  seasons: string[];
  occasions: string[];
  material: string | null;
  style: string | null;
  formality: number;
  silhouette: string | null;
  favorite: boolean;
  timesWorn: number;
  lastWornAt: string | null;
  createdAt: string;
}

interface CatalogProps {
  refreshKey: number;
}

export default function Catalog({ refreshKey }: CatalogProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<string | null>(null);
  const [activeOccasion, setActiveOccasion] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [search, setSearch] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (activeSeason) params.set("season", activeSeason);
    if (activeOccasion) params.set("occasion", activeOccasion);
    if (showFavorites) params.set("favorite", "true");
    if (search) params.set("q", search);

    const res = await fetch(`/api/items?${params}`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, [activeCategory, activeSeason, activeOccasion, showFavorites, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, refreshKey]);

  // Conteo por categoría
  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  // Categorías presentes
  const usedCategories = Object.keys(CATEGORIES).filter(
    (k) => !activeCategory || categoryCounts[k]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      {/* Reanalyze banner for badly classified items */}
      <div className="mt-4">
        <ReanalyzeBanner onDone={fetchItems} />
      </div>

      {/* Search */}
      <div className="mt-2 mb-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por color, marca, categoría..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className={`tag-pill whitespace-nowrap text-xs transition-colors shrink-0 ${
            showFavorites ? "bg-accent/10 text-accent" : ""
          }`}
        >
          ❤️ Favoritos
        </button>

        {/* Category pills */}
        {Object.entries(CATEGORIES)
          .slice(0, 12)
          .map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(activeCategory === key ? null : key)}
              className={`tag-pill whitespace-nowrap text-xs transition-colors shrink-0 ${
                activeCategory === key ? "bg-accent/10 text-accent" : ""
              }`}
            >
              {icon} {label}
            </button>
          ))}
      </div>

      {/* Secondary filters (season / occasion) */}
      <div className="flex gap-4 mb-4">
        <select
          value={activeSeason || ""}
          onChange={(e) => setActiveSeason(e.target.value || null)}
          className="text-xs border border-border rounded-lg px-2 py-1.5 bg-white text-muted"
        >
          <option value="">Temporada</option>
          {SEASONS.map((s) => (
            <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
          ))}
        </select>
        <select
          value={activeOccasion || ""}
          onChange={(e) => setActiveOccasion(e.target.value || null)}
          className="text-xs border border-border rounded-lg px-2 py-1.5 bg-white text-muted"
        >
          <option value="">Ocasión</option>
          {OCCASIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
          ))}
        </select>
      </div>

      {/* Items count */}
      <p className="text-xs text-muted mb-3">
        {items.length} prenda{items.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-square bg-tag" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-tag rounded w-2/3" />
                <div className="h-3 bg-tag rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">👔</div>
          <h3 className="font-display font-bold text-lg mb-1">Tu vestidor está vacío</h3>
          <p className="text-sm text-muted">
            Tocá <span className="text-accent font-medium">+ Agregar</span> para subir tu primera prenda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={fetchItems} />
          ))}
        </div>
      )}
    </div>
  );
}
