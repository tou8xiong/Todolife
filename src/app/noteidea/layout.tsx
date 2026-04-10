import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Idea Notes",
  description: "Capture and organize your ideas instantly with TodoLife Idea Notes. Never lose a great thought again.",
};

export default function NoteIdeaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
