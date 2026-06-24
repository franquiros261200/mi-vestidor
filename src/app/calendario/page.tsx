"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function CalendarioPage() {
  return (
    <AppShell title="Calendario">
      <ComingSoon
        icon="📅"
        title="Calendario"
        description="Planificá qué ponerte cada día de la semana."
        features={[
          "Vista semanal y mensual",
          "Asignar un outfit completo a cada día",
          "Ver historial de qué usaste",
          "Evitar repetir outfit en la misma semana",
          "Notas por día (evento, reunión, salida)",
        ]}
      />
    </AppShell>
  );
}
