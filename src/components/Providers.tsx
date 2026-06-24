"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#1A1A1A",
            color: "#fff",
            borderRadius: "10px",
            fontSize: "14px",
          },
        }}
      />
      {children}
    </SessionProvider>
  );
}
