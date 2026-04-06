"use client";
import { Task } from "@/types/task";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteitems";
import { CheckCircle2, CalendarDays, Clock } from "lucide-react";

const PRIORITY_STYLES: Record<string, string> = {
  high:   "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  low:    "bg-green-500/15 text-green-400 border-green-500/30",
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
    <div className="group relative bg-gray-800/70 border border-gray-700/60 rounded-xl p-3 sm:p-4
                    hover:border-amber-400/30 hover:bg-gray-800 transition-all duration-200 break-words">

      {/* Green left accent bar */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-green-500/50 group-hover:bg-green-400 transition-colors duration-200" />

      {/* Top row: title + priority badge */}
      <div className="flex items-start gap-2 pl-3">
        <h2 className="flex-1 text-sm font-bold text-white leading-snug break-words min-w-0">
          {task.title}
        </h2>
        {priorityStyle && (
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${priorityStyle}`}>
            {task.priority}
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="pl-3 mt-1.5 text-xs text-gray-400 leading-relaxed break-words whitespace-normal line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta: due date / time */}
      {(task.date || task.time) && (
        <div className="pl-3 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {task.date && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <CalendarDays size={10} className="text-gray-600 shrink-0" />
              {task.date}
            </span>
          )}
          {task.time && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <Clock size={10} className="text-gray-600 shrink-0" />
              {task.time}
            </span>
          )}
        </div>
      )}

      {/* Footer: completed-at + delete */}
      <div className="pl-3 mt-2.5 pt-2.5 border-t border-gray-700/50 flex items-center gap-2">
        {/* Completed timestamp — shrinks if delete button needs space */}
        <span className="flex items-center gap-1 text-[11px] text-green-500/80 min-w-0 flex-1">
          <CheckCircle2 size={10} className="shrink-0" />
          <span className="truncate">{formatCompletedAt(task.completedAt)}</span>
        </span>
        {/* Delete button stays on the right, never wraps */}
        <div className="shrink-0">
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
