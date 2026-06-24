"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function LaundryPage() {
  return (
    <AppShell title="Laundry">
      <ComingSoon
        icon="🧺"
        title="Laundry"
        description="Marcá qué está en el lavarropas para no contarlo como disponible."
        features={[
          "Swipe o tap para mandar al lavarropas",
          "Las prendas en lavado no aparecen al armar outfits",
          "Botón de 'ya lavé todo' para resetear",
          "Contador de prendas sucias vs limpias",
          "Historial de ciclos de lavado",
        ]}
      />
    </AppShell>
  );
}
