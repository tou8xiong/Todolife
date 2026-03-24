"use client";
import { Task } from "@/types/task";

const formatCompletedAt = (iso?: string | null) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  try {
    return d.toLocaleString();
  } catch {
    return d.toISOString();
  }
};

interface DoneTaskCardProps {
  task: Task;
  onDelete: (id: number) => void;
}

export default function DoneTaskCard({ task, onDelete }: DoneTaskCardProps) {
  return (
    <li className="p-5 sm:p-6 bg-white shadow-md rounded-xl border-l-4 border-green-400 break-words mb-2">
      <div className="flex items-start gap-2">
        <h2 className="text-lg font-bold text-gray-800 break-words flex-1 min-w-0">{task.title}</h2>
        {task.priority && (
          <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border bg-green-100 text-green-600 border-green-400 shrink-0">
            {task.priority}
          </span>
        )}
      </div>
      {task.description && (
        <p className="text-gray-600 mt-1 break-words whitespace-normal">{task.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-3">
        {task.date && (
          <span>
            📅 Due Date: <span className="text-gray-700 font-medium font-sans">{task.date}</span>
          </span>
        )}
        {task.time && (
          <span className="border-l-2 pl-2">
            ⏰ Time: <span className="text-gray-700 font-medium font-sans">{task.time}</span>
          </span>
        )}
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this completed task?")) {
              onDelete(task.id);
            }
          }}
          className="ml-auto cursor-pointer px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Delete
        </button>
      </div>
      <p className="text-sm text-gray-400 mt-2">
        ✅ Done at:{" "}
        <span className="text-gray-700 font-medium font-sans">
          {formatCompletedAt(task.completedAt)}
        </span>
      </p>
    </li>
  );
}
