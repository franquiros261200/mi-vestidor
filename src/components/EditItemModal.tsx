"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { CATEGORIES, SEASONS, OCCASIONS, STYLES, FORMALITY_LEVELS, SILHOUETTES } from "@/lib/constants";

interface Item {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  category: string;
  subcategory: string | null;
  colors: string[];
  colorNames: string[];
  brand: string | null;
  material: string | null;
  seasons: string[];
  occasions: string[];
  style: string | null;
  formality: number;
  silhouette: string | null;
}

interface EditItemModalProps {
  item: Item | null;
  onClose: () => void;
  onSave: () => void;
}

const COMMON_COLORS = [
  { hex: "#000000", name: "negro" },
  { hex: "#FFFFFF", name: "blanco" },
  { hex: "#808080", name: "gris" },
  { hex: "#1E3A5F", name: "azul marino" },
  { hex: "#3B82F6", name: "azul" },
  { hex: "#EF4444", name: "rojo" },
  { hex: "#22C55E", name: "verde" },
  { hex: "#F59E0B", name: "amarillo" },
  { hex: "#D97706", name: "marrón" },
  { hex: "#EC4899", name: "rosa" },
  { hex: "#8B5CF6", name: "violeta" },
  { hex: "#F97316", name: "naranja" },
  { hex: "#F5F5DC", name: "beige" },
  { hex: "#C0C0C0", name: "plateado" },
];

export default function EditItemModal({ item, onClose, onSave }: EditItemModalProps) {
  const [form, setForm] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingPhoto, setAddingPhoto] = useState(false);

  useEffect(() => {
    setForm(item);
  }, [item]);

  if (!item || !form) return null;

  const toggleArrayItem = (field: "seasons" | "occasions", value: string) => {
    const current = form[field];
    setForm({
      ...form,
      [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  };

  const toggleColor = (color: typeof COMMON_COLORS[0]) => {
    const isSelected = form.colors.includes(color.hex);
    if (isSelected) {
      const idx = form.colors.indexOf(color.hex);
      setForm({
        ...form,
        colors: form.colors.filter((_, i) => i !== idx),
        colorNames: form.colorNames.filter((_, i) => i !== idx),
      });
    } else if (form.colors.length < 3) {
      setForm({
        ...form,
        colors: [...form.colors, color.hex],
        colorNames: [...form.colorNames, color.name],
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          category: form.category,
          subcategory: form.subcategory,
          colors: form.colors,
          colorNames: form.colorNames,
          brand: form.brand,
          material: form.material,
          seasons: form.seasons,
          occasions: form.occasions,
          style: form.style,
          formality: form.formality,
          silhouette: form.silhouette,
        }),
      });
      toast.success("Guardado");
      onSave();
      onClose();
    } catch {
      toast.error("Error al guardar");
    }
    setSaving(false);
  };

  const compressImage = (file: File, maxWidth = 1000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhotos = async (files: FileList) => {
    setAddingPhoto(true);
    try {
      const base64Images = await Promise.all(
        Array.from(files).slice(0, 4).map((f) => compressImage(f))
      );

      // Include current image as reference
      const res = await fetch("/api/reanalyze/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: form.id, extraImages: base64Images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh form with new data
      const ai = data.aiResult;
      setForm({
        ...form,
        category: ai.category,
        subcategory: ai.subcategory,
        colors: ai.colors.map((c: any) => c.hex),
        colorNames: ai.colors.map((c: any) => c.name),
        seasons: ai.seasons,
        occasions: ai.occasions,
        material: ai.material,
        brand: ai.brand,
        style: ai.style,
        formality: ai.formality,
        silhouette: ai.silhouette,
      });
      toast.success("Reclasificado con más fotos");
    } catch (err: any) {
      toast.error(err.message || "Error");
    }
    setAddingPhoto(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-bold text-lg">Editar prenda</h2>
          <button onClick={onClose} className="text-muted hover:text-ink p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Image + add more photos */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-xl overflow-hidden border border-border relative">
              <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="128px" />
            </div>
            <label className="text-xs text-accent hover:underline cursor-pointer">
              📸 Agregar más fotos para reclasificar
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={addingPhoto}
                onChange={(e) => e.target.files && handleAddPhotos(e.target.files)}
              />
            </label>
            {addingPhoto && (
              <div className="text-xs text-muted flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                Analizando con múltiples ángulos...
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
                <option key={key} value={key}>{icon} {label}</option>
              ))}
            </select>
          </div>

          {/* Colors */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Colores ({form.colors.length}/3)
            </label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {COMMON_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => toggleColor(color)}
                  className={`flex items-center gap-1.5 tag-pill text-xs transition-all ${
                    form.colors.includes(color.hex) ? "bg-accent/10 text-accent ring-1 ring-accent/30" : "hover:bg-tag/80"
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Estilo</label>
              <select
                value={form.style || ""}
                onChange={(e) => setForm({ ...form, style: e.target.value || null })}
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="">Sin definir</option>
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Silueta</label>
              <select
                value={form.silhouette || ""}
                onChange={(e) => setForm({ ...form, silhouette: e.target.value || null })}
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="">Sin definir</option>
                {SILHOUETTES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Formality */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Formalidad: {FORMALITY_LEVELS.find((f) => f.value === form.formality)?.label}
            </label>
            <input
              type="range" min={1} max={5} step={1} value={form.formality}
              onChange={(e) => setForm({ ...form, formality: parseInt(e.target.value) })}
              className="w-full mt-1.5 accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>Muy casual</span>
              <span>Muy formal</span>
            </div>
          </div>

          {/* Seasons */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Temporada</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {SEASONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => toggleArrayItem("seasons", s.value)}
                  className={`tag-pill text-xs transition-colors ${
                    form.seasons.includes(s.value) ? "bg-accent/10 text-accent ring-1 ring-accent/30" : "hover:bg-tag/80"
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Occasions */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Ocasión</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {OCCASIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => toggleArrayItem("occasions", o.value)}
                  className={`tag-pill text-xs transition-colors ${
                    form.occasions.includes(o.value) ? "bg-accent/10 text-accent ring-1 ring-accent/30" : "hover:bg-tag/80"
                  }`}
                >
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brand & Material */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Marca</label>
              <input
                type="text" value={form.brand || ""}
                onChange={(e) => setForm({ ...form, brand: e.target.value || null })}
                placeholder="Opcional"
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Material</label>
              <input
                type="text" value={form.material || ""}
                onChange={(e) => setForm({ ...form, material: e.target.value || null })}
                placeholder="Opcional"
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
