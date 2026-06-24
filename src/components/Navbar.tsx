"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

interface NavbarProps {
  onUploadClick: () => void;
}

export default function Navbar({ onUploadClick }: NavbarProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl">👔</span>
          <h1 className="font-display font-bold text-lg tracking-tight">
            Mi Vestidor
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={onUploadClick} className="btn-primary text-sm flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Agregar</span>
          </button>

          {/* User avatar */}
          {session?.user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-border hover:border-accent transition-colors"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-accent text-white flex items-center justify-center text-sm font-medium">
                    {session.user.name?.[0] || "?"}
                  </div>
                )}
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 card p-1 shadow-lg">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium truncate">{session.user.name}</p>
                      <p className="text-xs text-muted truncate">{session.user.email}</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); window.location.href = "/settings"; }}
                      className="w-full text-left px-3 py-2 text-sm text-muted hover:text-ink hover:bg-tag rounded transition-colors"
                    >
                      ⚙️ Configuración
                    </button>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-3 py-2 text-sm text-muted hover:text-ink hover:bg-tag rounded transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
