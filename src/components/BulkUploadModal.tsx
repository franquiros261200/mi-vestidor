"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import toast from "react-hot-toast";

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadJob {
  id: string;
  file: File;
  preview: string;
  status: "waiting" | "uploading" | "analyzing" | "done" | "error";
  progress: number;
  category?: string;
  colorNames?: string[];
  brand?: string | null;
  error?: string;
}

// Procesar UNA a la vez para no romper Neon ni Vercel
const CONCURRENCY = 1;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 2000;

export default function BulkUploadModal({ open, onClose, onSuccess }: BulkUploadModalProps) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [running, setRunning] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

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
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = () => reject(new Error("Imagen inválida"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Error leyendo archivo"));
      reader.readAsDataURL(file);
    });
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Retry wrapper
  const fetchWithRetry = async (url: string, options: RequestInit, attempts = RETRY_ATTEMPTS): Promise<Response> => {
    let lastError: any;
    for (let i = 0; i <= attempts; i++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) return res;
        // 429/500/502/503/504: reintentar
        if ([429, 500, 502, 503, 504].includes(res.status) && i < attempts) {
          await sleep(RETRY_DELAY * (i + 1));
          continue;
        }
        return res;
      } catch (err) {
        lastError = err;
        if (i < attempts) await sleep(RETRY_DELAY * (i + 1));
      }
    }
    throw lastError || new Error("Falló después de reintentos");
  };

  const processJob = async (
    job: UploadJob,
    updateJob: (patch: Partial<UploadJob>) => void
  ) => {
    try {
      if (cancelRef.current) return;

      updateJob({ status: "uploading", progress: 10 });
      const base64 = await compressImage(job.file);
      updateJob({ progress: 30 });

      if (cancelRef.current) return;

      // Paso 1: Cloudinary + DB (con reintentos)
      const uploadRes = await fetchWithRetry("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || `Error ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      updateJob({ progress: 60, status: "analyzing" });

      if (cancelRef.current) {
        // Ya subió a Cloudinary, no es un error
        updateJob({ status: "done", progress: 100 });
        return;
      }

      // Paso 2: IA (no crítico, si falla la prenda queda igual)
      try {
        const aiRes = await fetch("/api/ai-tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, itemId: uploadData.item.id }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.hasAI && aiData.aiSuggestions) {
            const ai = aiData.aiSuggestions;
            updateJob({
              status: "done",
              progress: 100,
              category: ai.category,
              colorNames: ai.colors?.map((c: any) => c.name) || [],
              brand: ai.brand,
            });
            return;
          }
        }
      } catch {
        // IA falló, la prenda queda subida sin tags
      }

      updateJob({ status: "done", progress: 100, category: "sin clasificar" });
    } catch (err: any) {
      updateJob({ status: "error", error: err.message || "Error desconocido" });
    }
  };

  const runSequential = async (initialJobs: UploadJob[]) => {
    setRunning(true);
    cancelRef.current = false;

    for (const job of initialJobs) {
      if (cancelRef.current) break;

      await processJob(job, (patch) => {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...patch } : j)));
      });

      // Pausa entre prendas para no saturar
      await sleep(500);
    }

    setRunning(false);
    if (!cancelRef.current) {
      toast.success("Todas las prendas procesadas");
      onSuccess();
    }
  };

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const newJobs: UploadJob[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: "waiting" as const,
      progress: 0,
    }));

    setJobs(newJobs);
    // Ejecutar sin bloquear
    runSequential(newJobs);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxSize: 15 * 1024 * 1024,
    onDrop,
  });

  const handleClose = () => {
    if (running) {
      if (!confirm("¿Cancelar? Las prendas ya subidas quedan guardadas.")) return;
      cancelRef.current = true;
    }
    setJobs([]);
    onClose();
  };

  const doneCount = jobs.filter((j) => j.status === "done").length;
  const errorCount = jobs.filter((j) => j.status === "error").length;
  const currentJob = jobs.find((j) => j.status === "uploading" || j.status === "analyzing");
  const currentIndex = currentJob ? jobs.indexOf(currentJob) + 1 : doneCount + errorCount;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-lg">Subir varias prendas</h2>
            {jobs.length > 0 && (
              <p className="text-xs text-muted mt-0.5">
                {running ? `Procesando ${currentIndex}/${jobs.length}` : `${doneCount}/${jobs.length} completadas`}
                {errorCount > 0 && ` · ${errorCount} con error`}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="text-muted hover:text-ink p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {jobs.length === 0 ? (
            <div className="space-y-4">
              <button
                onClick={() => cameraRef.current?.click()}
                className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Tomar varias fotos
              </button>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && onDrop(Array.from(e.target.files))}
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
                  {isDragActive ? "Soltá las imágenes acá" : "Arrastrá o tocá para elegir varias"}
                </p>
                <p className="text-xs text-muted/60 mt-1">Podés seleccionar múltiples · JPG, PNG, WebP</p>
              </div>

              <div className="card p-4 bg-tag/50 text-xs text-muted space-y-1">
                <p className="font-medium text-ink">Cómo funciona:</p>
                <p>• Se procesan una por una para no saturar</p>
                <p>• Si algo falla, reintenta automáticamente</p>
                <p>• Podés cancelar en cualquier momento</p>
                <p>• Las prendas subidas no se pierden aunque cierres</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div key={job.id} className="card p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-border relative shrink-0 bg-tag">
                    <Image src={job.preview} alt="" fill className="object-cover" sizes="48px" />
                    {job.status === "done" && (
                      <div className="absolute inset-0 bg-green-500/60 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                    {job.status === "error" && (
                      <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center text-white text-lg">✕</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {job.status === "done" ? (
                      <>
                        <p className="text-sm font-medium capitalize truncate">
                          {job.category || "Prenda subida"} {job.brand && `· ${job.brand}`}
                        </p>
                        {job.colorNames && job.colorNames.length > 0 && (
                          <p className="text-xs text-muted capitalize truncate">
                            {job.colorNames.join(", ")}
                          </p>
                        )}
                      </>
                    ) : job.status === "error" ? (
                      <p className="text-xs text-red-500 truncate">{job.error || "Error"}</p>
                    ) : (
                      <>
                        <p className="text-xs text-muted">
                          {job.status === "waiting" && "⏳ En espera..."}
                          {job.status === "uploading" && "📤 Subiendo..."}
                          {job.status === "analyzing" && "🧠 Analizando..."}
                        </p>
                        <div className="w-full bg-tag rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {jobs.length > 0 && !running && (
          <div className="border-t border-border p-4">
            <button onClick={handleClose} className="btn-primary w-full">
              Ver en el vestidor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
