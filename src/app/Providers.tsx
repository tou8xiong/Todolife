"use client";
import { AlertProvider } from "@/hooks/useAlert";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AlertProvider>
      {children}
      <Toaster richColors position="top-right" />
    </AlertProvider>
  );
}
