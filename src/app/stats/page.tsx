"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function StatsPage() {
  return (
    <AppShell title="Estadísticas">
      <ComingSoon
        icon="📊"
        title="Estadísticas"
        description="Entendé tu guardarropa con datos."
        features={[
          "Distribución por categoría (cuántas remeras, pantalones, etc.)",
          "Distribución por color (tu paleta real)",
          "Ranking de prendas más usadas y menos usadas",
          "Costo por uso si cargás precios",
          "Prendas sin usar hace más de 30/60/90 días",
        ]}
      />
    </AppShell>
  );
}
