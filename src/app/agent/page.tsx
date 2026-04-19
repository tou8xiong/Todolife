"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import AgentChat from "@/components/agent/AgentChat";
import { toast } from "sonner";

export default function AgentPage() {
  const { user, authLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to access AI Agent", {
        action: {
          label: "Login",
          onClick: () => router.push("/formlogin"),
        },
      });
      router.push("/formlogin");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <AgentChat />;
}
