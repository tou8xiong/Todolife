import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Background Remover",
  description: "Remove image backgrounds instantly for free with TodoLife's AI-powered background removal tool. No design skills needed.",
};

export default function BackgroundRemovalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
