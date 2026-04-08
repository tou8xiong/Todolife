"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Task, TaskCounts } from "@/types/task";

export function useTaskCounts(): TaskCounts {
  const [counts, setCounts] = useState<TaskCounts>({ total: 0, pending: 0, completed: 0 });
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setEmail(user?.email ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const compute = async () => {
      if (!email) return;
      try {
        const res = await fetch(`/api/tasks?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        const tasks: Task[] = data.tasks ?? [];
        const total = tasks.length;
        const completed = tasks.filter((t) => t.completed).length;
        setCounts({ total, pending: total - completed, completed });
      } catch {
        setCounts({ total: 0, pending: 0, completed: 0 });
      }
    };

    compute();
    const onUpdated = () => compute();
    window.addEventListener("tasksUpdated", onUpdated as EventListener);
    return () => window.removeEventListener("tasksUpdated", onUpdated as EventListener);
  }, [email]);

  return counts;
}
