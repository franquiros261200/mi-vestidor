"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

interface PendingItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  category: string;
}

interface ReanalyzeBannerProps {
  onDone: () => void;
}

export default function ReanalyzeBanner({ onDone }: ReanalyzeBannerProps) {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/reanalyze/pending")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setPending(data));
  }, []);

  const runAll = async () => {
    setRunning(true);
    setCurrentIndex(0);
    let failed = 0;

    for (let i = 0; i < pending.length; i++) {
      setCurrentIndex(i);
      try {
        const res = await fetch("/api/reanalyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: pending[i].id }),
        });
        if (!res.ok) failed++;
        // Pausa entre requests para no saturar
        await new Promise((r) => setTimeout(r, 800));
      } catch {
        failed++;
      }
    }

    setRunning(false);
    setPending([]);
    if (failed > 0) toast.error(`${failed} prendas fallaron. Reintentá.`);
    else toast.success(`${pending.length} prendas reclasificadas`);
    onDone();
  };

  if (pending.length === 0 && !running) return null;

  return (
    <div className="card p-4 mb-4 bg-yellow-50/50 border-yellow-200">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-yellow-900">
            {running
              ? `Reclasificando ${currentIndex + 1}/${pending.length}...`
              : `${pending.length} prenda${pending.length !== 1 ? "s" : ""} sin clasificar bien`}
          </p>
          <p className="text-xs text-yellow-700 mt-0.5">
            {running
              ? "Cada prenda tarda unos segundos. Podés seguir usando la app."
              : "Estas prendas se subieron sin ser analizadas por IA. Reclasificalas para que el Fashion Engine funcione bien."}
          </p>

          {running && (
            <div className="w-full bg-yellow-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full bg-yellow-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / pending.length) * 100}%` }}
              />
            </div>
          )}

          {!running && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={runAll}
                className="btn-primary text-sm py-1.5 px-3"
              >
                🧠 Reclasificar todas
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-yellow-700 hover:underline"
              >
                {expanded ? "Ocultar" : "Ver prendas"}
              </button>
            </div>
          )}

          {expanded && !running && (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 mt-3">
              {pending.slice(0, 24).map((item) => (
                <div key={item.id} className="aspect-square rounded-md overflow-hidden border border-yellow-200 relative">
                  <Image
                    src={item.thumbnailUrl || item.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="60px"
                  />
                </div>
              ))}
              {pending.length > 24 && (
                <div className="aspect-square rounded-md bg-yellow-100 flex items-center justify-center text-xs text-yellow-700 font-medium">
                  +{pending.length - 24}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
