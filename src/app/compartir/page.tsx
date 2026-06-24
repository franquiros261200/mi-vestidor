"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { CATEGORIES } from "@/lib/constants";
import toast from "react-hot-toast";

interface OutfitItem {
  item: { id: string; thumbnailUrl: string | null; imageUrl: string; category: string; brand: string | null };
}

interface Outfit {
  id: string;
  name: string;
  occasion: string | null;
  shareId: string | null;
  items: OutfitItem[];
}

export default function CompartirPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/outfits").then((r) => r.json()).then((data) => { setOutfits(data); setLoading(false); });
  }, []);

  const shareOutfit = async (outfitId: string) => {
    setSharing(outfitId);
    const res = await fetch("/api/outfits/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId }),
    });
    const { shareId } = await res.json();
    const url = `${window.location.origin}/compartir/${shareId}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado al portapapeles");
    } catch {
      toast.success(`Link: ${url}`);
    }

    setOutfits((prev) => prev.map((o) => (o.id === outfitId ? { ...o, shareId } : o)));
    setSharing(null);
  };

  return (
    <AppShell title="Compartir">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <p className="text-sm text-muted mb-4">Elegí un outfit para compartir un link público.</p>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse"><div className="h-14 bg-tag rounded" /></div>
            ))}
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">👥</p>
            <h3 className="font-display font-bold text-lg mb-1">No tenés outfits para compartir</h3>
            <p className="text-sm text-muted">Creá outfits primero en la sección Outfits.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outfits.map((outfit) => (
              <div key={outfit.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm">{outfit.name}</h3>
                  <button
                    onClick={() => shareOutfit(outfit.id)}
                    disabled={sharing === outfit.id}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    {sharing === outfit.id ? "..." : outfit.shareId ? "🔗 Copiar link" : "📤 Compartir"}
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {outfit.items.map(({ item }) => (
                    <div key={item.id} className="w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0 relative">
                      <Image src={item.thumbnailUrl || item.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                  ))}
                </div>
                {outfit.shareId && (
                  <p className="text-[11px] text-muted mt-2 truncate">
                    🔗 {window.location.origin}/compartir/{outfit.shareId}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
