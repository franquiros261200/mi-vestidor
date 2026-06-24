"use client";

interface PlaceholderProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

export default function ComingSoon({ icon, title, description, features }: PlaceholderProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <span className="text-6xl block mb-4">{icon}</span>
      <h2 className="font-display font-bold text-2xl mb-2">{title}</h2>
      <p className="text-muted text-sm mb-8">{description}</p>

      <div className="card p-5 text-left space-y-3">
        <p className="text-xs font-medium text-muted uppercase tracking-wider">Próximamente</p>
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-accent mt-0.5 text-sm">◆</span>
            <span className="text-sm text-ink">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
