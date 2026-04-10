import AgentChat from "@/components/agent/AgentChat";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Agent",
  description: "Chat with your personal AI productivity assistant. Ask about your tasks, get summaries, create tasks, and receive actionable suggestions.",
};

export default function AgentPage() {
  return <AgentChat />;
}
