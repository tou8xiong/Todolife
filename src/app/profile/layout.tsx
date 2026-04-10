import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your TodoLife profile. Update your display name, profile picture, and personal preferences.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
