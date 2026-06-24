"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function OutfitsPage() {
  return (
    <AppShell title="Outfits">
      <ComingSoon
        icon="👔"
        title="Outfits"
        description="Armá combos completos y guardalos para no pensar."
        features={[
          "Crear outfits por ocasión: frío, calor, boliche, laburo, cita, gym",
          "Elegir prenda por prenda: remera + pantalón + zapatillas + accesorios",
          "Vista previa tipo collage con las fotos",
          "Puntuar tus outfits del 1 al 5",
          "Duplicar y modificar outfits existentes",
        ]}
      />
    </AppShell>
  );
}
