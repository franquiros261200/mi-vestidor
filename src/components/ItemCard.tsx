"use client";

import { useState } from "react";
import Image from "next/image";
import { CATEGORIES } from "@/lib/constants";
import EditItemModal from "./EditItemModal";
import toast from "react-hot-toast";

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

interface ItemCardProps {
  item: Item;
  onUpdate: () => void;
}

export default function ItemCard({ item, onUpdate }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const cat = CATEGORIES[item.category];

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, favorite: !item.favorite }),
    });
    onUpdate();
  };

  const markWorn = async () => {
    await fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        timesWorn: item.timesWorn + 1,
        lastWornAt: new Date().toISOString(),
      }),
    });
    toast.success("Registrado");
    onUpdate();
  };

  const deleteItem = async () => {
    if (!confirm("¿Eliminar esta prenda?")) return;
    setDeleting(true);
    await fetch("/api/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    toast.success("Prenda eliminada");
    onUpdate();
  };

  const [reanalyzing, setReanalyzing] = useState(false);
  const reanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await fetch("/api/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Reclasificada por IA");
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Error al reanalizar");
    }
    setReanalyzing(false);
  };

  return (
    <>
      {/* Card */}
      <div
        onClick={() => setExpanded(true)}
        className="card overflow-hidden cursor-pointer group hover:shadow-md transition-shadow"
      >
        {/* Image */}
        <div className="relative aspect-square bg-tag">
          <Image
            src={item.thumbnailUrl || item.imageUrl}
            alt={cat?.label || item.category}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Favorite heart */}
          <button
            onClick={toggleFavorite}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center transition-transform hover:scale-110"
          >
            <span className="text-sm">{item.favorite ? "❤️" : "🤍"}</span>
          </button>

          {/* Color dots */}
          <div className="absolute bottom-2 left-2 flex gap-1">
            {item.colors.slice(0, 3).map((hex, i) => (
              <div
                key={i}
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{cat?.icon}</span>
            <span className="text-sm font-medium">{cat?.label || item.category}</span>
          </div>
          {item.brand && (
            <p className="text-xs text-muted mt-0.5">{item.brand}</p>
          )}
          {item.timesWorn > 0 && (
            <p className="text-[11px] text-muted/60 mt-1">
              Usado {item.timesWorn}x
            </p>
          )}
        </div>
      </div>

      {/* Detail overlay */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setExpanded(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto">
            {/* Big image */}
            <div className="relative aspect-square bg-tag">
              <Image src={item.imageUrl} alt="" fill className="object-contain" sizes="100vw" />
              <button
                onClick={() => setExpanded(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg">
                    {cat?.icon} {cat?.label}
                    {item.subcategory && <span className="text-muted font-normal"> · {item.subcategory}</span>}
                  </h3>
                  {item.brand && <p className="text-sm text-muted">{item.brand}</p>}
                </div>
                <button onClick={toggleFavorite} className="text-xl">
                  {item.favorite ? "❤️" : "🤍"}
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {item.colorNames.map((c, i) => (
                  <span key={i} className="tag-pill text-xs capitalize">
                    <span className="w-2.5 h-2.5 rounded-full inline-block mr-1" style={{ backgroundColor: item.colors[i] }} />
                    {c}
                  </span>
                ))}
                {item.seasons.map((s) => (
                  <span key={s} className="tag-pill text-xs">{s}</span>
                ))}
                {item.occasions.map((o) => (
                  <span key={o} className="tag-pill text-xs">{o}</span>
                ))}
                {item.material && <span className="tag-pill text-xs">{item.material}</span>}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="card p-3">
                  <p className="text-2xl font-bold">{item.timesWorn}</p>
                  <p className="text-xs text-muted">veces usado</p>
                </div>
                <div className="card p-3">
                  <p className="text-sm font-medium">
                    {item.lastWornAt
                      ? new Date(item.lastWornAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
                      : "Nunca"}
                  </p>
                  <p className="text-xs text-muted">último uso</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={markWorn} className="btn-primary flex-1 text-sm">
                  Me lo puse hoy
                </button>
                <button
                  onClick={() => { setExpanded(false); setEditing(true); }}
                  className="btn-secondary px-3 text-sm"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={reanalyze}
                  disabled={reanalyzing}
                  className="btn-secondary px-3 text-sm"
                  title="Reclasificar con IA"
                >
                  {reanalyzing ? "..." : "🧠"}
                </button>
                <button
                  onClick={deleteItem}
                  disabled={deleting}
                  className="btn-secondary px-3 text-sm text-red-500 hover:text-red-600 hover:border-red-200"
                >
                  {deleting ? "..." : "🗑️"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditItemModal
          item={item}
          onClose={() => setEditing(false)}
          onSave={onUpdate}
        />
      )}
    </>
  );
}
