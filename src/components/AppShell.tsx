"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  onUploadClick?: () => void;
}

export default function AppShell({ children, title, onUploadClick }: AppShellProps) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
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
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar
        onMenuClick={() => setSidebarOpen(true)}
        onUploadClick={onUploadClick}
        title={title}
      />
      {children}
    </div>
  );
}
