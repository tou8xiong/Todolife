"use client";
import { Task } from "@/types/task";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteitems";
import { CheckCircle2, CalendarDays, Clock } from "lucide-react";

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-600 border-red-400",
  medium: "bg-yellow-100 text-yellow-600 border-yellow-400",
  low: "bg-green-100 text-green-600 border-green-400",
};

const formatCompletedAt = (iso?: string | null) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  try {
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return d.toISOString();
  }
};

interface DoneTaskCardProps {
  task: Task;
  onDelete: (id: number) => void;
}

export default function DoneTaskCard({ task, onDelete }: DoneTaskCardProps) {
  const priorityStyle = task.priority
    ? (PRIORITY_STYLES[task.priority] ?? "bg-gray-700 text-gray-400 border-gray-600")
    : null;

  return (
    <div className="w-full p-5 sm:p-7 shadow-md rounded-xl border-l-4 hover:shadow-xl transition-all duration-200 bg-white border-green-500 break-words">

      {/* Top row: title + priority badge */}
      <div className="flex items-start gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex-1 min-w-0 break-words">
          {task.title}
        </h2>
        {priorityStyle && (
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border capitalize ${priorityStyle}`}>
            {task.priority}
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="mt-2 break-words whitespace-normal text-gray-400">
          {task.description}
        </p>
      )}

      {/* Meta: due date / time + completed-at + delete */}
      <div className="flex flex-wrap items-center gap-3 mt-3">
        {task.date && (
          <p className="text-sm text-gray-400">
            📅 Due Date:{" "}
            <span className="font-medium font-sans text-gray-500">{task.date}</span>
          </p>
        )}
        {task.time && (
          <p className="flex text-sm border-l-2 pl-3">
            Time: <span className="text-sm font-sans ml-1">{task.time}</span>
          </p>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
            <CheckCircle2 size={13} className="shrink-0" />
            {formatCompletedAt(task.completedAt)}
          </span>
          <ConfirmDeleteButton
            itemName={task.title}
            itemId={task.id}
            onDelete={(id) => onDelete(id as number)}
          />
        </div>
      </div>
    </div>
  );
}
