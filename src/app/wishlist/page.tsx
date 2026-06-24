"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function WishlistPage() {
  return (
    <AppShell title="Wishlist">
      <ComingSoon
        icon="🛒"
        title="Wishlist"
        description="Prendas que querés comprarte, con precio y link."
        features={[
          "Agregar prendas con foto, precio y link a la tienda",
          "Organizar por prioridad",
          "Ver cómo combinarían con lo que ya tenés",
          "Presupuesto total de la wishlist",
          "Marcar como comprada y moverla al vestidor",
        ]}
      />
    </AppShell>
  );
}
