"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function CompartirPage() {
  return (
    <AppShell title="Compartir">
      <ComingSoon
        icon="👥"
        title="Compartir"
        description="Mostrá tu outfit y pedí opiniones."
        features={[
          "Compartir outfit del día con un link",
          "Votación: le copa o no le copa",
          "Feed de outfits de amigos",
          "Comentarios y sugerencias",
          "Perfil público opcional con tu estilo",
        ]}
      />
    </AppShell>
  );
}
