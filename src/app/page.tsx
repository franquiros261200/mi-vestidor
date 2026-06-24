"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import Catalog from "@/components/Catalog";
import UploadModal from "@/components/UploadModal";

export default function Home() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppShell title="Mi Vestidor" onUploadClick={() => setUploadOpen(true)}>
      <Catalog refreshKey={refreshKey} />
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </AppShell>
  );
}
