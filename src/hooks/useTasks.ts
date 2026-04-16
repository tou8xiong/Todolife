import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types/task";

interface UseTasksOptions {
  email: string | null;
  onTasksChange?: (tasks: Task[]) => void;
}

export function useTasks({ email, onTasksChange }: UseTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!email) return;

    const loadTasks = async () => {
      try {
        const res = await fetch(`/api/tasks?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.tasks) {
          setTasks(data.tasks);
          onTasksChange?.(data.tasks);
        }
      } catch {
        const stored = localStorage.getItem(`tasks_${email}`);
        const localTasks = stored ? JSON.parse(stored) : [];
        setTasks(localTasks);
        onTasksChange?.(localTasks);
      }
    };

    loadTasks();
  }, [email, onTasksChange]);

  const createTask = useCallback(async (taskData: Partial<Task>): Promise<Task | null> => {
    if (!email) return null;

    const newTask: Task = {
      id: Date.now(),
      title: taskData.title || "New Task",
      description: taskData.description,
      priority: taskData.priority || "medium",
      type: taskData.type || "work",
      date: taskData.date,
      time: taskData.time,
      completed: false,
      completedAt: null,
    };

    const updatedTasks = [...tasks, newTask];

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tasks: updatedTasks }),
      });

      if (!res.ok) throw new Error("Failed to save task");

      setTasks(updatedTasks);
      localStorage.setItem(`tasks_${email}`, JSON.stringify(updatedTasks));
      window.dispatchEvent(new Event("tasksUpdated"));
      onTasksChange?.(updatedTasks);
      return newTask;
    } catch {
      return null;
    }
  }, [email, tasks, onTasksChange]);

  const deleteTask = useCallback(async (taskId: number): Promise<boolean> => {
    if (!email) return false;

    const updatedTasks = tasks.filter((t) => t.id !== taskId);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tasks: updatedTasks }),
      });

      if (!res.ok) throw new Error("Failed to delete task");

      setTasks(updatedTasks);
      localStorage.setItem(`tasks_${email}`, JSON.stringify(updatedTasks));
      window.dispatchEvent(new Event("tasksUpdated"));
      onTasksChange?.(updatedTasks);
      return true;
    } catch {
      return false;
    }
  }, [email, tasks, onTasksChange]);

  const toggleTask = useCallback(async (taskId: number): Promise<boolean> => {
    if (!email) return false;

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: !t.completed,
          completedAt: !t.completed ? new Date().toISOString().split("T")[0] : null,
        };
      }
      return t;
    });

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tasks: updatedTasks }),
      });

      if (!res.ok) throw new Error("Failed to update task");

      setTasks(updatedTasks);
      localStorage.setItem(`tasks_${email}`, JSON.stringify(updatedTasks));
      window.dispatchEvent(new Event("tasksUpdated"));
      onTasksChange?.(updatedTasks);
      return true;
    } catch {
      return false;
    }
  }, [email, tasks, onTasksChange]);

  return {
    tasks,
    setTasks,
    createTask,
    deleteTask,
    toggleTask,
  };
}
