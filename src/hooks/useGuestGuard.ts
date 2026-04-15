"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";

export function useGuestGuard() {
  const { user, authLoading } = useAppContext();
  const router = useRouter();

  const requireAuth = (callback?: () => void) => {
    if (authLoading) return false;
    if (!user) {
      toast.error("Please login to access this feature", {
        action: {
          label: "Login",
          onClick: () => router.push("/formlogin"),
        },
      });
      return false;
    }
    callback?.();
    return true;
  };

  return { requireAuth, isAuthenticated: !!user, isLoading: authLoading };
}
