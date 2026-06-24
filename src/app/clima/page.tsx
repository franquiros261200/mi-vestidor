"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function ClimaPage() {
  return (
    <AppShell title="Clima + Sugerencia">
      <ComingSoon
        icon="🌤️"
        title="Clima + Sugerencia"
        description="Outfit acorde al clima de hoy en Mar del Plata."
        features={[
          "Clima actual y pronóstico del día",
          "Sugerencia automática de outfit según temperatura y lluvia",
          "Filtrar por ocasión del día (laburo, salida, casual)",
          "Integración con API de clima en tiempo real",
          "Historial de sugerencias anteriores",
        ]}
      />
    </AppShell>
  );
}
