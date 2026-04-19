"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Task } from "@/types/task";
import DoneTaskCard from "@/components/ui/DoneTaskCard";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteitems";
import { CheckCircle2, Briefcase, BookOpen, Zap } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type TaskType = "work" | "study" | "activities";

const TASK_TYPES: {
  type: TaskType;
  labelKey: string;
  short: string;
  icon: React.ElementType;
  color: string;
  accent: string;
}[] = [
    { type: "work", labelKey: "work", short: "Work", icon: Briefcase, color: "text-blue-400", accent: "border-blue-400/50 bg-blue-400/10" },
    { type: "study", labelKey: "study", short: "Study", icon: BookOpen, color: "text-violet-400", accent: "border-violet-400/50 bg-violet-400/10" },
    { type: "activities", labelKey: "activities", short: "Acts", icon: Zap, color: "text-amber-400", accent: "border-amber-400/50 bg-amber-400/10" },
  ];

interface TaskTypeColumnProps {
  tasks: Task[];
  type: TaskType;
  label: string;
  icon: React.ElementType;
  color: string;
  selectedType: TaskType;
  onDelete: (id: number) => void;
  t: any;
}

function TaskTypeColumn({ tasks, type, label, icon: Icon, color, selectedType, onDelete, t }: TaskTypeColumnProps) {
  const filtered = tasks.filter((t) => t.type === type);
  const isVisible = selectedType === type;

  return (
    <div className={`${isVisible ? "flex" : "hidden"} sm:flex flex-col flex-1 min-w-0`}>
      {/* Column header */}
      <div className="flex items-center justify-between px-2.5 py-2 mb-2 rounded-xl bg-gray-800/60 border border-gray-700/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={15} className={`${color} shrink-0`} />
          <span className={`text-xs sm:text-sm font-bold ${color} truncate`}>{label}</span>
        </div>
        <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-gray-300 ml-1">
          {filtered.length}
        </span>
      </div>

      {/* Task list — scrollable, adapts height to viewport */}
      <div className="overflow-y-auto hide-scrollbar space-y-2 max-h-[58vh] sm:max-h-[calc(100vh-320px)]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 gap-2 rounded-xl border border-dashed border-gray-700 bg-white/5">
            <CheckCircle2 size={24} className="text-gray-500" />
            <p className="text-xs text-gray-400 text-center px-2">{t.tasks.noCompletedTasks}</p>
          </div>
        ) : (
          filtered.map((task) => (
            <DoneTaskCard key={task.id} task={task} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}

export default function DoneTasks() {
  const { t } = useLanguage();
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [selectedType, setSelectedType] = useState<TaskType>("work");
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const loadDoneTasks = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/tasks?email=${encodeURIComponent(userEmail)}`, { cache: "no-store" });
      const data = await res.json();
      const all: Task[] = data.tasks ?? [];
      const completedOnly = all
        .filter((t) => t.completed)
        .sort((a, b) => {
          const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return tb - ta;
        });
      setDoneTasks(completedOnly);
    } catch (e) {
      console.error("Failed to load done tasks", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
      if (currentUser?.email) loadDoneTasks(currentUser.email);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loadingUser || !user?.email) return;
    const onUpdated = () => loadDoneTasks(user.email);
    const onVisible = () => { if (document.visibilityState === "visible") loadDoneTasks(user.email); };
    window.addEventListener("tasksUpdated", onUpdated as EventListener);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("tasksUpdated", onUpdated as EventListener);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, loadingUser]);

  const handleDelete = async (id: number) => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/tasks?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      const updatedTasks = (data.tasks ?? []).filter((t: Task) => t.id !== id);
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, tasks: updatedTasks }),
      });
      window.dispatchEvent(new Event("tasksUpdated"));
      setDoneTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };

  const doClearAll = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/tasks?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      const updatedTasks = (data.tasks ?? []).filter((t: Task) => !t.completed);
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, tasks: updatedTasks }),
      });
      window.dispatchEvent(new Event("tasksUpdated"));
      setDoneTasks([]);
    } catch (e) {
      console.error("Failed to clear completed tasks", e);
    }
  };

  return (
    <div className="w-full min-h-screen bg-transparent font-serif">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="shrink-0 p-2 sm:p-2.5 rounded-xl bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30">
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-white leading-tight truncate">
                {t.tasks.completedTasks}
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                {doneTasks.length} {t.tasks.tasksDone}
              </p>
            </div>
          </div>

          {doneTasks.length > 0 && (
            <div className="shrink-0">
              <ConfirmDeleteButton
                itemName="all completed tasks"
                itemId="all"
                onDelete={() => doClearAll()}
              >
                <span className="hidden sm:inline">{t.clearAll}</span>
                <span className="sm:hidden">{t.clearAll}</span>
              </ConfirmDeleteButton>
            </div>
          )}
        </div>

        {/* ── Type tab switcher ── */}
        <div className="flex sm:hidden gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/50">
          {TASK_TYPES.map(({ type, labelKey, icon: Icon, color }) => {
            const label = t.tasks[labelKey as keyof typeof t.tasks];
            const count = doneTasks.filter((t) => t.type === type).length;
            const isActive = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-semibold transition-all duration-150 min-w-0
                  ${isActive ? "bg-white/20 text-white shadow-sm" : "text-gray-400 active:bg-white/10"}`}
              >
                <Icon size={13} className={`shrink-0 ${isActive ? color : ""}`} />
                <span className="truncate">{label}</span>
                <span className={`text-xs font-bold ${isActive ? color : "text-gray-400 dark:text-gray-500"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Columns / Empty state ── */}
        {doneTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-28 gap-4">
            <div className="p-4 sm:p-5 rounded-full bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <CheckCircle2 size={36} className="text-gray-400 dark:text-gray-500 sm:w-10 sm:h-10" />
            </div>
            <p className="text-gray-300 text-base sm:text-lg font-medium">{t.tasks.noCompletedTasks}</p>
            <p className="text-gray-400 text-sm">{t.tasks.completeTaskHint}</p>
          </div>
        ) : (
          <section className="flex gap-2 sm:gap-3 lg:gap-4">
            {TASK_TYPES.map(({ type, labelKey, icon, color }) => (
              <TaskTypeColumn
                key={type}
                tasks={doneTasks}
                type={type}
                label={t.tasks[labelKey as keyof typeof t.tasks]}
                icon={icon}
                color={color}
                selectedType={selectedType}
                onDelete={handleDelete}
                t={t}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
