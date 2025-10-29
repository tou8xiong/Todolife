"use client";
import { useEffect, useState } from "react";

export interface Task {
  completed?: boolean;
}

export type TaskCounts = { total: number; pending: number; completed: number };

export function useTaskCounts(): TaskCounts {
  const [counts, setCounts] = useState<TaskCounts>({ total: 0, pending: 0, completed: 0 });

  const compute = () => {
    try {
      const tasks: Task[] = JSON.parse(localStorage.getItem("tasks") || "[]");
      const total = tasks.length;
      const completed = tasks.filter((t) => t && t.completed).length;
      const pending = total - completed;
      setCounts({ total, pending, completed });
    } catch {
      setCounts({ total: 0, pending: 0, completed: 0 });
    }
  };

  useEffect(() => {
    compute();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "tasks") compute();
    };
    const onUpdated = () => compute();

    window.addEventListener("storage", onStorage);
    window.addEventListener("tasksUpdated", onUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tasksUpdated", onUpdated as EventListener);
    };
  }, []);

  return counts;
}
