export interface Task {
  id: number;
  title: string;
  description?: string;
  date?: string;
  priority?: string;
  time?: string;
  type?: string;
  completed?: boolean;
  completedAt?: string | null;
}

export type TaskCounts = { total: number; pending: number; completed: number };
