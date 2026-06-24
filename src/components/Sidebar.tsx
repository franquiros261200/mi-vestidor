"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { href: "/", label: "Mi Vestidor", icon: "👕", description: "Tu catálogo de prendas" },
  { href: "/outfits", label: "Outfits", icon: "👔", description: "Armá y guardá combos" },
  { href: "/calendario", label: "Calendario", icon: "📅", description: "Planificá qué ponerte" },
  { href: "/random", label: "Fashion Engine", icon: "🎲", description: "Outfits inteligentes con puntaje" },
  { href: "/clima", label: "Clima + Sugerencia", icon: "🌤️", description: "Outfit según el clima" },
  { divider: true },
  { href: "/laundry", label: "Laundry", icon: "🧺", description: "Qué está en el lavarropas" },
  { href: "/wishlist", label: "Wishlist", icon: "🛒", description: "Prendas que quiero" },
  { divider: true },
  { href: "/stats", label: "Estadísticas", icon: "📊", description: "Uso y distribución" },
  { href: "/falta", label: "Lo que me falta", icon: "📦", description: "Huecos en tu vestidor" },
  { href: "/compartir", label: "Compartir", icon: "👥", description: "Mostrá tu outfit" },
  { divider: true },
  { href: "/settings", label: "Configuración", icon: "⚙️", description: "API keys y cuenta" },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-250 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* User header */}
        <div className="p-5 border-b border-border">
          {session?.user && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border shrink-0">
                {session.user.image ? (
                  <Image src={session.user.image} alt="" width={40} height={40} className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-accent text-white flex items-center justify-center font-medium">
                    {session.user.name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{session.user.name}</p>
                <p className="text-xs text-muted truncate">{session.user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Menu items */}
        <nav className="py-2 overflow-y-auto h-[calc(100%-140px)]">
          {MENU_ITEMS.map((item, i) => {
            if ("divider" in item) {
              return <div key={i} className="my-2 mx-4 h-px bg-border" />;
            }

            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={onClose}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-ink hover:bg-tag"
                }`}
              >
                <span className="text-lg w-7 text-center shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
                    {item.label}
                  </p>
                  <p className="text-[11px] text-muted truncate">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-white">
          <button
            onClick={() => signOut()}
            className="w-full text-left px-3 py-2 text-sm text-muted hover:text-ink hover:bg-tag rounded-lg transition-colors"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
