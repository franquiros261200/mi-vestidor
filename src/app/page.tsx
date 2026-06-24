"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Catalog from "@/components/Catalog";
import UploadModal from "@/components/UploadModal";

export default function Home() {
  const { data: session, status } = useSession();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-2">👔</span>
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar onUploadClick={() => setUploadOpen(true)} />
      <Catalog refreshKey={refreshKey} />
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
