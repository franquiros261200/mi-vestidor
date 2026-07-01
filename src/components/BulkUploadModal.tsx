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

const CONCURRENCY = 3; // subir 3 en paralelo

export default function BulkUploadModal({ open, onClose, onSuccess }: BulkUploadModalProps) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [running, setRunning] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxWidth = 1200): Promise<string> => {
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
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processJob = async (
    job: UploadJob,
    updateJob: (patch: Partial<UploadJob>) => void
  ) => {
    try {
      updateJob({ status: "uploading", progress: 10 });
      const base64 = await compressImage(job.file);
      updateJob({ progress: 30 });

      // Paso 1: Cloudinary + DB
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!uploadRes.ok) throw new Error("Error al subir");
      const uploadData = await uploadRes.json();
      updateJob({ progress: 60, status: "analyzing" });

      // Paso 2: IA (no bloqueante, si falla queda sin tags)
      try {
        const aiRes = await fetch("/api/ai-tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, itemId: uploadData.item.id }),
        });
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
      } catch {
        // IA falló, pero la prenda ya está subida
      }

      updateJob({ status: "done", progress: 100 });
    } catch (err: any) {
      updateJob({ status: "error", error: err.message || "Error" });
    }
  };

  const runBatch = async (initialJobs: UploadJob[]) => {
    setRunning(true);

    // Cola de trabajo con concurrencia limitada
    const queue = [...initialJobs];
    const workers: Promise<void>[] = [];

    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push((async () => {
        while (queue.length > 0) {
          const job = queue.shift();
          if (!job) break;
          await processJob(job, (patch) => {
            setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...patch } : j)));
          });
        }
      })());
    }

    await Promise.all(workers);
    setRunning(false);
    toast.success("Todas las prendas procesadas");
    onSuccess();
  };

  const onDrop = useCallback(async (files: File[]) => {
    const newJobs: UploadJob[] = await Promise.all(
      files.map(async (file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        status: "waiting" as const,
        progress: 0,
      }))
    );

    setJobs(newJobs);
    runBatch(newJobs);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxSize: 15 * 1024 * 1024,
    onDrop,
  });

  const handleClose = () => {
    if (running) {
      if (!confirm("¿Cerrar? Se van a seguir procesando las prendas.")) return;
    }
    setJobs([]);
    onClose();
  };

  const doneCount = jobs.filter((j) => j.status === "done").length;
  const errorCount = jobs.filter((j) => j.status === "error").length;

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
                {doneCount}/{jobs.length} completadas {errorCount > 0 && `· ${errorCount} con error`}
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
                  {isDragActive ? "Soltá las imágenes acá" : "Arrastrá o tocá para elegir varias de la galería"}
                </p>
                <p className="text-xs text-muted/60 mt-1">Podés seleccionar múltiples · JPG, PNG, WebP</p>
              </div>

              <div className="card p-4 bg-tag/50 text-xs text-muted space-y-1">
                <p className="font-medium text-ink">Cómo funciona:</p>
                <p>1. Elegís todas las fotos de una</p>
                <p>2. Se procesan de a 3 al mismo tiempo</p>
                <p>3. Claude analiza cada prenda automáticamente</p>
                <p>4. Al terminar las revisás en el catálogo</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div key={job.id} className="card p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-border relative shrink-0">
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
                        <p className="text-sm font-medium capitalize">
                          {job.category || "Prenda"} {job.brand && `· ${job.brand}`}
                        </p>
                        {job.colorNames && job.colorNames.length > 0 && (
                          <p className="text-xs text-muted capitalize">
                            {job.colorNames.join(", ")}
                          </p>
                        )}
                      </>
                    ) : job.status === "error" ? (
                      <p className="text-xs text-red-500">{job.error || "Error"}</p>
                    ) : (
                      <>
                        <p className="text-xs text-muted">
                          {job.status === "waiting" && "En espera..."}
                          {job.status === "uploading" && "Subiendo imagen..."}
                          {job.status === "analyzing" && "Analizando con IA..."}
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

        {/* Footer */}
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
