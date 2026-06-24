"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function RandomPage() {
  return (
    <AppShell title="Outfit Random">
      <ComingSoon
        icon="🎲"
        title="Outfit Random"
        description="No sabés qué ponerte? Dejá que el azar decida."
        features={[
          "Filtrar por ocasión y clima antes de tirar los dados",
          "Genera un outfit completo al azar con tus prendas",
          "Botón de 're-roll' por categoría (no me gusta la remera, dame otra)",
          "Guardar el outfit si te copa",
          "Solo usa prendas disponibles (no las que están en el lavarropas)",
        ]}
      />
    </AppShell>
  );
}
