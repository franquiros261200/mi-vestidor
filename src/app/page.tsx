"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import Catalog from "@/components/Catalog";
import UploadModal from "@/components/UploadModal";
import BulkUploadModal from "@/components/BulkUploadModal";

export default function Home() {
  const [mode, setMode] = useState<"choose" | "single" | "bulk" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const openUpload = () => setMode("choose");
  const closeAll = () => setMode(null);
  const onSuccess = () => setRefreshKey((k) => k + 1);

  return (
    <AppShell title="Mi Vestidor" onUploadClick={openUpload}>
      <Catalog refreshKey={refreshKey} />

      {/* Choose mode */}
      {mode === "choose" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAll} />
          <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-1">Agregar prendas</h2>
            <p className="text-sm text-muted mb-5">¿Cómo querés subirlas?</p>

            <div className="space-y-3">
              <button
                onClick={() => setMode("single")}
                className="w-full card p-4 text-left hover:bg-tag/50 transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">👕</span>
                <div>
                  <p className="font-medium text-sm">Una prenda</p>
                  <p className="text-xs text-muted">Con revisión antes de guardar</p>
                </div>
              </button>

              <button
                onClick={() => setMode("bulk")}
                className="w-full card p-4 text-left hover:bg-tag/50 transition-colors flex items-center gap-3 ring-2 ring-accent/20"
              >
                <span className="text-2xl">📚</span>
                <div>
                  <p className="font-medium text-sm">Varias prendas <span className="tag-pill text-[10px] bg-accent/10 text-accent ml-1">Rápido</span></p>
                  <p className="text-xs text-muted">Subís todas de una y Claude las clasifica</p>
                </div>
              </button>
            </div>

            <button onClick={closeAll} className="w-full mt-4 text-sm text-muted hover:text-ink py-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <UploadModal
        open={mode === "single"}
        onClose={closeAll}
        onSuccess={onSuccess}
      />

      <BulkUploadModal
        open={mode === "bulk"}
        onClose={closeAll}
        onSuccess={onSuccess}
      />
    </AppShell>
  );
}
