"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAppContext } from "@/context/AppContext";

export default function MainLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { forceExpandSidebar } = useAppContext();
  
  const isCompact = pathname === "/notetext" && !forceExpandSidebar;

  return (
    <main className={`${isCompact ? "md:ml-16" : "md:ml-45"} min-h-[calc(100vh-4rem)] transition-all duration-300`}>
      {children}
    </main>
  );
}
