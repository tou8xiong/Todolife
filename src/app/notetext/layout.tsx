import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Note Text",
  description: "Write and format rich text documents",
};

export default function NoteTextLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
