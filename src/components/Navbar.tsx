"use client";

interface NavbarProps {
  onMenuClick: () => void;
  onUploadClick?: () => void;
  title?: string;
}

export default function Navbar({ onMenuClick, onUploadClick, title = "Mi Vestidor" }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-tag transition-colors"
          >
            <span className="block w-5 h-[2px] bg-ink rounded-full" />
            <span className="block w-5 h-[2px] bg-ink rounded-full" />
            <span className="block w-5 h-[2px] bg-ink rounded-full" />
          </button>
          <h1 className="font-display font-bold text-lg tracking-tight">{title}</h1>
        </div>

        {/* Right: upload button */}
        {onUploadClick && (
          <button onClick={onUploadClick} className="btn-primary text-sm flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Agregar</span>
          </button>
        )}
      </div>
    </nav>
  );
}
