"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function FaltaPage() {
  return (
    <AppShell title="Lo que me falta">
      <ComingSoon
        icon="📦"
        title="Lo que me falta"
        description="Detectá huecos en tu guardarropa."
        features={[
          "Análisis automático de balance (12 remeras vs 2 pantalones)",
          "Sugerencias de qué categoría necesitás reforzar",
          "Detectar colores que te faltan para más combinaciones",
          "Checklist de básicos esenciales",
          "Conectar con wishlist para planear compras",
        ]}
      />
    </AppShell>
  );
}
