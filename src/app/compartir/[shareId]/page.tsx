"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CATEGORIES } from "@/lib/constants";

interface SharedOutfit {
  name: string;
  occasion: string | null;
  weather: string | null;
  rating: number | null;
  user: { name: string | null; image: string | null };
  items: {
    item: {
      imageUrl: string;
      thumbnailUrl: string | null;
      category: string;
      brand: string | null;
      colorNames: string[];
      colors: string[];
    };
  }[];
}

export default function SharedOutfitPage({ params }: { params: { shareId: string } }) {
  const [outfit, setOutfit] = useState<SharedOutfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/outfits/share?id=${params.shareId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setOutfit(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [params.shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !outfit) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-3">🤷</p>
          <h1 className="font-display font-bold text-xl mb-1">Outfit no encontrado</h1>
          <p className="text-sm text-muted">El link puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            {outfit.user.image && (
              <Image src={outfit.user.image} alt="" width={28} height={28} className="rounded-full" />
            )}
            <span className="text-sm text-muted">{outfit.user.name || "Alguien"}</span>
          </div>
          <h1 className="font-display font-bold text-2xl">{outfit.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            {outfit.occasion && <span className="tag-pill text-xs">{outfit.occasion}</span>}
            {outfit.weather && <span className="tag-pill text-xs">{outfit.weather}</span>}
            {outfit.rating && (
              <span className="tag-pill text-xs">{"⭐".repeat(outfit.rating)}</span>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {outfit.items.map(({ item }, i) => {
            const cat = CATEGORIES[item.category];
            return (
              <div key={i} className="card p-3 flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-border relative shrink-0">
                  <Image src={item.thumbnailUrl || item.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                </div>
                <div>
                  <p className="font-medium text-sm">{cat?.icon} {cat?.label}</p>
                  {item.brand && <p className="text-xs text-muted">{item.brand}</p>}
                  <div className="flex gap-1 mt-1.5">
                    {item.colors.slice(0, 3).map((hex, j) => (
                      <div key={j} className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted">Creado con</p>
          <p className="font-display font-bold">👔 Mi Vestidor</p>
        </div>
      </div>
    </div>
  );
}
