import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your TodoLife productivity dashboard. See your task overview, study sessions, recent ideas, and progress at a glance.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
