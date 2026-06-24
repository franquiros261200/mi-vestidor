"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { CATEGORIES, SEASONS, OCCASIONS } from "@/lib/constants";

type Step = "upload" | "analyzing" | "review";

interface AIResult {
  category: string;
  subcategory: string | null;
  colors: { hex: string; name: string }[];
  seasons: string[];
  occasions: string[];
  material: string | null;
  brand: string | null;
  confidence: number;
}

interface FormData {
  category: string;
  subcategory: string | null;
  seasons: string[];
  occasions: string[];
  material: string | null;
  brand: string | null;
}

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

export default function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [hasAI, setHasAI] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<typeof COMMON_COLORS>([]);
  const [formData, setFormData] = useState<FormData>({
    category: "remera",
    subcategory: null,
    seasons: [],
    occasions: [],
    material: null,
    brand: null,
  });
  const cameraRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setPreview(null);
    setHasAI(false);
    setItemId(null);
    setSelectedColors([]);
    setFormData({
      category: "remera",
      subcategory: null,
      seasons: [],
      occasions: [],
      material: null,
      brand: null,
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setStep("analyzing");

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (!res.ok) throw new Error("Error al subir");

        const data = await res.json();
        setItemId(data.item.id);
        setHasAI(data.hasAI);

        if (data.hasAI && data.aiSuggestions) {
          const ai = data.aiSuggestions as AIResult;
          setFormData({
            category: ai.category,
            subcategory: ai.subcategory,
            seasons: ai.seasons,
            occasions: ai.occasions,
            material: ai.material,
            brand: ai.brand,
          });
          setSelectedColors(ai.colors);
        }

        setStep("review");
      } catch (err) {
        toast.error("Error al procesar la imagen");
        setStep("upload");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDrop: (files) => files[0] && processFile(files[0]),
  });

  const handleConfirm = async () => {
    if (!itemId) return;

    try {
      await fetch("/api/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          ...formData,
          colors: selectedColors.map((c) => c.hex),
          colorNames: selectedColors.map((c) => c.name),
        }),
      });

      toast.success("Prenda agregada");
      onSuccess();
      handleClose();
    } catch {
      toast.error("Error al guardar");
    }
  };

  const toggleArrayItem = (field: "seasons" | "occasions", value: string) => {
    const current = formData[field];
    setFormData({
      ...formData,
      [field]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  const toggleColor = (color: typeof COMMON_COLORS[0]) => {
    setSelectedColors((prev) =>
      prev.some((c) => c.hex === color.hex)
        ? prev.filter((c) => c.hex !== color.hex)
        : prev.length < 3
        ? [...prev, color]
        : prev
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-bold text-lg">
            {step === "upload" && "Nueva prenda"}
            {step === "analyzing" && "Subiendo..."}
            {step === "review" && (hasAI ? "Confirmar datos" : "Completar datos")}
          </h2>
          <button onClick={handleClose} className="text-muted hover:text-ink p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {/* ── Upload ── */}
          {step === "upload" && (
            <div className="space-y-4">
              <button
                onClick={() => cameraRef.current?.click()}
                className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Tomar foto
              </button>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted uppercase tracking-wider">o</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? "dropzone-active border-accent bg-accent/5" : "border-border hover:border-muted"}`}
              >
                <input {...getInputProps()} />
                <div className="text-3xl mb-2">🖼️</div>
                <p className="text-sm text-muted">
                  {isDragActive ? "Soltá la imagen acá" : "Arrastrá o tocá para elegir de la galería"}
                </p>
                <p className="text-xs text-muted/60 mt-1">JPG, PNG, WebP — máx 10MB</p>
              </div>
            </div>
          )}

          {/* ── Analyzing ── */}
          {step === "analyzing" && (
            <div className="text-center py-8 space-y-4">
              {preview && (
                <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-xl mx-auto border border-border" />
              )}
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
              <p className="text-sm text-muted">Subiendo imagen...</p>
            </div>
          )}

          {/* ── Review / Manual ── */}
          {step === "review" && (
            <div className="space-y-5">
              {preview && (
                <img src={preview} alt="Prenda" className="w-32 h-32 object-cover rounded-xl mx-auto border border-border" />
              )}

              {hasAI && (
                <div className="text-center">
                  <span className="tag-pill text-xs bg-green-50 text-green-700">
                    ✨ Auto-detectado por IA
                  </span>
                </div>
              )}

              {!hasAI && (
                <div className="text-center">
                  <span className="tag-pill text-xs bg-yellow-50 text-yellow-700">
                    Completá los datos de la prenda
                  </span>
                  <p className="text-xs text-muted mt-1">
                    Podés activar IA en{" "}
                    <a href="/settings" className="text-accent hover:underline">Configuración</a>
                  </p>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wider">Categoría</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  Colores {selectedColors.length > 0 && `(${selectedColors.length}/3)`}
                </label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {COMMON_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => toggleColor(color)}
                      className={`flex items-center gap-1.5 tag-pill text-xs transition-all ${
                        selectedColors.some((c) => c.hex === color.hex)
                          ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                          : "hover:bg-tag/80"
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </button>
                  ))}
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
                        formData.seasons.includes(s.value)
                          ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                          : "hover:bg-tag/80"
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
                        formData.occasions.includes(o.value)
                          ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                          : "hover:bg-tag/80"
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
                    type="text"
                    value={formData.brand || ""}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value || null })}
                    placeholder="Opcional"
                    className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Material</label>
                  <input
                    type="text"
                    value={formData.material || ""}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value || null })}
                    placeholder="Opcional"
                    className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={handleClose} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleConfirm} className="btn-primary flex-1">Guardar prenda</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
