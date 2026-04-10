"use client";
import { useAppContext } from "@/context/AppContext";
import { TaskCounts } from "@/types/task";

export function useTaskCounts(): TaskCounts {
  return useAppContext().taskCounts;
}
