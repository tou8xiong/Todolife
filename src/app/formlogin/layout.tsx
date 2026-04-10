import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description: "Sign in to your TodoLife account to manage your tasks, track productivity, and access all your tools.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
