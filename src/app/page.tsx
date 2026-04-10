import type { Metadata } from "next";
import HomeClient from "@/components/home/HomeClient";

export const metadata: Metadata = {
  title: "TodoLife — Manage Your Tasks & Life",
  description:
    "TodoLife is your free all-in-one productivity app. Add tasks, track progress, study with timers, annotate PDFs, capture ideas, and remove image backgrounds — all in one place.",
  openGraph: {
    title: "TodoLife — Manage Your Tasks & Life",
    description:
      "Your free all-in-one productivity app. Tasks, timers, PDF annotations, idea notes, AI assistant, and more.",
    url: "https://todolife.vercel.app",
  },
};

export default function Home() {
  return <HomeClient />;
}
